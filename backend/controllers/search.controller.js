import User from '../models/user.model.js';
import Post from '../models/post.model.js';
import Job from '../models/job.model.js';
import Company from '../models/company.model.js';

// Function to clean skills by removing percentage numbers and symbols
const cleanSkill = (skill) => {
    if (!skill) return '';
    // Remove percentage numbers and symbols (e.g., "HTML 70%" becomes "HTML")
    return skill.replace(/\s*\d+%?\s*$/, '').trim();
};

// Function to clean an array of skills
const cleanSkills = (skills) => {
    if (!skills || !Array.isArray(skills)) return [];
    return skills.map(skill => cleanSkill(skill)).filter(skill => skill.length > 0);
};

export const getSkillMatchedContent = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get current user's skills
        const currentUser = await User.findById(userId).select('skills');
        const userSkills = currentUser?.skills || [];
        
        // Clean the user skills
        const cleanedUserSkills = cleanSkills(userSkills);
        
        if (cleanedUserSkills.length === 0) {
            // If user has no skills, return recent content
            const [recentPeople, recentJobs, recentPosts] = await Promise.all([
                User.find({
                    profilePicture: { $exists: true, $ne: null },
                    privacySettings: { $ne: { isProfilePrivate: true } },
                    _id: { $ne: userId }
                })
                .select('name email username role profilePicture headline location skills')
                .sort({ createdAt: -1 })
                .limit(3),
                
                Job.find()
                    .populate('createdBy', 'name avatar')
                    .sort({ createdAt: -1 })
                    .limit(3),
                    
                Post.find()
                    .populate('author', 'name avatar username')
                    .sort({ createdAt: -1 })
                    .limit(3)
            ]);
            
            return res.status(200).json({
                people: recentPeople,
                jobs: recentJobs,
                posts: recentPosts,
                userSkills: cleanedUserSkills,
                message: "No skills found, showing recent content"
            });
        }

        // Create regex patterns for skill matching using cleaned skills
        const skillPatterns = cleanedUserSkills.map(skill => new RegExp(skill, 'i'));

        // Find people with matching skills
        const skillMatchedPeople = await User.find({
            _id: { $ne: userId },
            privacySettings: { $ne: { isProfilePrivate: true } },
            $or: [
                { skills: { $in: skillPatterns } },
                { headline: { $in: skillPatterns } },
                { about: { $in: skillPatterns } }
            ]
        })
        .select('name email username role profilePicture headline location skills')
        .sort({ createdAt: -1 })
        .limit(3);

        // Find jobs with matching skills
        const skillMatchedJobs = await Job.find({
            $or: [
                { skill: { $in: skillPatterns } },
                { technology: { $in: skillPatterns } },
                { title: { $in: skillPatterns } },
                { description: { $in: skillPatterns } }
            ]
        })
        .populate('createdBy', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(3);

        // Find posts with matching skills
        const skillMatchedPosts = await Post.find({
            $or: [
                { content: { $in: skillPatterns } },
                { title: { $in: skillPatterns } }
            ]
        })
        .populate('author', 'name avatar username')
        .sort({ createdAt: -1 })
        .limit(3);

        res.status(200).json({
            people: skillMatchedPeople,
            jobs: skillMatchedJobs,
            posts: skillMatchedPosts,
            userSkills: cleanedUserSkills
        });
    } catch (error) {
        console.error('Error fetching skill-matched content:', error);
        res.status(500).json({ message: 'Error fetching skill-matched content' });
    }
};

export const getSkillMatchedPeople = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get current user's skills
        const currentUser = await User.findById(userId).select('skills');
        const userSkills = currentUser?.skills || [];
        
        // Clean the user skills
        const cleanedUserSkills = cleanSkills(userSkills);
        
        if (cleanedUserSkills.length === 0) {
            // If user has no skills, return recent people
            const recentPeople = await User.find({
                profilePicture: { $exists: true, $ne: null },
                privacySettings: { $ne: { isProfilePrivate: true } },
                _id: { $ne: userId }
            })
            .select('name email username role profilePicture headline location skills')
            .sort({ createdAt: -1 })
            .limit(10);
            
            return res.status(200).json({
                people: recentPeople,
                userSkills: cleanedUserSkills,
                message: "No skills found, showing recent people"
            });
        }

        // Create regex patterns for skill matching using cleaned skills
        const skillPatterns = cleanedUserSkills.map(skill => new RegExp(skill, 'i'));

        // Find people with matching skills
        const skillMatchedPeople = await User.find({
            _id: { $ne: userId },
            privacySettings: { $ne: { isProfilePrivate: true } },
            $or: [
                { skills: { $in: skillPatterns } },
                { headline: { $in: skillPatterns } },
                { about: { $in: skillPatterns } }
            ]
        })
        .select('name email username role profilePicture headline location skills')
        .sort({ createdAt: -1 })
        .limit(10);

        res.status(200).json({
            people: skillMatchedPeople,
            userSkills: cleanedUserSkills
        });
    } catch (error) {
        console.error('Error fetching skill-matched people:', error);
        res.status(500).json({ message: 'Error fetching skill-matched people' });
    }
};

