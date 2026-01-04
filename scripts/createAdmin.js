const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Support both PostgreSQL (Vercel) and SQLite (local dev)
function buildPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }
  
  if (databaseUrl.startsWith('file:')) {
    // SQLite for local development
    const cleaned = String(databaseUrl).trim().replace(/^["']|["']$/g, '');
    let dbPath = cleaned.replace(/^file:/i, '').replace(/^\/+/, '');
    if (dbPath.startsWith('./')) {
      dbPath = dbPath.slice(2);
    }
    const absolutePath = path.resolve(process.cwd(), dbPath || 'prisma/dev.db');
    const adapter = new PrismaBetterSqlite3({ url: absolutePath });
    return new PrismaClient({ adapter, log: ['error', 'warn'] });
  } else {
    // PostgreSQL for Vercel/production
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter, log: ['error', 'warn'] });
  }
}

const prisma = buildPrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('chat@2025', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'chatbot.prc2025@gmail.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'chatbot.prc2025@gmail.com',
        passwordHash: hashedPassword,
        role: 'admin',
      },
    });

    console.log('✅ Admin user created:', admin.email);
    console.log('📧 Email: chatbot.prc2025@gmail.com');
    console.log('🔑 Password: chat@2025');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();


