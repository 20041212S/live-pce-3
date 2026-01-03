import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Process and clean the database URL for Neon pooler compatibility
// This function processes the DATABASE_URL and sets it back to process.env
// PrismaClient reads from process.env.DATABASE_URL automatically
function processDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  
  // During build time, DATABASE_URL might not be set - that's okay
  // It will be available at runtime in Vercel
  if (!url) {
    // In development/build, return undefined and let Prisma handle it
    if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
      // Only warn in production server-side (not during build)
      console.warn("DATABASE_URL environment variable is not set");
    }
    return undefined;
  }
  
  // For Neon pooler, ensure proper connection string format
  // Neon pooler works with Prisma, but we need to ensure SSL and proper settings
  let databaseUrl = url.trim();
  
  // Parse URL to ensure proper formatting
  try {
    const urlObj = new URL(databaseUrl);
    
    // Ensure sslmode=require is set (required for Neon)
    if (!urlObj.searchParams.has('sslmode')) {
      urlObj.searchParams.set('sslmode', 'require');
    }
    
    // Remove channel_binding parameter if present - it's not standard and may cause issues
    // Prisma/PostgreSQL drivers may not support this parameter
    if (urlObj.searchParams.has('channel_binding')) {
      urlObj.searchParams.delete('channel_binding');
    }
    
    // For Neon pooler with Prisma, we don't need additional parameters
    // Prisma handles connection pooling automatically
    databaseUrl = urlObj.toString();
  } catch (e) {
    // If URL parsing fails, try to manually remove channel_binding
    // This is a fallback for malformed URLs
    if (databaseUrl.includes('channel_binding')) {
      databaseUrl = databaseUrl
        .replace(/[&?]channel_binding=[^&]*/g, '')
        .replace(/channel_binding=[^&]*&?/g, '');
    }
    console.warn('Could not parse DATABASE_URL, using fallback cleanup:', e);
  }
  
  // Set the processed URL back to process.env so PrismaClient can read it
  process.env.DATABASE_URL = databaseUrl;
  return databaseUrl;
}

// Process the database URL before creating PrismaClient
// This is safe to call even if DATABASE_URL is not set (e.g., during build)
const processedDatabaseUrl = processDatabaseUrl();

// Prisma Client configuration for serverless environments (Vercel)
// For Neon, the pooler connection string should work directly with Prisma
// We use the pg adapter for proper PostgreSQL connection handling
function createPrismaClient(): PrismaClient {
  // Use the processed database URL (which may be undefined during build)
  const databaseUrl = processedDatabaseUrl || process.env.DATABASE_URL;
  
  // Always use adapter - Prisma 7.x requires it when using engine type "client"
  // During build, we'll use a dummy connection string if DATABASE_URL is not set
  // This allows the build to complete, but runtime will need the actual DATABASE_URL
  const connectionString = databaseUrl || "postgresql://dummy:dummy@localhost:5432/dummy?sslmode=disable";
  
  try {
    // Create PostgreSQL connection pool
    const pool = new Pool({ connectionString: connectionString });
    const adapter = new PrismaPg(pool);
    
    // Create PrismaClient with adapter
    return new PrismaClient({
      adapter: adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  } catch (error) {
    // Fallback: if adapter creation fails (e.g., during build), create without adapter
    // This should only happen during build when DATABASE_URL is not available
    console.warn("Failed to create Prisma adapter, using default client:", error);
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

// In production (Vercel serverless), we should reuse the client to avoid connection exhaustion
// Prisma Client is designed to be reused across requests in serverless environments
// This prevents creating too many database connections
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

// Export as default for consistency (supports both import styles)
export default prisma;
