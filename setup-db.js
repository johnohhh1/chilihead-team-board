#!/usr/bin/env node

/**
 * Database Setup Script for ChiliHead Team Board
 * Run this after setting DATABASE_URL in .env.local
 * 
 * Usage: node setup-db.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL or POSTGRES_URL not found in .env.local');
  console.error('Please set up your .env.local file with your PostgreSQL connection string');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function setupDatabase() {
  console.log('🌶️  ChiliHead Team Board - Database Setup\n');
  
  try {
    // Test connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful!\n');

    // Read schema file
    console.log('📄 Reading schema file...');
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded\n');

    // Execute schema
    console.log('🔨 Creating team_tasks table and indexes...');
    await pool.query(schema);
    console.log('✅ Database schema created successfully!\n');

    // Verify table exists
    console.log('🔍 Verifying table creation...');
    const result = await pool.query(`
      SELECT COUNT(*) as count FROM team_tasks;
    `);
    console.log(`✅ Table verified! Current task count: ${result.rows[0].count}\n`);

    console.log('🎉 Database setup complete!');
    console.log('\nYou can now run: npm run dev\n');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup
setupDatabase();
