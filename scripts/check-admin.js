/**
 * Check if admin user exists
 * Run with: node scripts/check-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

function buildPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }
  
  if (databaseUrl.startsWith('file:')) {
    // SQLite
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
    const path = require('path');
    const dbPath = databaseUrl.replace(/^file:/i, '').replace(/^\/+/, '');
    const absolutePath = path.resolve(process.cwd(), dbPath || 'prisma/dev.db');
    const adapter = new PrismaBetterSqlite3({ url: absolutePath });
    return new PrismaClient({ adapter });
  } else {
    // PostgreSQL
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }
}

const prisma = buildPrismaClient();

async function checkAdmin() {
  try {
    console.log('🔍 Checking for admin users...\n');
    
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
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('\n💡 To create an admin user, run:');
      console.log('   npm run db:seed');
      console.log('   OR');
      console.log('   node scripts/createAdmin.js');
    } else {
      console.log(`✅ Found ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'No name'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt.toLocaleString()}`);
        console.log('');
      });
      
      const admins = users.filter(u => u.role === 'admin');
      if (admins.length === 0) {
        console.log('⚠️  No admin users found!');
        console.log('💡 Create an admin user with: npm run db:seed');
      } else {
        console.log(`✅ Found ${admins.length} admin user(s)`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking admin:', error.message);
    if (error.message.includes('DATABASE_URL') || error.message.includes('not set')) {
      console.error('\n💡 Make sure DATABASE_URL is set in your .env file');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();

