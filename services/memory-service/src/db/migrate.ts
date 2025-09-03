#!/usr/bin/env tsx

import { config } from 'dotenv'
import { runMigrations, closeConnections } from './index.js'

// Load environment variables
config()

async function migrate() {
  console.log('🔄 Running database migrations...')

  try {
    await runMigrations()
    console.log('✅ Migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await closeConnections()
  }
}

// Run migrations
migrate() 