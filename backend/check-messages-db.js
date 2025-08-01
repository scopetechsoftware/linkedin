import mongoose from 'mongoose';

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/linkedin')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Define a simple Message schema (just for querying)
    const messageSchema = new mongoose.Schema({}, { strict: false });
    const Message = mongoose.model('Message', messageSchema);
    
    // Find the most recent messages
    return Message.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .then(messages => {
        console.log('Recent messages:');
        console.log(JSON.stringify(messages, null, 2));
      })
      .catch(err => {
        console.error('Error fetching messages:', err);
      })
      .finally(() => {
        // Close the connection
        mongoose.connection.close();
        console.log('MongoDB connection closed');
      });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });