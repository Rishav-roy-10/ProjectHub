import projectModel from '../models/project.model.js';
import * as projectService from '../services/project.service.js';
import userModel from '../models/user.model.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';


export const createProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name } = req.body;
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        if (!loggedInUser) {
            return res.status(400).json({ error: 'User not found' });
        }

        const newProject = await projectService.createProject({ name, userId: loggedInUser._id });
        res.status(201).json({ newProject });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export const getAllProjects = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        if (!loggedInUser) {
            return res.status(400).json({ error: 'User not found' });
        }
        const projects = await projectService.getAllProjects({ userId: loggedInUser._id });
        res.status(200).json({ projects });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export const addUserToProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId } = req.body;
        let { user } = req.body;

        if (Array.isArray(user)) {
            user = user[0];
        }

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Project ID must be a valid ObjectId' });
        }
        if (!mongoose.Types.ObjectId.isValid(user)) {
            return res.status(400).json({ error: 'User ID to add must be a valid ObjectId' });
        }

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        });

        if (!loggedInUser) {
            return res.status(400).json({ error: 'User not found' });
        }

        const project = await projectService.addUserToProject({
            projectId,
            user,
            userId: loggedInUser._id
        });

        return res.status(200).json({
            project,
            message: 'User added to project successfully'
        });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export const removeUserFromProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, userToRemove } = req.body;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Project ID must be a valid ObjectId' });
        }
        if (!mongoose.Types.ObjectId.isValid(userToRemove)) {
            return res.status(400).json({ error: 'User ID to remove must be a valid ObjectId' });
        }

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        });

        if (!loggedInUser) {
            return res.status(400).json({ error: 'User not found' });
        }

        const project = await projectService.removeUserFromProject({
            projectId,
            userToRemove,
            userId: loggedInUser._id
        });

        return res.status(200).json({
            project,
            message: 'User removed from project successfully'
        });

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
}

export const getProjectById = async (req, res) => {
    const { projectId } = req.params;
    try {
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        if (!loggedInUser) {
            return res.status(400).json({ error: 'User not found' });
        }

        const project = await projectService.getProjectById({ projectId, userId: loggedInUser._id });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.status(200).json({ project });
    } catch (error) {
        console.log(error);
        if (error && error.message === 'Project not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
}


export const getProjectUsers = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId = req.user._id;
    const project = await projectModel.findById(projectId)
      .populate('owner', 'name email')
      .populate('sharedUsers', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.owner || !project.owner._id) {
      return res.status(500).json({ error: 'Project owner not found' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const hasAccess = project.owner._id.toString() === userId.toString() ||
                     (project.sharedUsers && project.sharedUsers.some(user => user && user._id && user._id.toString() === userId.toString()));

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const allUsers = [
      {
        _id: project.owner._id,
        name: project.owner.name,
        email: project.owner.email,
        role: 'Owner'
      }
    ];

    if (project.sharedUsers && project.sharedUsers.length > 0) {
      allUsers.push(...project.sharedUsers.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: 'Member'
      })));
    }

    res.status(200).json({
      success: true,
      users: allUsers,
      totalUsers: allUsers.length
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to get project users' });
  }
};

export const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        
        if (!loggedInUser) {
            return res.status(400).json({ error: 'User not found' });
        }

        const result = await projectService.deleteProject({ 
            projectId, 
            userId: loggedInUser._id 
        });

        res.status(200).json({ 
            success: true, 
            message: 'Project deleted successfully',
            deletedProject: result.deletedProject
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

