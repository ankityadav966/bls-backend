import mongoose from 'mongoose';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/bls_and_company';
const ATLAS_URI = 'mongodb+srv://akraoshab0009_db_user:ZzWRJCEJkfojlSt8@cluster0.wu3i78y.mongodb.net/BLS?retryWrites=true&w=majority&appName=Cluster0';

async function migrate() {
  console.log('==================================================');
  console.log('BLS & COMPANY: LOCAL MONGODB -> ATLAS CLOUD MIGRATION');
  console.log('==================================================');

  // 1. Connect to Local MongoDB
  console.log('Connecting to Local MongoDB...');
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('Connected to Local MongoDB database:', localConn.name);

  // 2. Connect to Atlas MongoDB
  console.log('Connecting to MongoDB Atlas (Target DB: BLS)...');
  const atlasConn = await mongoose.createConnection(ATLAS_URI, {
    serverSelectionTimeoutMS: 15000,
  }).asPromise();
  console.log('Connected to MongoDB Atlas database:', atlasConn.name);

  if (atlasConn.name.toLowerCase() !== 'bls') {
    throw new Error(`Safety check failed: Atlas database name is "${atlasConn.name}". Expected "BLS"!`);
  }

  // 3. List all collections from local
  const collections = await localConn.db.listCollections().toArray();
  console.log(`Found ${collections.length} collections in local database.\n`);

  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith('system.')) continue;

    const localCol = localConn.db.collection(colName);
    const atlasCol = atlasConn.db.collection(colName);

    const docs = await localCol.find({}).toArray();
    console.log(`[${colName}] Found ${docs.length} local records.`);

    if (docs.length > 0) {
      // Clear atlas collection first to avoid duplicates
      await atlasCol.deleteMany({});
      
      // Insert all records into Atlas
      const insertResult = await atlasCol.insertMany(docs);
      console.log(`  -> Successfully uploaded ${insertResult.insertedCount} records to Atlas "${atlasConn.name}.${colName}".`);
    } else {
      console.log(`  -> 0 records, skipping insert.`);
    }
  }

  console.log('\n==================================================');
  console.log('VERIFYING ATLAS DATABASE (BLS)...');
  console.log('==================================================');

  const atlasCollections = await atlasConn.db.listCollections().toArray();
  for (const c of atlasCollections) {
    const count = await atlasConn.db.collection(c.name).countDocuments();
    console.log(`Atlas collection [${c.name}]: ${count} records`);
  }

  console.log('\nMigration to MongoDB Atlas (BLS) completed successfully!');

  await localConn.close();
  await atlasConn.close();
}

migrate().catch((err) => {
  console.error('\nMigration failed:', err.message || err);
  process.exit(1);
});
