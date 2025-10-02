// add-doctype-to-documents.js
// Database migration script to add docType field to documents table
// Adds enum field with values: ["SOP", "Review", "Research", "General"]

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Create enum type for docType using raw SQL
      await queryInterface.sequelize.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_documents_doctype') THEN
            CREATE TYPE "public"."enum_documents_doctype" AS ENUM('SOP', 'Review', 'Research', 'General');
          END IF;
        END $$;
      `);

      // Add docType column using raw SQL
      await queryInterface.sequelize.query(`
        ALTER TABLE "documents" 
        ADD COLUMN "docType" "public"."enum_documents_doctype" DEFAULT 'General';
      `);

      // Add comment to the column
      await queryInterface.sequelize.query(`
        COMMENT ON COLUMN "documents"."docType" IS 'Document type classification: SOP (Standard Operating Procedure), Review (Review Document), Research (Research Document), General (General Document)';
      `);

      console.log('✅ Successfully added docType column to documents table');
    } catch (error) {
      console.error('❌ Error adding docType column:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove docType column from documents table
      await queryInterface.removeColumn('documents', 'docType');
      
      // Drop the enum type if it exists (PostgreSQL specific)
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_documents_docType";');
      
      console.log('✅ Successfully removed docType column from documents table');
    } catch (error) {
      console.error('❌ Error removing docType column:', error);
      throw error;
    }
  }
};
