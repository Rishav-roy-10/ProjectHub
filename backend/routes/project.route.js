import express from 'express';
import { authUser } from '../middleware/auth.middleware.js';
import { 
    createProject, 
    getAllProjects, 
    addUserToProject, 
    removeUserFromProject,
    getProjectUsers,
    deleteProject
} from '../controller/project.controller.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authUser);

// Create a new project
router.post('/create', createProject);

// Get all projects for the authenticated user
router.get('/all', getAllProjects);


// Add a user to a project
router.put('/add-user', addUserToProject);

// Remove a user from a project
router.put('/remove-user', removeUserFromProject);

// Get project users
router.get('/:projectId/users', getProjectUsers);

// Delete a project
router.delete('/:projectId', deleteProject);


export default router;
