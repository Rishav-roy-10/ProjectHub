import express from 'express';
import codeExecutionController from '../controller/code-execution.controller.js';

const router = express.Router();

// Execute code
router.post('/execute', codeExecutionController.executeCode);
router.post('/execute-async', (req, res) => codeExecutionController.enqueueExecution(req, res));
router.get('/status/:id', (req, res) => codeExecutionController.getExecutionStatus(req, res));

// Get supported languages
router.get('/languages', codeExecutionController.getSupportedLanguages);

// Health check
router.get('/health', codeExecutionController.healthCheck);

export default router;
