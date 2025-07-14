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
    const url = `http://localhost:8000${req.url}`;
    
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

    fetch(url, {
      method: req.method,
      headers,
      body: req.method === 'GET' ? undefined : JSON.stringify(req.body)
    })
    .then(response => {
      res.status(response.status);
      return response.json();
    })
    .then(data => {
      res.json(data);
    })
    .catch(error => {
      log(`Proxy error: ${error.message}`, 'proxy');
      res.status(500).json({ error: 'Proxy error' });
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
