import pkg from '../frontend/node_modules/socket.io-client/dist/socket.io.esm.min.js';
const { io } = pkg;

// Connect to the Socket.io server
const socket = io('http://localhost:5000', {
  auth: {
    userId: '688c47e7438f64553db0f437' // Using ajith's user ID
  }
});

// Listen for connection events
socket.on('connect', () => {
  console.log('Connected to Socket.io server');
  
  // Send a test message
  setTimeout(() => {
    console.log('Sending test message...');
    socket.emit('test_message', {
      chatId: '688c4889438f64553db0f59d', // Using the chat ID we found in the database
      content: 'This is a test message from the socket test script',
    });
  }, 2000);
  
  // Listen for test message success
  socket.on('test_message_success', (message) => {
    console.log('Test message sent successfully:', message);
  });
  
  // Listen for test message error
  socket.on('test_message_error', (error) => {
    console.error('Test message error:', error);
  });
  
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