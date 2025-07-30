const User = require('../models/User');
const Post = require('../models/Post');
const Job = require('../models/Job');
const Company = require('../models/Company');

exports.searchPeople = async (req, res) => {
    try {
        const { query } = req.query;
        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { username: { $regex: query, $options: 'i' } }
            ]
        }).select('name email username avatar role');

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error searching users' });
    }
};

exports.searchJobs = async (req, res) => {
    try {
        const { query } = req.query;
        const jobs = await Job.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { company: { $regex: query, $options: 'i' } }
            ]
        }).populate('postedBy', 'name avatar');

        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error searching jobs' });
    }
};

exports.searchPosts = async (req, res) => {
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

exports.searchCompanies = async (req, res) => {
    try {
        const { query } = req.query;
        const companies = await Company.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { industry: { $regex: query, $options: 'i' } }
            ]
        });

        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: 'Error searching companies' });
    }
};