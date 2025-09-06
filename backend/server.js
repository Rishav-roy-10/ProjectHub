import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import './workers/code.worker.js';
import { generateResult, updateChatHistory, getChatHistory, createFilesFromAIResponse } from './services/ai.service.js';



const port = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://192.168.0.6:5175"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  }
});

io.on('connection', (socket) => {
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
  });

  socket.on('leave-project', (projectId) => {
    socket.leave(`project-${projectId}`);
  });

  // Handle chat messages
  socket.on('send-message', async (data) => {
    const { projectId, content, sender, senderName } = data;
    
    // Update chat history with user message
    updateChatHistory(projectId, {
      content,
      sender,
      senderName,
      timestamp: new Date()
    });

    // Broadcast message to all users in the project room
    io.to(`project-${projectId}`).emit('new-message', {
      projectId,
      content,
      sender,
      senderName,
      timestamp: new Date()
    });
    
    const aiIsPresentInMessage = content.includes('@ai');
    if(aiIsPresentInMessage){
      try {
        // Extract the actual question/request after @ai
        const aiRequest = content.replace(/@ai\s*/i, '').trim();
        
        let aiResponse = 'Hello! I\'m your AI assistant. How can I help you today?';
        
        if (aiRequest) {
          // Use your Gemini AI service for real AI responses
          if (process.env.GEMINI_API_KEY) {
            try {
              // All AI requests stay in the current project
              let chatPrompt;
              if (aiRequest) {
                chatPrompt = `Request: "${aiRequest}". Provide a detailed response with code examples and file structure. Create a complete implementation with proper folder organization.`;
              }
              
              aiResponse = await generateResult(chatPrompt, projectId, []);
              
              // Check if AI response contains file creation requests
              const createdFiles = await createFilesFromAIResponse(projectId, aiResponse);
              if (createdFiles.length > 0) {
                aiResponse += `\n\n**Files Created:**\n${createdFiles.map(file => `- ${file.filePath}`).join('\n')}`;
              }
            } catch (aiError) {
              aiResponse = 'Sorry, I encountered an error while processing your request. Please try again.';
            }
          } else {
            aiResponse = 'AI service is not configured. Please set your GEMINI_API_KEY in environment variables.';
          }
        }
        
        // Update chat history with AI response
        updateChatHistory(projectId, {
          content: aiResponse,
          sender: 'ai',
          senderName: 'AI Assistant',
          timestamp: new Date()
        });

        // Broadcast AI response to all users in the project room
        io.to(`project-${projectId}`).emit('new-message', {
          projectId: projectId,
          content: aiResponse,
          sender: 'ai',
          senderName: 'AI Assistant',
          timestamp: new Date()
        });
        
      } catch (error) {
        io.to(`project-${projectId}`).emit('new-message', {
          projectId,
          content: 'Sorry, I encountered an error. Please try again.',
          sender: 'ai',
          senderName: 'AI Assistant',
          timestamp: new Date()
        });
      }
      return;
    }
  });

  // Handle message deletion
  socket.on('delete-message', async (data) => {
    const { projectId, messageId, deleteForEveryone } = data;
    
          // Broadcast delete event to all users in the project room
      io.to(`project-${projectId}`).emit('message-deleted', {
        projectId,
        messageId,
        deleteForEveryone
      });
      
    });

    socket.on('disconnect', () => {
      // User disconnected
    });
  });

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });