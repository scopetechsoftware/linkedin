import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
    getSkillMatchedContent,
    getSkillMatchedPeople,
    getSkillMatchedJobs,
    getSkillMatchedPosts,
    searchAll,
    searchPeople,
    searchJobs,
    searchPosts,
    searchCompanies
} from '../controllers/search.controller.js';

const router = express.Router();

router.get('/skill-matched', protectRoute, getSkillMatchedContent);
router.get('/skill-matched/people', protectRoute, getSkillMatchedPeople);
router.get('/skill-matched/jobs', protectRoute, getSkillMatchedJobs);
router.get('/skill-matched/posts', protectRoute, getSkillMatchedPosts);
router.get('/all', protectRoute, searchAll);
router.get('/people', protectRoute, searchPeople);
router.get('/jobs', protectRoute, searchJobs);
router.get('/posts', protectRoute, searchPosts);
router.get('/companies', protectRoute, searchCompanies);

export default router;