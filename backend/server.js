// server.js
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import app from './app.js';
import './workers/code.worker.js';

import {
  generateResult,
  updateChatHistory,
  getChatHistory,
  createFilesFromAIResponse
} from './services/ai.service.js';

// Enable cross-origin isolation (for SharedArrayBuffer, if needed)
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

const port = process.env.PORT || 3000;
const host = '0.0.0.0';

const server = http.createServer(app);

// ---- Socket.IO setup ----
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://192.168.0.6:5175",
      "https://project-hub-one-sage.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  }
});

// ---- Socket events ----
io.on('connection', (socket) => {
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
  });

  socket.on('leave-project', (projectId) => {
    socket.leave(`project-${projectId}`);
  });

  // Handle user chat messages (no AI logic here anymore)
  socket.on('send-message', async (data) => {
    const { projectId, content, sender, senderName } = data;

    updateChatHistory(projectId, { content, sender, senderName, timestamp: new Date() });

    io.to(`project-${projectId}`).emit('new-message', {
      projectId, content, sender, senderName, timestamp: new Date()
    });
  });

  socket.on('delete-message', (data) => {
    const { projectId, messageId, deleteForEveryone } = data;
    io.to(`project-${projectId}`).emit('message-deleted', { projectId, messageId, deleteForEveryone });
  });
});

// ---- HTTP AI route ----
app.post('/api/ask-ai', express.json(), async (req, res) => {
  try {
    const { projectId, prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'AI service is not configured (GEMINI_API_KEY missing).' });
    }

    const chatPrompt = `Request: "${prompt}". Provide a detailed response with code examples and file structure. Create a complete implementation with proper folder organization.`;

    let aiResponse = await generateResult(chatPrompt, projectId, []);

    const createdFiles = await createFilesFromAIResponse(projectId, aiResponse);
    if (createdFiles.length > 0) {
      aiResponse += `\n\n**Files Created:**\n${createdFiles.map(f => `- ${f.filePath}`).join('\n')}`;
    }

    // Save in chat history
    updateChatHistory(projectId, {
      content: aiResponse,
      sender: 'ai',
      senderName: 'AI Assistant',
      timestamp: new Date()
    });

    // Broadcast to project room via socket
    io.to(`project-${projectId}`).emit('new-message', {
      projectId,
      content: aiResponse,
      sender: 'ai',
      senderName: 'AI Assistant',
      timestamp: new Date()
    });

    res.json({ success: true, message: aiResponse });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI request failed.' });
  }
});

// ---- Start server ----
server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
