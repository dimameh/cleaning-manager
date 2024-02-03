import Mongoose from 'mongoose';

Mongoose.Promise = global.Promise;

export async function initDB() {
  try {
    await Mongoose.connect(process.env.DB_URI || '');
    console.log('Connected to MongoDB');
    console.log('Successfully connected to MongoDB!');
  } catch (error) {
    console.error('Connection to MongoDB failed!', error);
    process.exit();
  }
}
