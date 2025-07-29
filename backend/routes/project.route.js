import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  rateProject,
  getProjectRatings,
  getOverallProjectRating
} from '../controllers/project.controller.js';
import upload from '../middleware/multer.middleware.js';

const router = express.Router();

// All routes are protected
router.use(protectRoute);

// Create a new project
router.post('/', upload.array('files', 10), createProject);

// Get all projects for the current user
router.get('/', getUserProjects);

// Get a specific project by ID
router.get('/:id', getProjectById);

// Update a project
router.put('/:id', upload.array('files', 10), updateProject);

// Delete a project
router.delete('/:id', deleteProject);

// Rate a project
router.post('/:id/rate', rateProject);

// Get project ratings
router.get('/:id/ratings', getProjectRatings);

router.get('/my/average-rating', getOverallProjectRating);


export default router;