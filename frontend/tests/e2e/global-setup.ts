import { cleanDatabase } from './setup/db-helpers';

// NOTE: Global setup - runs once before all tests
export default async function globalSetup() {
  console.log('🧹 Cleaning test database...');

  try {
    await cleanDatabase();
    console.log('✅ Test database ready');
  } catch (error) {
    console.error('❌ Failed to clean test database:', error);
    throw error;
  }
}
