import { PrismaClient } from "@prisma/client";

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
processDatabaseUrl();

// Prisma Client configuration for serverless environments (Vercel)
// For Neon, the pooler connection string should work directly with Prisma
// PrismaClient automatically reads from process.env.DATABASE_URL
// If DATABASE_URL is not set, PrismaClient will throw an error at runtime (which is expected)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// In production (Vercel serverless), we should reuse the client to avoid connection exhaustion
// Prisma Client is designed to be reused across requests in serverless environments
// This prevents creating too many database connections
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

// Export as default for consistency (supports both import styles)
export default prisma;
