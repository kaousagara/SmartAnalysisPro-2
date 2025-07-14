import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
import { log } from "./vite";

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

  // Proxy all /api requests to the Flask backend
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

    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      headers['content-type'] = 'application/json';
    }

    // Log the proxy request for debugging
    log(`Proxying ${req.method} ${url}`, 'proxy');

    fetch(url, {
      method: req.method,
      headers,
      body: req.method === 'GET' ? undefined : (req.body ? JSON.stringify(req.body) : undefined)
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
