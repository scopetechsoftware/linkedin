import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { getSuggestedConnections, getPublicProfile, updateProfile, searchUser } from '../controllers/user.controller.js';
import upload from '../middleware/multer.middleware.js';
import { getProjectById, getProjectsByUsername } from '../controllers/project.controller.js';

const router = express.Router();

router.get('/suggestions', protectRoute, getSuggestedConnections);
router.get('/search', searchUser);
router.get('/user/:username', getProjectsByUsername);
router.get("/profile/:username", protectRoute, getPublicProfile);
router.get("/:username", protectRoute, getPublicProfile);
router.get('/:id', getProjectById);

router.put("/profile", protectRoute, upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'bannerImg', maxCount: 1 }
]), updateProfile);

export default router;