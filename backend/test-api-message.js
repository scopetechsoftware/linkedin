import http from 'http';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

// Test user credentials
const testUser = {
  username: 'ajith@1234',  // Using the exact username from the database
  password: 'password123' // This is a guess, we don't know the actual password
};

// Chat ID to send message to
const chatId = '688c4889438f64553db0f59d'; // Using the chat ID we found in the database

// Function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: parsedData });
          } else {
            reject(new Error(`Request failed with status: ${res.statusCode}, message: ${JSON.stringify(parsedData)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Function to login and get token
async function login() {
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options, testUser);
    console.log('Login successful');
    return response.data.token;
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}

// Function to send a message
async function sendMessage(token) {
  try {
    const messageContent = {
      content: `Test message sent at ${new Date().toISOString()}`
    };

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/chats/${chatId}/messages`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await makeRequest(options, messageContent);
    console.log('Message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Send message error:', error.message);
    throw error;
  }
}

// Main function to run the test
async function runTest() {
  try {
    console.log('Starting API message test...');
    const token = await login();
    await sendMessage(token);
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTest();