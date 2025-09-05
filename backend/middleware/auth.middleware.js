import jwt from 'jsonwebtoken';
import BlacklistedToken from '../models/blacklistedToken.model.js';
import User from '../models/user.model.js';

export const authUser = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token, authorization denied' });
        }

        // Check if token is blacklisted in MongoDB
        const isBlacklisted = await BlacklistedToken.findOne({ token });
        if (isBlacklisted) {
            return res.status(401).json({ error: 'Unauthorized User' });
        }
   
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch the full user object from database using email from JWT
        const user = await User.findOne({ email: decoded.email }).select('_id name email');
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Token is not valid' });
    }
}
