import User from '../models/user.model.js';

export const createUser = async ({name, email, password}) => {
    if(!name || !email || !password) {
        throw new Error('Name, email and password are required');
    }

    const hashedPassword = await User.hashPassword(password);
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
    });
    
    return user;
};


export const getAllUsers = async (userId) => {
    const users = await User.find({ _id: { $ne: userId } });
    return users;
};
