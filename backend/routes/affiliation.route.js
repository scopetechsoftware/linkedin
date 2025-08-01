import express from 'express';
import { createAffiliation, deleteAffiliation, getAffiliations, getMyAffiliations, searchUsers, updateAffiliation, getAffiliationsByUsername, getAffiliatorsByUsername } from '../controllers/affiliation.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes are protected
router.use(protectRoute);

// Create a new affiliation
router.post('/', createAffiliation);

// Get all affiliations where the logged-in user is the affiliator
router.get('/', getAffiliations);

// Get all affiliations where the logged-in user is affiliated
router.get('/my', getMyAffiliations);

// Update an affiliation
router.put('/:id', updateAffiliation);

// Delete an affiliation
router.delete('/:id', deleteAffiliation);

// Search users for affiliation
router.get('/search', searchUsers);

// Get affiliations for a user by username
router.get('/user/:username', getAffiliationsByUsername);

// Get affiliators for a user by username (organizations that the user is affiliated with)
router.get('/affiliators/:username', getAffiliatorsByUsername);

export default router;