export const getSkillMatchedJobs = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get current user's skills
        const currentUser = await User.findById(userId).select('skills');
        const userSkills = currentUser?.skills || [];
        
        // Clean the user skills
        const cleanedUserSkills = cleanSkills(userSkills);
        
        if (cleanedUserSkills.length === 0) {
            // If user has no skills, return recent jobs
            const recentJobs = await Job.find()
                .populate('createdBy', 'name avatar')
                .sort({ createdAt: -1 })
                .limit(10);
            
            return res.status(200).json({
                jobs: recentJobs,
                userSkills: cleanedUserSkills,
                message: "No skills found, showing recent jobs"
            });
        }

        // Create regex patterns for skill matching using cleaned skills
        const skillPatterns = cleanedUserSkills.map(skill => new RegExp(skill, 'i'));

        // Find jobs with matching skills
        const skillMatchedJobs = await Job.find({
            $or: [
                { skill: { $in: skillPatterns } },
                { technology: { $in: skillPatterns } },
                { title: { $in: skillPatterns } },
                { description: { $in: skillPatterns } }
            ]
        })
        .populate('createdBy', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(10);

        res.status(200).json({
            jobs: skillMatchedJobs,
            userSkills: cleanedUserSkills
        });
    } catch (error) {
        console.error('Error fetching skill-matched jobs:', error);
        res.status(500).json({ message: 'Error fetching skill-matched jobs' });
    }
};

export const getSkillMatchedPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get current user's skills
        const currentUser = await User.findById(userId).select('skills');
        const userSkills = currentUser?.skills || [];
        
        // Clean the user skills
        const cleanedUserSkills = cleanSkills(userSkills);
        
        if (cleanedUserSkills.length === 0) {
            // If user has no skills, return recent posts
            const recentPosts = await Post.find()
                .populate('author', 'name avatar username')
                .sort({ createdAt: -1 })
                .limit(10);
            
            return res.status(200).json({
                posts: recentPosts,
                userSkills: cleanedUserSkills,
                message: "No skills found, showing recent posts"
            });
        }

        // Create regex patterns for skill matching using cleaned skills
        const skillPatterns = cleanedUserSkills.map(skill => new RegExp(skill, 'i'));

        // Find posts with matching skills
        const skillMatchedPosts = await Post.find({
            $or: [
                { content: { $in: skillPatterns } },
                { title: { $in: skillPatterns } }
            ]
        })
        .populate('author', 'name avatar username')
        .sort({ createdAt: -1 })
        .limit(10);

        res.status(200).json({
            posts: skillMatchedPosts,
            userSkills: cleanedUserSkills
        });
    } catch (error) {
        console.error('Error fetching skill-matched posts:', error);
        res.status(500).json({ message: 'Error fetching skill-matched posts' });
    }
};

