import express from 'express';
import { createFile, getFile, getProjectFiles, getProjectFileTree, updateFile, deleteFile, renameFile } from '../services/file.service.js';

const router = express.Router();

// Get all files for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const files = getProjectFiles(projectId);
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get file tree structure for a project
router.get('/project/:projectId/tree', async (req, res) => {
  try {
    const { projectId } = req.params;
    const fileTree = getProjectFileTree(projectId);
    res.json({ success: true, fileTree });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a specific file
router.get('/project/:projectId/file/:filePath(*)', async (req, res) => {
  try {
    const { projectId, filePath } = req.params;
    const file = getFile(projectId, filePath);
    
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    res.json({ success: true, file });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new file
router.post('/project/:projectId/file', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { filePath, content, language } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'File path is required' });
    }
    
    // Use empty string as default content if not provided
    const fileContent = content || '';
    const fileLanguage = language || 'text';
    
    const result = createFile(projectId, filePath, fileContent, fileLanguage);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a file
router.put('/project/:projectId/file/:filePath(*)', async (req, res) => {
  try {
    const { projectId, filePath } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }
    
    const result = updateFile(projectId, filePath, content);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rename a file or folder
router.put('/project/:projectId/rename', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { oldPath, newPath } = req.body;
    
    if (!oldPath || !newPath) {
      return res.status(400).json({ success: false, error: 'Old path and new path are required' });
    }
    
    const result = renameFile(projectId, oldPath, newPath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a file
router.delete('/project/:projectId/file/:filePath(*)', async (req, res) => {
  try {
    const { projectId, filePath } = req.params;
    const result = deleteFile(projectId, filePath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
