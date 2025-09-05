import mongoose from 'mongoose';
import Project from '../models/project.model.js';

export const createProject = async ({ name, userId }) => {
    if (!name) {
        throw new Error('Project name is required');
    }
    if (!userId) {
        throw new Error('User id is required');
    }
    let project;
    try {
        project = await Project.create({
            name,
            owner: userId,
        });
    } catch (error) {
        if (error.code === 11000) { // MongoDB duplicate key error code
            throw new Error('This project name already exists');
        }
        throw error; // Re-throw other errors
    }
    return project;
}

export const getAllProjects = async ({ userId }) => {
    if (!userId) {
        throw new Error('User id is required');
    }
    
    try {
        let projects = await Project.find({
            $or: [
                { owner: userId },
                { sharedUsers: userId }
            ]
        });
        
        if (projects.length === 0) {
            const oldProjects = await Project.find({ User: userId });
            
            if (oldProjects.length > 0) {
                for (const oldProject of oldProjects) {
                    try {
                        await Project.findByIdAndUpdate(oldProject._id, {
                            $set: { owner: oldProject.User },
                            $unset: { User: 1 }
                        });
                    } catch (migrateError) {
                        // Silent fail for migration
                    }
                }
                
                projects = await Project.find({
                    $or: [
                        { owner: userId },
                        { sharedUsers: userId }
                    ]
                });
            }
        }
        
        const populatedProjects = await Project.populate(projects, [
            { path: 'owner', select: 'name email' },
            { path: 'sharedUsers', select: 'name email' }
        ]);
        
        return populatedProjects;
        
    } catch (error) {
        throw error;
    }
}

export const addUserToProject = async ({ projectId, user, userId }) => {
    if (!projectId) {
        throw new Error('Project id is required');
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid project ID');
    }

    if (!user) {
        throw new Error('User ID to add is required');
    }

    if (!mongoose.Types.ObjectId.isValid(user)) {
        throw new Error('User ID to add must be a valid ObjectId');
    }

    if (!userId) {
        throw new Error('User ID is required');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }

    // Ensure the caller owns the project (only owners can share)
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
        throw new Error('Project not found or you are not the owner');
    }

    // Check if user is already shared
    if (project.sharedUsers.includes(user)) {
        throw new Error('User is already shared on this project');
    }

    // Check if trying to share with the owner
    if (project.owner.toString() === user) {
        throw new Error('Cannot share with the project owner');
    }

    // Add user to sharedUsers array
    try {
        const updatedProject = await Project.findOneAndUpdate(
            { _id: projectId, owner: userId },
            { $addToSet: { sharedUsers: user } },
            { new: true }
        ).populate('owner', 'name email').populate('sharedUsers', 'name email');
        
        if (!updatedProject) {
            throw new Error('Failed to update project');
        }
        return updatedProject;
    } catch (error) {
        throw error;
    }
}

export const getProjectById = async ({ projectId, userId }) => {
    if (!projectId) {
        throw new Error('Project id is required');
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid project ID');
    }
    if (!userId) {
        throw new Error('User id is required');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }

    // Get project if user is owner OR shared user
    const project = await Project.findOne({
        _id: projectId,
        $or: [
            { owner: userId },
            { sharedUsers: userId }
        ]
    }).populate('owner', 'name email').populate('sharedUsers', 'name email');
    
    return project;
}

export const removeUserFromProject = async ({ projectId, userToRemove, userId }) => {
    if (!projectId || !userToRemove || !userId) {
        throw new Error('Project ID, user to remove, and user ID are required');
    }

    // Ensure the caller owns the project
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
        throw new Error('Project not found or you are not the owner');
    }

    // Remove user from sharedUsers array
    const updatedProject = await Project.findOneAndUpdate(
        { _id: projectId, owner: userId },
        { $pull: { sharedUsers: userToRemove } },
        { new: true }
    ).populate('owner', 'name email').populate('sharedUsers', 'name email');

    return updatedProject;
}

export const deleteProject = async ({ projectId, userId }) => {
    if (!projectId) {
        throw new Error('Project ID is required');
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid project ID');
    }
    if (!userId) {
        throw new Error('User ID is required');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }

    // Ensure the caller owns the project (only owners can delete)
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
        throw new Error('Project not found or you are not the owner');
    }

    // Delete the project
    const deletedProject = await Project.findByIdAndDelete(projectId);
    if (!deletedProject) {
        throw new Error('Failed to delete project');
    }

    return { success: true, deletedProject };
}