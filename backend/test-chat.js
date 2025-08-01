import { io } from 'socket.io-client';

// Connect to the Socket.io server
const socket = io('http://localhost:5000', {
  auth: {
    userId: '688c3efd5c430bd468850ed8' // Use one of the connected user IDs from the logs
  }
});

// Listen for connection events
socket.on('connect', () => {
  console.log('Connected to Socket.io server');
  
  // Join a chat room (use a valid chat ID from your database)
  const chatId = '688c4889438f64553db0f59d'; // Using the chat ID we found in the database
  socket.emit('join_chat', chatId);
  console.log(`Joined chat: ${chatId}`);
  
  // Send a test message
  setTimeout(() => {
    console.log('Sending test message...');
    socket.emit('send_message', {
      chatId: chatId,
      content: 'This is a test message from the chat test script',
    });
  }, 2000);
  
  // Listen for received messages
  socket.on('receive_message', (message) => {
    console.log('Received message:', message);
  });
  
  // Listen for errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Handle connection errors
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

// Keep the script running for a while
setTimeout(() => {
  console.log('Test complete, disconnecting...');
  socket.disconnect();
  process.exit(0);
}, 10000);