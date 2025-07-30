import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
    searchPeople,
    searchJobs,
    searchPosts,
    searchCompanies
} from '../controllers/search.controller.js';

const router = express.Router();

router.get('/people', protectRoute, searchPeople);
router.get('/jobs', protectRoute, searchJobs);
router.get('/posts', protectRoute, searchPosts);
router.get('/companies', protectRoute, searchCompanies);

export default router;