import User from '../models/user.model.js';
import Post from '../models/post.model.js';
import Job from '../models/job.model.js';
import Company from '../models/company.model.js';

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
                { username: { $regex: searchQuery, $options: 'i' } }
            ]
        }).select('name email username avatar role').limit(10);

        console.log('Search query:', searchQuery, 'Found users:', users.length);
        res.status(200).json(users);
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
        }).populate('author', 'name avatar username');

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
        }).select('name headline location profilePicture').limit(10);

        res.status(200).json(companyUsers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};