import Mongoose from 'mongoose';

Mongoose.Promise = global.Promise;

export async function initDB() {
  try {
    if (!process.env.DB_URI) {
      throw new Error('DB_URI is not defined!');
    }
    await Mongoose.connect(process.env.DB_URI);
    console.log('Connected to DB');
  } catch (error) {
    console.error('Connection to DB failed!', error);
    process.exit();
  }
}