export const searchAll = async (req, res) => {
    try {
        const { query } = req.query;
        console.log('Comprehensive search query:', query);
        
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ message: 'Valid search query is required' });
        }

        const searchQuery = query.trim();
        if (searchQuery.length < 1) {
            return res.status(400).json({ message: 'Search query cannot be empty' });
        }

        // Search across all content types in parallel
        const [people, jobs, posts] = await Promise.all([
            User.find({
                $or: [
                    { name: { $regex: searchQuery, $options: 'i' } },
                    { email: { $regex: searchQuery, $options: 'i' } },
                    { username: { $regex: searchQuery, $options: 'i' } },
                    { headline: { $regex: searchQuery, $options: 'i' } },
                    { skills: { $regex: searchQuery, $options: 'i' } }
                ]
            }).select('name email username avatar role profilePicture headline location privacySettings skills').limit(6),
            
            Job.find({
                $or: [
                    { title: { $regex: searchQuery, $options: 'i' } },
                    { description: { $regex: searchQuery, $options: 'i' } },
                    { skill: { $regex: searchQuery, $options: 'i' } },
                    { technology: { $regex: searchQuery, $options: 'i' } }
                ]
            }).populate('createdBy', 'name avatar').limit(6),
            
            Post.find({
                $or: [
                    { content: { $regex: searchQuery, $options: 'i' } },
                    { title: { $regex: searchQuery, $options: 'i' } }
                ]
            }).populate('author', 'name avatar username').limit(6)
        ]);

        // Clean skills for people results
        const peopleWithCleanSkills = people.map(user => ({
            ...user.toObject(),
            skills: cleanSkills(user.skills || [])
        }));

        const results = {
            people: peopleWithCleanSkills.filter(user => !user.privacySettings?.isProfilePrivate),
            jobs,
            posts
        };

        console.log('Comprehensive search results:', {
            query: searchQuery,
            people: results.people.length,
            jobs: results.jobs.length,
            posts: results.posts.length
        });

        res.status(200).json(results);
    } catch (error) {
        console.error('Error in comprehensive search:', error);
        res.status(500).json({ message: 'Error searching content' });
    }
};

export const searchPeople = async (req, res) => {
    try {
        const { query } = req.query;
        console.log('Search query:', query, 'Query params:', req.query);
        
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ message: 'Valid search query is required' });
        }

        const searchQuery = query.trim();
        if (searchQuery.length < 1) {
            return res.status(400).json({ message: 'Search query cannot be empty' });
        }

        const users = await User.find({
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } },
                { username: { $regex: searchQuery, $options: 'i' } },
                { headline: { $regex: searchQuery, $options: 'i' } },
                { skills: { $regex: searchQuery, $options: 'i' } }
            ]
        }).select('name email username avatar role profilePicture headline location privacySettings skills').limit(10);

        // Filter out private profiles
        const publicUsers = users.filter(user => !user.privacySettings?.isProfilePrivate);

        console.log('Search query:', searchQuery, 'Found users:', publicUsers.length);
        res.status(200).json(publicUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error searching users' });
    }
};

export const searchJobs = async (req, res) => {
    try {
        const { query, type, skill, location } = req.query;
        console.log('Search params:', { query, type, skill, location });

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ message: 'Valid search query is required' });
        }

        const searchQuery = query.trim();
        if (searchQuery.length < 1) {
            return res.status(400).json({ message: 'Search query cannot be empty' });
        }

        const searchConditions = {
            $and: [
                {
                    $or: [
                        { title: { $regex: searchQuery, $options: 'i' } },
                        { description: { $regex: searchQuery, $options: 'i' } },
                        { skill: { $regex: searchQuery, $options: 'i' } },
                        { technology: { $regex: searchQuery, $options: 'i' } }
                    ]
                }
            ]
        };

        // Add type filter if provided
        if (type) {
            searchConditions.$and.push({ type: { $regex: type, $options: 'i' } });
        }

        // Add skill filter if provided
        if (skill) {
            searchConditions.$and.push({
                $or: [
                    { skill: { $regex: skill, $options: 'i' } },
                    { technology: { $regex: skill, $options: 'i' } }
                ]
            });
        }

        // Add location filter if provided
        if (location) {
            searchConditions.$and.push({ location: { $regex: location, $options: 'i' } });
        }

        const jobs = await Job.find(searchConditions)
            .populate('createdBy', 'name avatar')
            .limit(10);

        console.log('Search results:', { query: searchQuery, filters: { type, skill, location }, count: jobs.length });
        res.status(200).json(jobs);
    } catch (error) {
        console.error('Error searching jobs:', error);
        res.status(500).json({ message: 'Error searching jobs' });
    }
};

export const searchPosts = async (req, res) => {
    try {
        const { query } = req.query;
        const posts = await Post.find({
            $or: [
                { content: { $regex: query, $options: 'i' } },
                { title: { $regex: query, $options: 'i' } }
            ]
        }).populate('author', 'name avatar username').limit(10);

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Error searching posts' });
    }
};

export const searchCompanies = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const companyUsers = await User.find({
            role: 'company',
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { headline: { $regex: query, $options: 'i' } },
                { location: { $regex: query, $options: 'i' } }
            ]
        }).select('name headline location profilePicture privacySettings').limit(10);

        res.status(200).json(companyUsers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};