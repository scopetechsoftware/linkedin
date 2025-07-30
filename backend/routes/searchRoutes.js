const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    searchPeople,
    searchJobs,
    searchPosts,
    searchCompanies
} = require('../controllers/searchController');

router.get('/people', protect, searchPeople);
router.get('/jobs', protect, searchJobs);
router.get('/posts', protect, searchPosts);
router.get('/companies', protect, searchCompanies);

module.exports = router;