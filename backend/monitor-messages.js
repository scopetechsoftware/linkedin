import mongoose from 'mongoose';

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/linkedin')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Define a simple Message schema (just for querying)
    const messageSchema = new mongoose.Schema({}, { strict: false });
    const Message = mongoose.model('Message', messageSchema);
    
    // Store the latest message ID to track new messages
    let latestMessageId = null;
    
    // Function to check for new messages
    const checkForNewMessages = async () => {
      try {
        // Find the most recent messages
        const messages = await Message.find()
          .sort({ createdAt: -1 })
          .limit(5);
        
        if (messages.length === 0) {
          console.log('No messages found');
          return;
        }
        
        // Get the latest message ID
        const newestMessageId = messages[0]._id.toString();
        
        // If this is the first check, just store the latest ID
        if (latestMessageId === null) {
          console.log('Initial messages:');
          messages.forEach(msg => {
            console.log(`[${new Date(msg.createdAt).toLocaleTimeString()}] ${msg.sender} -> ${msg.content}`);
          });
          latestMessageId = newestMessageId;
          return;
        }
        
        // Check if there are new messages
        if (newestMessageId !== latestMessageId) {
          // Find all messages newer than the last one we saw
          const newMessages = messages.filter(msg => 
            msg._id.toString() !== latestMessageId && 
            !messages.find(m => m._id.toString() === latestMessageId) || 
            msg._id.toString() > latestMessageId
          );
          
          if (newMessages.length > 0) {
            console.log('\n=== NEW MESSAGES DETECTED ===');
            newMessages.forEach(msg => {
              console.log(`[${new Date(msg.createdAt).toLocaleTimeString()}] ${msg.sender} -> ${msg.content}`);
            });
            console.log('============================\n');
          }
          
          // Update the latest message ID
          latestMessageId = newestMessageId;
        }
      } catch (err) {
        console.error('Error checking for messages:', err);
      }
    };
    
    // Initial check
    checkForNewMessages();
    
    // Check for new messages every 3 seconds
    const intervalId = setInterval(checkForNewMessages, 3000);
    
    // Handle process termination
    process.on('SIGINT', () => {
      clearInterval(intervalId);
      mongoose.connection.close();
      console.log('\nMonitoring stopped. MongoDB connection closed.');
      process.exit(0);
    });
    
    console.log('\nMonitoring for new messages... (Press Ctrl+C to stop)');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });