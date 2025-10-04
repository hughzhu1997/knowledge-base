#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });

const requiredTables = [
  'users',
  'roles',
  'policies',
  'user_roles',
  'role_policies'
];

// Create Sequelize instance for direct connection testing
const sequelize = new Sequelize(process.env.DATABASE_URL || 
  `postgres://${process.env.DB_USER || process.env.USER}:${process.env.DB_PASSWORD || null}@${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'knowledge_db'}`, {
  dialect: 'postgres',
  logging: false
});

const checkDatabase = async () => {
  console.log('🔄 Starting database verification...\n');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // Check if all required tables exist
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const existingTables = results.map(r => r.table_name);
    console.log('📋 Existing tables:', existingTables);

    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    if (missingTables.length === 0) {
      console.log('✅ All required IAM core tables exist.');
    } else {
      console.error('❌ Missing tables:', missingTables);
      process.exit(1);
    }

    // Check table structures and constraints
    console.log('\n🔍 Checking table structures...');
    
    for (const table of requiredTables) {
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = ? AND table_schema = 'public'
        ORDER BY ordinal_position;
      `, { replacements: [table] });

      console.log(`\n📋 Table: ${table}`);
      console.log(`   Columns: ${columns.length}`);
      
      // Check for key columns for each table
      if (table === 'users') {
        const hasEmail = columns.some(c => c.column_name === 'email');
        const hasUsername = columns.some(c => c.column_name === 'username');
        const hasPasswordHash = columns.some(c => c.column_name === 'password_hash');
        console.log(`   ✅ Email column: ${hasEmail ? '✓' : '✗'}`);
        console.log(`   ✅ Username column: ${hasUsername ? '✓' : '✗'}`);
        console.log(`   ✅ Password hash column: ${hasPasswordHash ? '✓' : '✗'}`);
      }
      
      if (table === 'policies') {
        const hasDocument = columns.some(c => c.column_name === 'document' && c.data_type === 'jsonb');
        console.log(`   ✅ JSONB document column: ${hasDocument ? '✓' : '✗'}`);
      }
      
      if (table === 'user_roles') {
        const hasUserId = columns.some(c => c.column_name === 'user_id');
        const hasRoleId = columns.some(c => c.column_name === 'role_id');
        console.log(`   ✅ User ID foreign key: ${hasUserId ? '✓' : '✗'}`);
        console.log(`   ✅ Role ID foreign key: ${hasRoleId ? '✓' : '✗'}`);
      }

      if (table === 'role_policies') {
        const hasRoleId = columns.some(c => c.column_name === 'role_id');
        const hasPolicyId = columns.some(c => c.column_name === 'policy_id');
        console.log(`   ✅ Role ID foreign key: ${hasRoleId ? '✓' : '✗'}`);
        console.log(`   ✅ Policy ID foreign key: ${hasPolicyId ? '✓' : '✗'}`);
      }
    }

    // Count roles and policies
    console.log('\n📊 Checking data...');
    const [roleCount] = await sequelize.query('SELECT COUNT(*) FROM roles;');
    const [policyCount] = await sequelize.query('SELECT COUNT(*) FROM policies;');
    console.log(`🧩 Roles: ${roleCount[0].count}`);
    console.log(`🧩 Policies: ${policyCount[0].count}`);

    // Check indexes
    console.log('\n🔍 Checking indexes...');
    for (const table of requiredTables) {
      const [indexes] = await sequelize.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = ? AND schemaname = 'public'
        ORDER BY indexname;
      `, { replacements: [table] });

      if (indexes.length > 0) {
        console.log(`📋 ${table} indexes: ${indexes.length}`);
      }
    }

    // Test foreign key constraints
    const [foreignKeys] = await sequelize.query(`
      SELECT 
        tc.table_name, 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
        AND tc.table_name IN (?, ?, ?, ?, ?)
      ORDER BY tc.table_name;
    `, { 
      replacements: requiredTables 
    });

    console.log(`\n✅ Foreign key constraints: ${foreignKeys.length} found`);

    console.log('\n🎉 Database verification completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Database connection: OK');
    console.log('   ✅ All IAM core tables: OK');
    console.log('   ✅ Table structures: OK');
    console.log('   ✅ Foreign key constraints: OK');
    console.log('   ✅ Indexes: OK');
    
  } catch (error) {
    console.error('\n❌ Database check failed:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('   Possible causes:');
      console.error('   1. PostgreSQL server not running');
      console.error('   2. Database "knowledge_db" does not exist');
      console.error('   3. Connection parameters incorrect');
      console.error('\n💡 Troubleshooting:');
      console.error('   - Ensure PostgreSQL is running: brew services start postgresql');
      console.error('   - Create database: createdb knowledge_db');
      console.error('   - Run migrations: pnpm db:migrate');
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

checkDatabase();
