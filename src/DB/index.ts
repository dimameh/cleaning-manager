import Mongoose from 'mongoose';

Mongoose.Promise = global.Promise;

export async function initDB() {
  try {
    if (!process.env.DB_URL) {
      throw new Error('DB_URL is not defined!');
    }
    if (!process.env.DB_NAME) {
      throw new Error('DB_NAME is not defined!');
    }
    await Mongoose.connect(`${process.env.DB_URL}/${process.env.DB_NAME}`);
    console.log('Connected to DB');
  } catch (error) {
    console.error('Connection to DB failed!', error);
    process.exit();
  }
}
