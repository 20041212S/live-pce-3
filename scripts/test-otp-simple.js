/**
 * Simple OTP Test Script
 * 
 * This script tests if SMTP is configured correctly
 * Run with: npm run test:otp your-email@gmail.com
 */

import { sendOTPEmail } from '../lib/otpEmail.js';

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: npm run test:otp your-email@gmail.com');
  process.exit(1);
}

async function testOTP() {

console.log('🔍 Checking SMTP Configuration...\n');

// Check environment variables
const checks = {
  'SMTP_HOST': process.env.SMTP_HOST || 'smtp.gmail.com (default)',
  'SMTP_PORT': process.env.SMTP_PORT || '587 (default)',
  'SMTP_USER': process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}...` : '❌ NOT SET',
  'SMTP_PASS': process.env.SMTP_PASS ? '✅ SET' : '❌ NOT SET',
  'SMTP_FROM': process.env.SMTP_FROM || process.env.SMTP_USER || '❌ NOT SET',
};

console.log('Configuration Status:');
Object.entries(checks).forEach(([key, value]) => {
  const status = value.includes('❌') ? '❌' : '✅';
  console.log(`  ${status} ${key}: ${value}`);
});

console.log('\n📧 Attempting to send test OTP email...\n');

const testOTP = '123456';

  try {
    await sendOTPEmail(email, testOTP, 'Test OTP - PCE Campus Assistant');
    console.log('✅ SUCCESS! Test email sent to:', email);
    console.log('📬 Check your inbox for OTP: 123456');
    console.log('   (Also check spam folder)');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ FAILED to send email');
    console.error('Error:', error.message);
    console.error('\n💡 Common fixes:');
    
    if (error.message.includes('not configured')) {
      console.error('   1. Add SMTP_USER and SMTP_PASS to .env file');
      console.error('   2. For Gmail, use App Password (not regular password)');
      console.error('   3. Get App Password: https://myaccount.google.com/apppasswords');
    } else if (error.message.includes('Invalid login') || error.message.includes('BadCredentials')) {
      console.error('   1. Make sure you\'re using Gmail App Password');
      console.error('   2. Not your regular Gmail password');
      console.error('   3. Generate new App Password: https://myaccount.google.com/apppasswords');
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.error('   1. Check your internet connection');
      console.error('   2. Verify SMTP_HOST and SMTP_PORT are correct');
    }
    
    process.exit(1);
  }
}

// Run the test
testOTP().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

