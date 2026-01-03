import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = "nodejs";

/**
 * SQL statements to drop existing tables (if they have wrong schema)
 * This ensures we can recreate them with correct column names
 */
const DROP_TABLES_SQL = `
-- Drop tables in reverse dependency order to avoid foreign key errors
DROP TABLE IF EXISTS "messages" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "conversations" CASCADE;
DROP TABLE IF EXISTS "time_tables" CASCADE;
DROP TABLE IF EXISTS "exam_time_tables" CASCADE;
DROP TABLE IF EXISTS "class_timetables" CASCADE;
DROP TABLE IF EXISTS "exam_timetables" CASCADE;
DROP TABLE IF EXISTS "email_otps" CASCADE;
DROP TABLE IF EXISTS "client_users" CASCADE;
DROP TABLE IF EXISTS "academic_pdfs" CASCADE;
DROP TABLE IF EXISTS "contacts" CASCADE;
DROP TABLE IF EXISTS "knowledge" CASCADE;
DROP TABLE IF EXISTS "rooms" CASCADE;
DROP TABLE IF EXISTS "fees" CASCADE;
DROP TABLE IF EXISTS "staff" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
`;

/**
 * SQL statements to create all tables based on Prisma schema
 * This is a programmatic approach that works in serverless environments
 */
const CREATE_TABLES_SQL = `
-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'admin',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create staff table
CREATE TABLE IF NOT EXISTS "staff" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "designation" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "avatar_url" TEXT,
  "qualifications" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- Create fees table
CREATE TABLE IF NOT EXISTS "fees" (
  "id" TEXT NOT NULL,
  "program_name" TEXT NOT NULL,
  "academic_year" TEXT NOT NULL,
  "year_or_semester" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "amount" DECIMAL(65,30) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "fees_pkey" PRIMARY KEY ("id")
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS "rooms" (
  "id" TEXT NOT NULL,
  "room_code" TEXT NOT NULL,
  "building_name" TEXT NOT NULL,
  "floor" TEXT NOT NULL,
  "text_directions" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "image_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS "conversations" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "client_user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- Create messages table
CREATE TABLE IF NOT EXISTS "messages" (
  "id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "sender" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "images" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- Create knowledge table
CREATE TABLE IF NOT EXISTS "knowledge" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "image_url" TEXT,
  "image_description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "knowledge_pkey" PRIMARY KEY ("id")
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT NOT NULL,
  "actor_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entity_type" TEXT,
  "entity_id" TEXT,
  "severity" TEXT NOT NULL DEFAULT 'INFO',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Create client_users table
CREATE TABLE IF NOT EXISTS "client_users" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "mobile" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "userType" TEXT NOT NULL,
  "email_verified" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_users_pkey" PRIMARY KEY ("id")
);

-- Create email_otps table
CREATE TABLE IF NOT EXISTS "email_otps" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "otp_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "last_sent_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

-- Create time_tables table
CREATE TABLE IF NOT EXISTS "time_tables" (
  "id" TEXT NOT NULL,
  "program" TEXT NOT NULL,
  "semester" TEXT NOT NULL,
  "section" TEXT,
  "dayOfWeek" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "staffName" TEXT,
  "room" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "time_tables_pkey" PRIMARY KEY ("id")
);

-- Create exam_time_tables table
CREATE TABLE IF NOT EXISTS "exam_time_tables" (
  "id" TEXT NOT NULL,
  "program" TEXT NOT NULL,
  "semester" TEXT NOT NULL,
  "examType" TEXT NOT NULL,
  "examDate" TIMESTAMP(3) NOT NULL,
  "subject" TEXT NOT NULL,
  "subjectCode" TEXT,
  "session" TEXT,
  "room" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exam_time_tables_pkey" PRIMARY KEY ("id")
);

-- Create class_timetables table
CREATE TABLE IF NOT EXISTS "class_timetables" (
  "id" TEXT NOT NULL,
  "programName" TEXT NOT NULL,
  "semester" TEXT NOT NULL,
  "dayOfWeek" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "faculty" TEXT,
  "room" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "class_timetables_pkey" PRIMARY KEY ("id")
);

-- Create exam_timetables table
CREATE TABLE IF NOT EXISTS "exam_timetables" (
  "id" TEXT NOT NULL,
  "programName" TEXT NOT NULL,
  "semester" TEXT NOT NULL,
  "examName" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "examDate" TIMESTAMP(3) NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "room" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exam_timetables_pkey" PRIMARY KEY ("id")
);

-- Create academic_pdfs table
CREATE TABLE IF NOT EXISTS "academic_pdfs" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "semester" TEXT,
  "subject" TEXT,
  "category" TEXT,
  "file_url" TEXT NOT NULL,
  "uploaded_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "academic_pdfs_pkey" PRIMARY KEY ("id")
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS "contacts" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "department" TEXT,
  "designation" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "category" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "rooms_room_code_key" ON "rooms"("room_code");
CREATE UNIQUE INDEX IF NOT EXISTS "client_users_email_key" ON "client_users"("email");
CREATE INDEX IF NOT EXISTS "email_otps_email_idx" ON "email_otps"("email");
CREATE INDEX IF NOT EXISTS "academic_pdfs_semester_idx" ON "academic_pdfs"("semester");
CREATE INDEX IF NOT EXISTS "academic_pdfs_subject_idx" ON "academic_pdfs"("subject");
CREATE INDEX IF NOT EXISTS "academic_pdfs_category_idx" ON "academic_pdfs"("category");
CREATE INDEX IF NOT EXISTS "contacts_category_idx" ON "contacts"("category");

-- Create foreign key constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_conversation_id_fkey'
  ) THEN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" 
      FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_actor_id_fkey'
  ) THEN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" 
      FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
`;

