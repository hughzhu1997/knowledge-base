// run-migration.js
// Script to run database migrations for adding docType field to documents table

const { sequelize } = require('../config/database');
const migration = require('../migrations/add-doctype-to-documents');

async function runMigration() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Run the migration
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    
    console.log('✅ Migration completed successfully');
    console.log('📋 Added docType field to documents table with values: SOP, Review, Research, General');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();


