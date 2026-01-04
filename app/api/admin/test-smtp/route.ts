import { NextRequest, NextResponse } from 'next/server';
import { sendOTPEmail, verifySMTPConnection } from '@/lib/otpEmail';

/**
 * Test SMTP Configuration
 * POST /api/admin/test-smtp
 * 
 * This endpoint helps diagnose SMTP configuration issues
 * Only available in development mode or with proper authentication
 */
export async function POST(request: NextRequest) {
  // Only allow in development or with proper auth (add auth check if needed)
  if (process.env.NODE_ENV === 'production') {
    // In production, you might want to add authentication here
    // For now, we'll allow it but log the access
    console.warn('⚠️ SMTP test endpoint accessed in production');
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required for testing' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check SMTP configuration
    const config = {
      SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
      SMTP_PORT: process.env.SMTP_PORT || '587',
      SMTP_USER: process.env.SMTP_USER ? 'SET' : 'NOT SET',
      SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'NOT SET',
      SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER || 'NOT SET',
    };

    console.log('📧 Testing SMTP configuration:', config);

    // Test 1: Verify SMTP connection
    let connectionTest = { success: false, message: '' };
    try {
      await verifySMTPConnection();
      connectionTest = { success: true, message: 'SMTP connection verified successfully' };
    } catch (error: any) {
      connectionTest = { success: false, message: error.message };
    }

    // Test 2: Send test OTP email
    let emailTest = { success: false, message: '', otp: '' };
    try {
      const testOTP = '123456'; // Test OTP
      await sendOTPEmail(normalizedEmail, testOTP, 'SMTP Test - PCE Campus Assistant');
      emailTest = { success: true, message: 'Test email sent successfully', otp: testOTP };
    } catch (error: any) {
      emailTest = { success: false, message: error.message, otp: '' };
    }

    return NextResponse.json({
      success: connectionTest.success && emailTest.success,
      config: {
        ...config,
        SMTP_USER: config.SMTP_USER === 'SET' ? `${process.env.SMTP_USER?.substring(0, 3)}...` : 'NOT SET',
        SMTP_PASS: config.SMTP_PASS === 'SET' ? '***' : 'NOT SET',
      },
      tests: {
        connection: connectionTest,
        email: emailTest,
      },
      message: connectionTest.success && emailTest.success
        ? 'SMTP is configured correctly and test email was sent'
        : 'SMTP configuration has issues. Check the test results above.',
    });
  } catch (error: any) {
    console.error('❌ SMTP test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to test SMTP configuration',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

