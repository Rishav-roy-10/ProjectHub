import Chat from '../models/chat.model.js';
import Project from '../models/project.model.js';
import userModel from '../models/user.model.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

export const getProjectChat = async (req, res) => {
    try {
        const { projectId } = req.params;
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        
        if (!loggedInUser) {
            return res.status(400).json({ error: 'Logged in user not found' });
        }

        // Check if user has access to this project
        const project = await Project.findOne({
            _id: projectId,
            $or: [
                { owner: loggedInUser._id },
                { sharedUsers: loggedInUser._id }
            ]
        });

        if (!project) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }

        // Get or create chat for this project
        let chat = await Chat.findOne({ projectId }).populate('messages.sender', 'name email');
        
        if (!chat) {
            // Create new chat if it doesn't exist
            chat = await Chat.create({
                projectId,
                participants: [project.owner, ...project.sharedUsers]
            });
        }

        res.status(200).json({ chat });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

export const sendMessage = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, content } = req.body;
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        
        if (!loggedInUser) {
            return res.status(400).json({ error: 'Logged in user not found' });
        }

        // Check if user has access to this project
        const project = await Project.findOne({
            _id: projectId,
            $or: [
                { owner: loggedInUser._id },
                { sharedUsers: loggedInUser._id }
            ]
        });

        if (!project) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }

        // Get or create chat for this project
        let chat = await Chat.findOne({ projectId });
        
        if (!chat) {
            chat = await Chat.create({
                projectId,
                participants: [project.owner, ...project.sharedUsers]
            });
        }

        // Add message to chat
        const newMessage = {
            sender: loggedInUser._id,
            senderName: loggedInUser.name || loggedInUser.email, // Add senderName field
            content,
            timestamp: new Date()
        };

        console.log('=== sendMessage Debug ===');
        console.log('New message object:', newMessage);
        console.log('Logged in user:', loggedInUser);
        console.log('User name:', loggedInUser.name);
        console.log('User email:', loggedInUser.email);
        console.log('=== End Debug ===');

        chat.messages.push(newMessage);
        chat.lastMessage = new Date();
        await chat.save();

        // Populate sender info for response
        await chat.populate('messages.sender', 'name email');

        res.status(201).json({ 
            message: 'Message sent successfully',
            chat: chat
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

export const getRecentMessages = async (req, res) => {
    try {
        const { projectId } = req.params;
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        
        if (!loggedInUser) {
            return res.status(400).json({ error: 'Logged in user not found' });
        }

        // Check if user has access to this project
        const project = await Project.findOne({
            _id: projectId,
            $or: [
                { owner: loggedInUser._id },
                { sharedUsers: loggedInUser._id }
            ]
        });

        if (!project) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }

        // Get recent messages (last 50)
        const chat = await Chat.findOne({ projectId })
            .populate('messages.sender', 'name email')
            .select('messages')
            .sort({ 'messages.timestamp': -1 })
            .limit(50);

        if (!chat) {
            return res.status(200).json({ messages: [] });
        }

        // Sort messages by timestamp (oldest first)
        const sortedMessages = chat.messages.sort((a, b) => a.timestamp - b.timestamp);

        res.status(200).json({ messages: sortedMessages });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteMessage = async (req, res) => {
  try {
    const { projectId, messageId, deleteForEveryone } = req.body;
    const userId = req.user._id;

    // Find the chat for this project
    const chat = await Chat.findOne({ projectId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Find the message
    const message = chat.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check permissions
    const isMessageOwner = message.sender.toString() === userId.toString();
    
    if (deleteForEveryone && !isMessageOwner) {
      return res.status(403).json({ 
        error: 'You can only delete your own messages for everyone' 
      });
    }

    if (deleteForEveryone) {
      // Delete for everyone - remove from database
      chat.messages.pull(messageId);
      await chat.save();
      
      res.status(200).json({ 
        success: true, 
        message: 'Message deleted for everyone',
        deletedMessageId: messageId
      });
    } else {
      // Delete for me - mark as deleted for this user
      if (!message.deletedFor) {
        message.deletedFor = [];
      }
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
        await chat.save();
      }
      
      res.status(200).json({ 
        success: true, 
        message: 'Message deleted for you',
        deletedMessageId: messageId
      });
    }

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};
