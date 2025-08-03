// socket.js - Exports the Socket.IO instance for use across the application

// This file will be imported by server.js to initialize the Socket.IO server
// and by other files that need to emit socket events

import { Server } from 'socket.io';

// Create a placeholder for the io instance that will be set in server.js
let io;

// Function to initialize the io instance
export const initializeSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
      credentials: true,
      methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
  });
  
  return io;
};

// Export the io instance for use in other files
export { io };