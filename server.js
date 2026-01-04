const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const PORT = 3003;
const DB_FILE = path.join(__dirname, 'db.json');

// Initialize database file
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

const readDB = () => JSON.parse(fs.readFileSync(DB_FILE));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// MIME types for static files
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Serve static files
function serveStaticFile(res, filePath) {
  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Internal Server Error: ' + err.code, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

// Helper to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Helper to send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    res.end();
    return;
  }

  // Parse URL
  const urlParts = req.url.split('/').filter(Boolean);

  // Serve index.html for root
  if (req.method === 'GET' && req.url === '/') {
    serveStaticFile(res, path.join(__dirname, 'index.html'));
    return;
  }

  // Serve static files (crypto.js, public-app.js, etc.)
  if (req.method === 'GET' && urlParts.length === 1 && 
      (urlParts[0].endsWith('.js') || urlParts[0].endsWith('.css') || 
       urlParts[0].endsWith('.html') || urlParts[0].endsWith('.ico'))) {
    serveStaticFile(res, path.join(__dirname, urlParts[0]));
    return;
  }

  // POST /note - Create a new note
  if (req.method === 'POST' && urlParts[0] === 'note' && urlParts.length === 1) {
    try {
      const body = await parseBody(req);
      const { cipherText, iv, salt } = body;

      if (!cipherText || !iv || !salt) {
        sendJSON(res, 400, { error: 'Invalid payload' });
        return;
      }

      const notes = readDB();
      const id = crypto.randomUUID();

      notes.push({
        id,
        cipherText,
        iv,
        salt,
        createdAt: Date.now()
      });

      writeDB(notes);
      sendJSON(res, 200, { id });
    } catch (err) {
      sendJSON(res, 400, { error: 'Invalid JSON' });
    }
    return;
  }

  // GET /note/:id - Retrieve a note
  if (req.method === 'GET' && urlParts[0] === 'note' && urlParts.length === 2) {
    const noteId = urlParts[1];
    const notes = readDB();
    const note = notes.find(n => n.id === noteId);

    if (!note) {
      sendJSON(res, 404, { error: 'Note not found' });
      return;
    }

    sendJSON(res, 200, note);
    return;
  }

  // GET /notes - Get all notes (without encrypted content, just metadata)
  if (req.method === 'GET' && urlParts[0] === 'notes' && urlParts.length === 1) {
    const notes = readDB();
    // Return metadata with calculated size
    const notesList = notes.map(note => {
      // Calculate approximate size of encrypted content
      const size = note.cipherText.length + note.iv.length + note.salt.length;
      return {
        id: note.id,
        createdAt: note.createdAt,
        size: size // size in bytes (base64 encoded)
      };
    });
    sendJSON(res, 200, notesList);
    return;
  }

  // GET /notes/all - Get all notes with full encrypted data for backup
  if (req.method === 'GET' && urlParts[0] === 'notes' && urlParts[1] === 'all' && urlParts.length === 2) {
    const notes = readDB();
    sendJSON(res, 200, notes);
    return;
  }

  // 404 - Route not found
  sendJSON(res, 404, { error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log('🚀 Server running on http://localhost:' + PORT);
  console.log('📝 Notes database:', DB_FILE);
  console.log('✨ Zero dependencies - using native Node.js HTTP server!');
});
