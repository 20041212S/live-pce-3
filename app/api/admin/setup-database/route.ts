import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const runtime = "nodejs";

/**
 * POST /api/admin/setup-database
 * 
 * One-time endpoint to push Prisma schema to database
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

    console.log('🔄 Starting database schema push...');
    
    // Run prisma db push
    // Note: This requires prisma to be available in node_modules
    try {
      const output = execSync('npx prisma db push --skip-generate', {
        encoding: 'utf-8',
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL,
        },
        stdio: 'pipe',
        timeout: 60000, // 60 second timeout
      });

      console.log('✅ Database schema pushed successfully');
      console.log('Output:', output);

      return NextResponse.json({
        success: true,
        message: 'Database schema pushed successfully',
        output: output.substring(0, 500), // Limit output length
      });
    } catch (execError: any) {
      console.error('❌ Prisma db push failed:', execError);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to push schema',
        message: execError.message || 'Unknown error',
        output: execError.stdout?.toString() || execError.stderr?.toString() || '',
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

