import { Router } from 'express';
import * as userController from '../controller/user.controller.js';
import { body } from 'express-validator';
import * as authMiddleware from '../middleware/auth.middleware.js'

const router = Router();

router.post('/register', 
  body('name').isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().withMessage('Email is not valid'),
  body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters'),
  userController.createUserController);

router.post('/login', 
  body('email').isEmail().withMessage('Email is not valid'),
  body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters'),
  userController.loginUserController);

router.get('/profile',authMiddleware.authUser, userController.profileController);

router.get('/logout', authMiddleware.authUser, userController.logoutController);

router.get('/validate-token', authMiddleware.authUser, userController.validateTokenController);

router.get('/all-users', authMiddleware.authUser, userController.getAllUsersController);

export default router;



