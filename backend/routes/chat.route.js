import { body } from 'express-validator';
import { Router } from 'express';
import * as authMiddleware from '../middleware/auth.middleware.js';
import * as chatController from '../controller/chat.controller.js';

const router = Router();

// Get chat for a specific project
router.get('/project/:projectId',
    authMiddleware.authUser,
    chatController.getProjectChat
);

// Send a message to project chat
router.post('/send-message',
    authMiddleware.authUser,
    body('projectId')
        .notEmpty().withMessage('Project ID is required')
        .isMongoId().withMessage('Project ID must be a valid MongoDB ObjectId'),
    body('content')
        .notEmpty().withMessage('Message content is required')
        .trim()
        .isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters'),
    chatController.sendMessage
);

// Get recent messages for a project
router.get('/recent/:projectId',
    authMiddleware.authUser,
    chatController.getRecentMessages
);

// Delete a message
router.delete('/delete-message',
    authMiddleware.authUser,
    body('projectId')
        .notEmpty().withMessage('Project ID is required')
        .isMongoId().withMessage('Project ID must be a valid MongoDB ObjectId'),
    body('messageId')
        .notEmpty().withMessage('Message ID is required')
        .isMongoId().withMessage('Message ID must be a valid MongoDB ObjectId'),
    body('deleteForEveryone')
        .isBoolean().withMessage('deleteForEveryone must be a boolean'),
    chatController.deleteMessage
);

export default router;
