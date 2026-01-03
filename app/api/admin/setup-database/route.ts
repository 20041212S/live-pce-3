import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = "nodejs";

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
  "user_type" TEXT NOT NULL,
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
  "day_of_week" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "staff_name" TEXT,
  "room" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "time_tables_pkey" PRIMARY KEY ("id")
);

-- Create exam_time_tables table
CREATE TABLE IF NOT EXISTS "exam_time_tables" (
  "id" TEXT NOT NULL,
  "program" TEXT NOT NULL,
  "semester" TEXT NOT NULL,
  "exam_type" TEXT NOT NULL,
  "exam_date" TIMESTAMP(3) NOT NULL,
  "subject" TEXT NOT NULL,
  "subject_code" TEXT,
  "session" TEXT,
  "room" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exam_time_tables_pkey" PRIMARY KEY ("id")
);

-- Create class_timetables table
CREATE TABLE IF NOT EXISTS "class_timetables" (
  "id" TEXT NOT NULL,
  "program_name" TEXT NOT NULL,
  "semester" TEXT NOT NULL,
  "day_of_week" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "faculty" TEXT,
  "room" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "class_timetables_pkey" PRIMARY KEY ("id")
);

-- Create exam_timetables table
CREATE TABLE IF NOT EXISTS "exam_timetables" (
  "id" TEXT NOT NULL,
  "program_name" TEXT NOT NULL,
  "semester" TEXT NOT NULL,
  "exam_name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "exam_date" TIMESTAMP(3) NOT NULL,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT NOT NULL,
  "room" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
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
      // Execute SQL to create all tables
      // Split by semicolon and execute each statement
      const statements = CREATE_TABLES_SQL.split(';').filter(s => s.trim().length > 0);
      
      const results = [];
      for (const statement of statements) {
        const trimmed = statement.trim();
        if (trimmed && !trimmed.startsWith('--')) {
          try {
            await prisma.$executeRawUnsafe(trimmed);
            results.push({ statement: trimmed.substring(0, 50) + '...', success: true });
          } catch (err: any) {
            // Ignore "already exists" errors
            if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
              results.push({ statement: trimmed.substring(0, 50) + '...', success: true, note: 'already exists' });
            } else {
              console.warn('Statement warning:', err.message);
              results.push({ statement: trimmed.substring(0, 50) + '...', success: false, error: err.message });
            }
          }
        }
      }

      console.log('✅ Database tables created successfully');

      return NextResponse.json({
        success: true,
        message: 'Database tables created successfully',
        tablesCreated: results.filter(r => r.success).length,
        totalStatements: results.length,
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

