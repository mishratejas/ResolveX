// clear-db-simple.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resolvex';

const clearDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the database
    const db = mongoose.connection.db;

    // Get all collections
    const collections = await db.listCollections().toArray();
    
    console.log(`📊 Found ${collections.length} collections:`);
    collections.forEach(c => console.log(`   - ${c.name}`));

    console.log('\n🗑️  Dropping all collections...');

    // Drop each collection
    for (const collection of collections) {
      try {
        await db.dropCollection(collection.name);
        console.log(`   ✅ Dropped: ${collection.name}`);
      } catch (error) {
        console.log(`   ❌ Failed to drop ${collection.name}: ${error.message}`);
      }
    }

    console.log('\n✨ All collections dropped successfully!');
    console.log('📝 Database is now empty. Collections will be recreated when you run your app.');

  } catch (error) {
    console.error('\n❌ Error clearing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

clearDatabase();