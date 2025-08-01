import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';

dotenv.config();

async function connectDB() {
  try {
    console.log('MONGO_URI:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);

    // Get all users
    console.log('\nUsers in the database:');
    const users = await User.find().select('name username email');

    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      users.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log(`ID: ${user._id}`);
        console.log(`Name: ${user.name}`);
        console.log(`Username: ${user.username}`);
        console.log(`Email: ${user.email}`);
      });
    }

    mongoose.disconnect();
    console.log('\nMongoDB disconnected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

connectDB();