/**
 * POST /api/admin/setup-database
 * 
 * One-time endpoint to create database tables
 * This should be called once to create all tables
 * 
 * SECURITY: In production, you should protect this endpoint with authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { 
          error: 'DATABASE_URL is not set',
          message: 'Please configure DATABASE_URL in Vercel environment variables'
        },
        { status: 500 }
      );
    }

    console.log('🔄 Starting database schema creation...');
    
    try {
      // First, drop existing tables to fix any schema mismatches
      console.log('🗑️ Dropping existing tables (if any)...');
      const dropStatements = DROP_TABLES_SQL
        .split(';')
        .filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));
      
      for (const statement of dropStatements) {
        const trimmed = statement.trim();
        if (trimmed) {
          try {
            await prisma.$executeRawUnsafe(trimmed);
            console.log(`✅ Dropped: ${trimmed.substring(0, 50)}`);
          } catch (err: any) {
            // Ignore errors if tables don't exist
            if (!err.message?.includes('does not exist')) {
              console.warn(`⚠️ Drop warning: ${err.message}`);
            }
          }
        }
      }
      
      // Execute SQL to create all tables
      // Better approach: Execute the entire SQL block, then verify
      const results: any[] = [];
      let successCount = 0;
      
      // Split SQL into logical blocks (separate CREATE TABLE statements)
      // Handle DO blocks separately as they contain semicolons
      const sqlBlocks = CREATE_TABLES_SQL
        .split(/(?=CREATE TABLE|CREATE UNIQUE INDEX|CREATE INDEX|DO \$\$)/)
        .filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));
      
      for (const block of sqlBlocks) {
        const trimmed = block.trim();
        if (!trimmed || trimmed.startsWith('--')) continue;
        
        // Ensure statement ends with semicolon
        const statement = trimmed.endsWith(';') ? trimmed : trimmed + ';';
        
        try {
          await prisma.$executeRawUnsafe(statement);
          successCount++;
          const preview = statement.substring(0, 100).replace(/\s+/g, ' ');
          results.push({ 
            statement: preview, 
            success: true 
          });
          console.log(`✅ Executed: ${preview}`);
        } catch (err: any) {
          // Ignore "already exists" errors - these are fine
          const errorMsg = err.message || String(err) || '';
          const isAlreadyExists = 
            errorMsg.includes('already exists') || 
            errorMsg.includes('duplicate') ||
            (errorMsg.includes('relation') && errorMsg.includes('already')) ||
            errorMsg.includes('constraint') && errorMsg.includes('already');
          
          if (isAlreadyExists) {
            successCount++;
            results.push({ 
              statement: statement.substring(0, 100).replace(/\s+/g, ' '), 
              success: true, 
              note: 'already exists' 
            });
            console.log(`ℹ️ Already exists: ${statement.substring(0, 50)}`);
          } else {
            console.error(`❌ Error executing statement:`, errorMsg);
            results.push({ 
              statement: statement.substring(0, 100).replace(/\s+/g, ' '), 
              success: false, 
              error: errorMsg.substring(0, 200) 
            });
          }
        }
      }

      // Verify tables were created by checking if client_users table exists
      let verification = { exists: false, error: null as string | null };
      try {
        await prisma.$queryRaw`SELECT 1 FROM client_users LIMIT 1`;
        verification.exists = true;
      } catch (err: any) {
        verification.error = err.message || String(err);
      }

      console.log('✅ Database setup completed');
      console.log(`Successfully executed ${successCount} statements`);

      return NextResponse.json({
        success: true,
        message: verification.exists 
          ? 'Database tables created successfully' 
          : 'SQL executed but tables may not exist yet',
        tablesCreated: successCount,
        totalStatements: results.length,
        verification: verification,
        details: results.slice(0, 20), // Show first 20 results
      });
    } catch (error: any) {
      console.error('❌ Database setup failed:', error);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to create tables',
        message: error.message || 'Unknown error',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ Setup database error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred',
    }, { status: 500 });
  }
}

/**
 * GET /api/admin/setup-database
 * 
 * Check database setup status
 */
export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    // Try to query a table to see if schema exists
    try {
      await prisma.$queryRaw`SELECT 1 FROM client_users LIMIT 1`;
      
      return NextResponse.json({
        status: 'ready',
        message: 'Database tables exist',
      });
    } catch (error: any) {
      if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
        return NextResponse.json({
          status: 'needs_setup',
          message: 'Database tables need to be created',
          action: 'POST to this endpoint to create tables',
        });
      }
      throw error;
    }
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message || 'Unknown error',
    }, { status: 500 });
  }
}


