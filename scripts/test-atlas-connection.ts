import mongoose from 'mongoose';

const uri = 'mongodb+srv://akraoshab0009_db_user:ZzWRJCEJkfojlSt8@cluster0.wu3i78y.mongodb.net/BLS?retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  try {
    console.log('Testing connection to MongoDB Atlas...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connection successful!');
    console.log('Database Name:', mongoose.connection.db?.databaseName);
    
    // List collections in BLS database
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log('Collections in BLS:', collections?.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('Disconnected cleanly.');
  } catch (err) {
    console.error('Atlas connection error:', err);
    process.exit(1);
  }
}

main();
