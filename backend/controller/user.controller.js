import userModel from '../models/user.model.js';
import * as userService from '../services/user.service.js';
import { validationResult } from 'express-validator';
import BlacklistedToken from '../models/blacklistedToken.model.js';
import redisClient from '../services/redis.service.js';


export const createUserController = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = await userService.createUser(req.body);

        const token = await user.generateJWT();

        delete user._doc.password;

        res.status(201).json({ user, token });
    } catch (error) {
        console.error('User creation error:', error);
        res.status(400).json({ error: error.message });
    }
}

export const loginUserController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const token = await user.generateJWT();
        delete user._doc.password;
        
        res.status(200).json({ user, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(400).json({ error: error.message });
    }
}

export const profileController = async (req, res) => {

    console.log(req.user);
    res.status(200).json({ user: req.user });
}

export const logoutController = async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(400).json({ error: 'No token provided' });
        }

        // Blacklist the token in MongoDB
        await BlacklistedToken.create({ 
            token, 
            userId: req.user?.id || null 
        });

        res.clearCookie('token');
        res.status(200).json({ message: 'Logout successful' });
      
    } catch (error) {
        console.error('Logout error:', error);
        res.status(400).json({ error: error.message });
    }
}

export const getAllUsersController = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({ email: req.user.email });

        const allUsers = await userService.getAllUsers(loggedInUser._id);

        res.status(200).json({ allUsers });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}

export const validateTokenController = async (req, res) => {
    try {
        // If we reach here, the token is valid (authMiddleware passed)
        // Return user info to confirm token is still valid
        const user = await userModel.findOne({ email: req.user.email });
        if (!user) {
            return res.status(401).json({ valid: false, error: 'User not found' });
        }
        
        res.status(200).json({ 
            valid: true, 
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Token validation error:', error);
        res.status(401).json({ valid: false, error: 'Token validation failed' });
    }
}