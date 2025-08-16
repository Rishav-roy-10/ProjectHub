import {router} from 'express';
import * as userController from '../controllers/user.controller.js';
import { body } from 'express-validator';

const router = router();

 router.post('/register', [
    body('email').isEmail().withMessage('Email is not valid'),
    body('password').isLength({min: 6}).withMessage('Password must be at least 6 characters')
 ], userController.registerUser);

export default router;



