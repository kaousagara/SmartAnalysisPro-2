import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
import { log } from "./vite";
import multer from "multer";
import FormData from "form-data";
import fs from "fs";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start the Flask backend
  const flaskProcess = spawn('python', ['server/simple_flask_app.py'], {
    cwd: process.cwd(),
    env: { ...process.env },
    stdio: 'inherit'
  });

  flaskProcess.on('error', (error) => {
    log(`Flask backend error: ${error.message}`, 'flask');
  });

  // Configure multer for file uploads
  const upload = multer({ dest: 'uploads/' });

  // Special handler for file uploads
  app.post('/api/ingestion/upload', upload.single('file'), async (req, res) => {
    try {
      log(`Received upload request, file: ${req.file ? 'YES' : 'NO'}`, 'upload');
      
      if (!req.file) {
        log('No file in request', 'upload');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      log(`File received: ${req.file.originalname}, size: ${req.file.size}`, 'upload');
      
      // Read the file from disk
      const fileBuffer = fs.readFileSync(req.file.path);
      
      const formData = new FormData();
      formData.append('file', fileBuffer, req.file.originalname);

      const token = req.headers.authorization;
      const headers: Record<string, string> = {
        ...formData.getHeaders()
      };
      
      if (token) {
        headers['Authorization'] = token;
      }

      log(`Forwarding to Flask with headers: ${Object.keys(headers)}`, 'upload');
      log(`File buffer size: ${fileBuffer.length}`, 'upload');

      const response = await axios.post('http://localhost:8000/api/ingestion/upload', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': token || ''
        }
      });

      log(`Flask response status: ${response.status}`, 'upload');
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      log(`Upload successful`, 'upload');
      res.json(response.data);
    } catch (error) {
      log(`Upload error: ${error}`, 'upload');
      console.error('File upload error:', error);
      res.status(500).json({ 
        error: 'File upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Proxy all other /api requests to the Flask backend
  app.use('/api', (req, res) => {
    const url = `http://localhost:8000${req.originalUrl}`;
    
    // Simple proxy implementation
    const headers: Record<string, string> = {};
    
    // Copy string headers only
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    }
    
    headers['host'] = 'localhost:8000';

    // Don't override content-type for multipart/form-data uploads
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (!req.headers['content-type']?.includes('multipart/form-data')) {
        headers['content-type'] = 'application/json';
      }
    }

    // Log the proxy request for debugging
    log(`Proxying ${req.method} ${url}`, 'proxy');

    // Handle different body types based on content-type
    let body: any = undefined;
    if (req.method !== 'GET') {
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // For multipart/form-data, pass the raw body
        body = req.body;
      } else if (req.body) {
        // For JSON requests, stringify the body
        body = JSON.stringify(req.body);
      }
    }

    fetch(url, {
      method: req.method,
      headers,
      body
    })
    .then(response => {
      res.status(response.status);
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        return response.text();
      }
    })
    .then(data => {
      if (typeof data === 'string') {
        res.send(data);
      } else {
        res.json(data);
      }
    })
    .catch(error => {
      log(`Proxy error for ${url}: ${error.message}`, 'proxy');
      log(`Request body: ${JSON.stringify(req.body)}`, 'proxy');
      log(`Request headers: ${JSON.stringify(req.headers)}`, 'proxy');
      res.status(500).json({ error: 'Proxy error', details: error.message, url: url });
    });
  });

  const httpServer = createServer(app);
  
  // Cleanup on server shutdown
  process.on('SIGTERM', () => {
    flaskProcess.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    flaskProcess.kill('SIGINT');
  });

  return httpServer;
}
