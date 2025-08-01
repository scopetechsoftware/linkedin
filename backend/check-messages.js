import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Message, Chat } from './models/chat.model.js';
import User from './models/user.model.js';

// Set up a watch on the Message collection to detect new messages
async function watchMessages() {
  try {
    console.log('Setting up watch on Message collection...');
    const messageCollection = mongoose.connection.collection('messages');
    const changeStream = messageCollection.watch();
    
    changeStream.on('change', (change) => {
      console.log('Change detected in Message collection:', change.operationType);
      if (change.operationType === 'insert') {
        console.log('New message inserted:', change.fullDocument);
      }
    });
    
    console.log('Watch setup complete. Waiting for new messages...');
  } catch (error) {
    console.error('Error setting up watch:', error);
  }
}

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/linkedin';
    console.log('MONGO_URI:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected:', mongoose.connection.host);
    
    // Get all messages
    const messages = await Message.find({})
      .populate('sender', 'name username profilePicture')
      .populate('chatId')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log('\nRecent Messages:');
    if (messages.length === 0) {
      console.log('No messages found in the database.');
    } else {
      messages.forEach((msg, index) => {
        console.log(`\nMessage ${index + 1}:`);
        console.log(`ID: ${msg._id}`);
        console.log(`Content: ${msg.content}`);
        console.log(`Sender: ${msg.sender?.name} (${msg.sender?.username})`);
        console.log(`Chat ID: ${msg.chatId?._id}`);
        console.log(`Created At: ${msg.createdAt}`);
        console.log(`Read: ${msg.read}`);
      });
    }
    
    // Get all chats
    const chats = await Chat.find({})
      .populate('participants', 'name username')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .limit(5);
    
    console.log('\nRecent Chats:');
    if (chats.length === 0) {
      console.log('No chats found in the database.');
    } else {
      chats.forEach((chat, index) => {
        console.log(`\nChat ${index + 1}:`);
        console.log(`ID: ${chat._id}`);
        console.log('Participants:');
        chat.participants.forEach(p => console.log(`  - ${p.name} (${p.username})`))
        console.log(`Last Message: ${chat.lastMessage?.content || 'None'}`);
        console.log(`Created At: ${chat.createdAt}`);
        console.log(`Updated At: ${chat.updatedAt}`);
      });
    }
    
    // Set up watch for new messages
    await watchMessages();
    
    console.log('\nPress Ctrl+C to disconnect and exit');
    
    // Keep the connection open
    process.on('SIGINT', () => {
      mongoose.disconnect();
      console.log('\nMongoDB disconnected');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    mongoose.disconnect();
    console.log('\nMongoDB disconnected');
    process.exit(1);
  }
};

connectDB();