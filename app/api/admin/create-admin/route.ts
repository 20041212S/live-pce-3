import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/create-admin
 * 
 * Creates an admin user (one-time setup for Vercel)
 * 
 * SECURITY: In production, protect this endpoint or use it only once
 * You can add a secret token check or disable after first use
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST /api/admin/create-admin - Creating admin user...');
    
    // Optional: Add a secret token check for security
    const secretToken = process.env.ADMIN_CREATE_SECRET;
    if (secretToken) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${secretToken}`) {
        console.warn('⚠️ Unauthorized attempt to create admin (missing/invalid token)');
        return NextResponse.json(
          { error: 'Unauthorized. Provide ADMIN_CREATE_SECRET in Authorization header.' },
          { status: 401 }
        );
      }
    }

    let body;
    try {
      body = await request.json();
      console.log('📥 Request body received:', { email: body?.email, hasPassword: !!body?.password });
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          error: 'User already exists',
          email: existingUser.email,
          role: existingUser.role,
        },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: name || 'Admin User',
        email: normalizedEmail,
        passwordHash,
        role: 'admin',
      },
    });

    console.log('✅ Admin user created:', admin.email);

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error('❌ Error creating admin:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create admin user',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/create-admin
 * 
 * Check if admin users exist
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/create-admin - Checking for admin users...');
    
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const admins = users.filter(u => u.role === 'admin');

    console.log(`✅ Found ${users.length} total users, ${admins.length} admins`);

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      adminCount: admins.length,
      admins: admins.map(u => ({
        email: u.email,
        name: u.name,
        createdAt: u.createdAt,
      })),
      allUsers: users.map(u => ({
        email: u.email,
        name: u.name,
        role: u.role,
      })),
    });
  } catch (error: any) {
    console.error('❌ Error checking users:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
    });
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to check users',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

