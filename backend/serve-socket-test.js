import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3030;

const server = http.createServer((req, res) => {
    // Serve the socket-test.html file
    if (req.url === '/' || req.url === '/socket-test.html') {
        const filePath = path.join(__dirname, 'socket-test.html');
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end(`Error loading socket-test.html: ${err.message}`);
                return;
            }
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`Socket test server running at http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser to test the socket connection`);
});