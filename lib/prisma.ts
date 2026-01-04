import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Process and clean the database URL for Neon pooler compatibility
function processDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  
  if (!url) {
    if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
      console.warn("⚠️ DATABASE_URL environment variable is not set");
    }
    return undefined;
  }
  
  let databaseUrl = url.trim();
  
  // Parse and clean the URL
  try {
    const urlObj = new URL(databaseUrl);
    
    // Ensure sslmode=require is set (required for Neon)
    if (!urlObj.searchParams.has('sslmode')) {
      urlObj.searchParams.set('sslmode', 'require');
    }
    
    // Remove channel_binding parameter - not supported by Prisma/pg
    if (urlObj.searchParams.has('channel_binding')) {
      urlObj.searchParams.delete('channel_binding');
    }
    
    databaseUrl = urlObj.toString();
  } catch (e) {
    // Fallback: manually remove channel_binding if URL parsing fails
    if (databaseUrl.includes('channel_binding')) {
      databaseUrl = databaseUrl
        .replace(/[&?]channel_binding=[^&]*/g, '')
        .replace(/channel_binding=[^&]*&?/g, '');
    }
    console.warn('⚠️ Could not parse DATABASE_URL, using fallback cleanup');
  }
  
  // Update process.env with cleaned URL
  process.env.DATABASE_URL = databaseUrl;
  return databaseUrl;
}

// Helper function to create a dummy adapter for build-time safety
function createDummyAdapter(): PrismaPg {
  try {
    // Create a minimal pool that won't attempt connections during build
    const dummyPool = new Pool({
      connectionString: "postgresql://dummy:dummy@localhost:5432/dummy",
      max: 1,
      // Prevent actual connection attempts during build
      connectionTimeoutMillis: 1,
    });
    return new PrismaPg(dummyPool);
  } catch (error) {
    // If Pool creation fails, try with absolute minimal config
    console.warn("⚠️ Failed to create pool for dummy adapter, retrying with minimal config");
    try {
      const minimalPool = new Pool({
        connectionString: "postgresql://dummy:dummy@localhost:5432/dummy",
      });
      return new PrismaPg(minimalPool);
    } catch (retryError) {
      // Last resort: create pool without any options
      console.error("❌ Critical: Failed to create dummy adapter pool");
      throw new Error("Unable to create Prisma adapter. This should not happen.");
    }
  }
}

// Prisma Client configuration for serverless environments (Vercel)
// For Neon, we use the pg adapter as required by Prisma 7.x
function createPrismaClient(): PrismaClient {
  // Always ensure we have an adapter - this is required by Prisma 7.x
  let adapter: PrismaPg;
  
  // Process and clean the database URL
  const processedUrl = processDatabaseUrl();
  const databaseUrl = processedUrl || process.env.DATABASE_URL;
  
  // Validate DATABASE_URL - if not set, use dummy adapter for build compatibility
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set. Database operations will fail.");
    // Prisma 7.x requires an adapter, so we create a dummy pool with invalid connection
    // This allows the build to succeed, but database operations will fail at runtime
    adapter = createDummyAdapter();
    return new PrismaClient({
      adapter: adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  
  if (databaseUrl.includes("dummy:dummy")) {
    console.error("❌ DATABASE_URL appears to be a dummy value.");
    // Still provide an adapter to satisfy Prisma 7.x requirements
    adapter = createDummyAdapter();
    return new PrismaClient({
      adapter: adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  
  try {
    // Create PostgreSQL connection pool optimized for serverless/Neon
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 1, // Single connection per serverless function instance
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      // SSL is configured via connection string (sslmode=require)
    });
    
    // Create Prisma adapter with the pool
    adapter = new PrismaPg(pool);
    
    // Create PrismaClient with adapter (required for Prisma 7.x)
    const client = new PrismaClient({
      adapter: adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
    
    console.log("✅ Prisma Client initialized with adapter");
    return client;
  } catch (error: any) {
    console.error("❌ Failed to create Prisma client with adapter:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      databaseUrlPresent: !!databaseUrl,
      databaseUrlPreview: databaseUrl ? `${databaseUrl.substring(0, 30)}...` : "not set",
    });
    
    // Fallback: create with dummy adapter to satisfy Prisma 7.x requirements
    // This allows the build to succeed, but database operations will fail at runtime
    console.warn("⚠️ Attempting fallback: PrismaClient with dummy adapter");
    adapter = createDummyAdapter();
    return new PrismaClient({
      adapter: adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
}

// Safely create Prisma client with error handling for build-time safety
// IMPORTANT: Always ensure adapter is provided - Prisma 7.x requires it
let prisma: PrismaClient;
try {
  if (globalForPrisma.prisma) {
    prisma = globalForPrisma.prisma;
  } else {
    // Create new client with adapter
    prisma = createPrismaClient();
    // Verify adapter was set (defensive check)
    if (!prisma) {
      throw new Error("PrismaClient creation returned undefined");
    }
  }
} catch (error: any) {
  console.error("❌ Critical error creating Prisma client, using fallback:", error);
  // Ultimate fallback: create with dummy adapter - MUST have adapter
  try {
    const fallbackAdapter = createDummyAdapter();
    prisma = new PrismaClient({
      adapter: fallbackAdapter,
      log: ["error"],
    });
  } catch (fallbackError: any) {
    console.error("❌ Even fallback failed:", fallbackError);
    // Last resort: try creating with minimal adapter
    const lastResortPool = new Pool({ connectionString: "postgresql://dummy:dummy@localhost:5432/dummy" });
    const lastResortAdapter = new PrismaPg(lastResortPool);
    prisma = new PrismaClient({
      adapter: lastResortAdapter,
      log: ["error"],
    });
  }
}

export { prisma };

// In production (Vercel serverless), we should reuse the client to avoid connection exhaustion
// Prisma Client is designed to be reused across requests in serverless environments
// This prevents creating too many database connections
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

// Export as default for consistency (supports both import styles)
export default prisma;
