import { useQuery } from '@tanstack/react-query';
import { Search, Users, Briefcase, FileText, Building, MapPin, TrendingUp, Star, Calendar, MessageCircle, Heart, Share2, ArrowRight, Sparkles, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { axiosInstance } from '../../lib/axios';
import UserCard from '../../components/UserCard/UserCard';
import ErrorBoundary from '../../components/ErrorBoundary/ErrorBoundary';
import JobPostingForm from '../../components/JobPostingForm/JobPostingForm';

const SearchPageContent = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [showJobForm, setShowJobForm] = useState(false);
    const [jobFilters, setJobFilters] = useState({
        skill: '',
        location: '',
        type: '',
        employmentType: '',
        remote: false
    });

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

    // Recommended skills based on search query
    const getRecommendedSkills = (query) => {
        if (!query) return [];
        const skills = [
            'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'TypeScript',
            'Angular', 'Vue.js', 'Django', 'Flask', 'MongoDB', 'PostgreSQL', 'MySQL',
            'AWS', 'Docker', 'Kubernetes', 'Git', 'Agile', 'Scrum', 'UI/UX',
            'Machine Learning', 'Data Science', 'DevOps', 'Full Stack', 'Frontend',
            'Backend', 'Mobile Development', 'iOS', 'Android', 'Flutter', 'React Native'
        ];
        return skills.filter(skill =>
            skill.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8);
    };

    // Fetch search results
    const { data: searchResults, isLoading } = useQuery({
        queryKey: ['search', selectedFilter, searchQuery, jobFilters],
        queryFn: async () => {
            if (!searchQuery.trim()) return null;
            try {
                const response = await axiosInstance.get(`/search/${selectedFilter}`, {
                    params: {
                        query: searchQuery,
                        ...jobFilters
                    }
                });

                // Handle different response formats based on filter
                if (selectedFilter === 'all') {
                    return response.data; // Already has people, jobs, posts properties
                } else {
                    // For specific filters, wrap the array in the appropriate property
                    const data = response.data;
                    if (selectedFilter === 'people') {
                        const result = { people: data, jobs: [], posts: [] };
                        return result;
                    } else if (selectedFilter === 'jobs') {
                        const result = { people: [], jobs: data, posts: [] };
                        return result;
                    } else if (selectedFilter === 'posts') {
                        const result = { people: [], jobs: [], posts: data };
                        return result;
                    }
                    return response.data;
                }
            } catch (error) {
                console.error('Search error:', error);
                throw new Error('Failed to fetch search results');
            }
        },
        enabled: !!searchQuery.trim()
    });

    // Fetch skill-matched content when no search query
    const { data: skillMatchedContent } = useQuery({
        queryKey: ['skillMatched'],
        queryFn: async () => {
            try {
                const response = await axiosInstance.get('/search/skill-matched');
                return response.data;
            } catch (error) {
                console.error('Error fetching skill-matched content:', error);
                return { people: [], jobs: [], posts: [], userSkills: [] };
            }
        },
        enabled: !searchQuery.trim()
    });

    // Fetch skill-matched content for specific filters
    const { data: filteredSkillMatchedContent } = useQuery({
        queryKey: ['skillMatchedFiltered', selectedFilter],
        queryFn: async () => {
            try {
                const response = await axiosInstance.get(`/search/skill-matched/${selectedFilter}`);
                return response.data;
            } catch (error) {
                console.error('Error fetching filtered skill-matched content:', error);
                return { people: [], jobs: [], posts: [], userSkills: [] };
            }
        },
        enabled: !searchQuery.trim() && selectedFilter !== 'all'
    });

    // Fetch skill-matched content for search results (always enabled)
    const { data: searchSkillMatchedContent } = useQuery({
        queryKey: ['searchSkillMatched'],
        queryFn: async () => {
            try {
                const response = await axiosInstance.get('/search/skill-matched');
                return response.data;
            } catch (error) {
                console.error('Error fetching skill-matched content for search:', error);
                return { people: [], jobs: [], posts: [], userSkills: [] };
            }
        },
        enabled: true // Always fetch skill-matched content
    });

    const renderRecommendedSkills = () => {
        const skills = getRecommendedSkills(searchQuery);
        if (skills.length === 0) return null;

        return (
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Sparkles className="mr-2 text-blue-600" size={20} />
                    Recommended Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                        <button
                            key={index}
                            onClick={() => setSearchQuery(skill)}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                        >
                            {skill}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const renderSkillMatchedSection = () => {
        const content = filteredSkillMatchedContent || skillMatchedContent;
        if (!content) return null;

        return (
            <div className="space-y-6">
                {/* User Skills Display */}
                {content.userSkills && content.userSkills.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                            <Sparkles className="mr-2 text-blue-600" size={20} />
                            Your Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {cleanSkills(content.userSkills).map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-300"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                        <p className="text-sm text-blue-700 mt-2">
                            Showing {selectedFilter === 'all' ? 'all' : selectedFilter} that matches your skills
                        </p>
                    </div>
                )}

                {/* Skill-Matched People */}
                {selectedFilter === 'all' && content.people && content.people.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center">
                                <Users className="mr-2 text-green-600" size={20} />
                                People with Similar Skills
                            </h3>
                            <Link to="/search?filter=people" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                                View all <ArrowRight size={16} className="ml-1" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {content.people.map(user => (
                                <Link to={`/profile/${user.username}`} key={user._id} className="block">
                                    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer">
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={user.profilePicture
                                                    ? `http://localhost:5000/uploads/${user.profilePicture}`
                                                    : "/avatar.png"}

                                                alt={user.name}
                                                className="w-12 h-12 rounded-full"
                                            />
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">{user.name}</h4>
                                                <p className="text-sm text-gray-600">{user.headline || user.role}</p>
                                                <p className="text-xs text-gray-500">{user.location}</p>
                                                {user.skills && user.skills.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {cleanSkills(user.skills).slice(0, 2).map((skill, index) => (
                                                            <span key={index} className="px-1 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Skill-Matched Jobs */}
                {selectedFilter === 'all' && content.jobs && content.jobs.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center">
                                <Briefcase className="mr-2 text-blue-600" size={20} />
                                Jobs Matching Your Skills
                            </h3>
                            <Link to="/search?filter=jobs" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                                View all <ArrowRight size={16} className="ml-1" />
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {content.jobs.map(job => (
                                <Link to={`/jobs/${job._id}`} key={job._id} className="block">
                                    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border-l-4 border-green-500">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">{job.title}</h4>
                                                <div className="flex items-center text-sm text-gray-600 mb-1">
                                                    <Briefcase className="mr-1" size={14} />
                                                    {job.createdBy ? (
                                                        <Link
                                                            to={`/profile/${job.createdBy.username}`}
                                                            className="text-blue-600 hover:text-blue-800 hover:underline"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {job.createdBy.name}
                                                        </Link>
                                                    ) : (
                                                        "Unknown"
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600">{job.location}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                    <span className="flex items-center">
                                                        <MapPin size={14} className="mr-1" />
                                                        {job.type}
                                                    </span>
                                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                                        ${job.package}
                                                    </span>
                                                </div>
                                                {job.skill && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {job.skill.split(',').slice(0, 3).map((skill, index) => (
                                                            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                                                {cleanSkill(skill.trim())}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <Star className="text-yellow-400" size={16} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Skill-Matched Posts */}
                {selectedFilter === 'all' && content.posts && content.posts.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center">
                                <FileText className="mr-2 text-purple-600" size={20} />
                                Posts Related to Your Skills
                            </h3>
                            <Link to="/search?filter=posts" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                                View all <ArrowRight size={16} className="ml-1" />
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {content.posts.map(post => (
                                <Link to={`/posts/${post._id}`} key={post._id} className="block">
                                    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                        <div className="flex items-start space-x-3">
                                            <img
                                                src={post.author?.profilePicture || "/avatar.png"}
                                                alt={post.author?.name}
                                                className="w-10 h-10 rounded-full"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-semibold text-gray-900">{post.author?.name}</h4>
                                                    <span className="text-xs text-gray-500">•</span>
                                                    <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-gray-700 line-clamp-2">{post.content}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                    <span className="flex items-center">
                                                        <Heart size={14} className="mr-1" />
                                                        {post.likes?.length || 0}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <MessageCircle size={14} className="mr-1" />
                                                        {post.comments?.length || 0}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Share2 size={14} className="mr-1" />
                                                        Share
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filtered Content Display */}
                {selectedFilter !== 'all' && (
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center">
                                {selectedFilter === 'people' && <Users className="mr-2 text-green-600" size={20} />}
                                {selectedFilter === 'jobs' && <Briefcase className="mr-2 text-blue-600" size={20} />}
                                {selectedFilter === 'posts' && <FileText className="mr-2 text-purple-600" size={20} />}
                                {selectedFilter === 'people' && 'People with Similar Skills'}
                                {selectedFilter === 'jobs' && 'Jobs Matching Your Skills'}
                                {selectedFilter === 'posts' && 'Posts Related to Your Skills'}
                            </h3>
                        </div>

                        {selectedFilter === 'people' && content.people && content.people.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {content.people.map(user => (
                                    <Link to={`/profile/${user.username}`} key={user._id} className="block">
                                        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer">
                                            <div className="flex items-center space-x-3">
                                                <img
                                                    src={user.profilePicture || "/avatar.png"}
                                                    alt={user.name}
                                                    className="w-12 h-12 rounded-full"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900">{user.name}</h4>
                                                    <p className="text-sm text-gray-600">{user.headline || user.role}</p>
                                                    <p className="text-xs text-gray-500">{user.location}</p>
                                                    {user.skills && user.skills.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {cleanSkills(user.skills).slice(0, 2).map((skill, index) => (
                                                                <span key={index} className="px-1 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {selectedFilter === 'jobs' && content.jobs && content.jobs.length > 0 && (
                            <div className="space-y-4">
                                {content.jobs.map(job => (
                                    <Link to={`/jobs/${job._id}`} key={job._id} className="block">
                                        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border-l-4 border-green-500">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900">{job.title}</h4>
                                                    <div className="flex items-center text-sm text-gray-600 mb-1">
                                                        <Briefcase className="mr-1" size={14} />
                                                        {job.createdBy ? (
                                                            <Link
                                                                to={`/profile/${job.createdBy.username}`}
                                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {job.createdBy.name}
                                                            </Link>
                                                        ) : (
                                                            "Unknown"
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600">{job.location}</p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                        <span className="flex items-center">
                                                            <MapPin size={14} className="mr-1" />
                                                            {job.type}
                                                        </span>
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                                            ${job.package}
                                                        </span>
                                                    </div>
                                                    {job.skill && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {job.skill.split(',').slice(0, 3).map((skill, index) => (
                                                                <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                                                    {cleanSkill(skill.trim())}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <Star className="text-yellow-400" size={16} />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {selectedFilter === 'posts' && content.posts && content.posts.length > 0 && (
                            <div className="space-y-4">
                                {content.posts.map(post => (
                                    <Link to={`/posts/${post._id}`} key={post._id} className="block">
                                        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                            <div className="flex items-start space-x-3">
                                                <img
                                                    src={post.author?.profilePicture || "/avatar.png"}
                                                    alt={post.author?.name}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h4 className="font-semibold text-gray-900">{post.author?.name}</h4>
                                                        <span className="text-xs text-gray-500">•</span>
                                                        <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-gray-700 line-clamp-2">{post.content}</p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                        <span className="flex items-center">
                                                            <Heart size={14} className="mr-1" />
                                                            {post.likes?.length || 0}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <MessageCircle size={14} className="mr-1" />
                                                            {post.comments?.length || 0}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <Share2 size={14} className="mr-1" />
                                                            Share
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {((selectedFilter === 'people' && (!content.people || content.people.length === 0)) ||
                            (selectedFilter === 'jobs' && (!content.jobs || content.jobs.length === 0)) ||
                            (selectedFilter === 'posts' && (!content.posts || content.posts.length === 0))) && (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 mb-2">
                                        {selectedFilter === 'people' && <Users size={48} />}
                                        {selectedFilter === 'jobs' && <Briefcase size={48} />}
                                        {selectedFilter === 'posts' && <FileText size={48} />}
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        No {selectedFilter} found matching your skills
                                    </h3>
                                    <p className="text-gray-600">Try adding more skills to your profile or search for different terms</p>
                                </div>
                            )}
                    </div>
                )}

                {/* No Skills Message */}
                {content.message && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <Sparkles className="text-yellow-600 mr-2" size={20} />
                            <div>
                                <h4 className="font-semibold text-yellow-800">No Skills Found</h4>
                                <p className="text-yellow-700 text-sm">Add skills to your profile to see personalized content</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Main return statement for SearchPageContent
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Search Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Search</h1>
                    <p className="text-gray-600">Find people, jobs, and posts that match your skills</p>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search for skills, people, jobs, or posts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={selectedFilter}
                                onChange={(e) => setSelectedFilter(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All</option>
                                <option value="people">People</option>
                                <option value="jobs">Jobs</option>
                                <option value="posts">Posts</option>
                            </select>
                            <button
                                onClick={() => setShowJobForm(true)}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Plus size={20} />
                                Submit Job
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recommended Skills */}
                {searchQuery && renderRecommendedSkills()}

                {/* Search Results or Skill-Matched Content */}
                {searchQuery ? (
                    <div className="space-y-6">
                        {isLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Searching...</p>
                            </div>
                        ) : searchResults ? (
                            <div className="space-y-6">
                                {/* Search Results Section */}
                                <div className="bg-white rounded-lg shadow-sm border p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold flex items-center">
                                            <Search className="mr-2 text-blue-600" size={20} />
                                            Search Results for "{searchQuery}"
                                        </h3>
                                    </div>

                                    {/* Search Results Content */}
                                    {selectedFilter === 'all' && (
                                        <>
                                            {searchResults.people && searchResults.people.length > 0 && (
                                                <div className="mb-6">
                                                    <h4 className="text-md font-semibold mb-3 flex items-center">
                                                        <Users className="mr-2 text-green-600" size={16} />
                                                        People ({searchResults.people.length})
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {searchResults.people.map(user => (
                                                            <Link to={`/profile/${user.username}`} key={user._id} className="block">
                                                                <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer">
                                                                    <div className="flex items-center space-x-3">
                                                                        <img
                                                                            src={user.profilePicture || "/avatar.png"}
                                                                            alt={user.name}
                                                                            className="w-12 h-12 rounded-full"
                                                                        />
                                                                        <div className="flex-1">
                                                                            <h4 className="font-semibold text-gray-900">{user.name}</h4>
                                                                            <p className="text-sm text-gray-600">{user.headline || user.role}</p>
                                                                            <p className="text-xs text-gray-500">{user.location}</p>
                                                                            {user.skills && user.skills.length > 0 && (
                                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                                    {cleanSkills(user.skills).slice(0, 2).map((skill, index) => (
                                                                                        <span key={index} className="px-1 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                                                                            {skill}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {searchResults.jobs && searchResults.jobs.length > 0 && (
                                                <div className="mb-6">
                                                    <h4 className="text-md font-semibold mb-3 flex items-center">
                                                        <Briefcase className="mr-2 text-blue-600" size={16} />
                                                        Jobs ({searchResults.jobs.length})
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {searchResults.jobs.map(job => (
                                                            <Link to={`/jobs/${job._id}`} key={job._id} className="block">
                                                                <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border-l-4 border-green-500">
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex-1">
                                                                            <h4 className="font-semibold text-gray-900">{job.title}</h4>
                                                                            <div className="flex items-center text-sm text-gray-600 mb-1">
                                                                                <Briefcase className="mr-1" size={14} />
                                                                                {job.createdBy ? (
                                                                                    <Link
                                                                                        to={`/profile/${job.createdBy.username}`}
                                                                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                    >
                                                                                        {job.createdBy.name}
                                                                                    </Link>
                                                                                ) : (
                                                                                    "Unknown"
                                                                                )}
                                                                            </div>
                                                                            <p className="text-sm text-gray-600">{job.location}</p>
                                                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                                                <span className="flex items-center">
                                                                                    <MapPin size={14} className="mr-1" />
                                                                                    {job.type}
                                                                                </span>
                                                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                                                                    ${job.package}
                                                                                </span>
                                                                            </div>
                                                                            {job.skill && (
                                                                                <div className="flex flex-wrap gap-1 mt-2">
                                                                                    {job.skill.split(',').slice(0, 3).map((skill, index) => (
                                                                                        <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                                                                            {cleanSkill(skill.trim())}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <Star className="text-yellow-400" size={16} />
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {searchResults.posts && searchResults.posts.length > 0 && (
                                                <div className="mb-6">
                                                    <h4 className="text-md font-semibold mb-3 flex items-center">
                                                        <FileText className="mr-2 text-purple-600" size={16} />
                                                        Posts ({searchResults.posts.length})
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {searchResults.posts.map(post => (
                                                            <Link to={`/posts/${post._id}`} key={post._id} className="block">
                                                                <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                                                    <div className="flex items-start space-x-3">
                                                                        <img
                                                                            src={post.author?.profilePicture || "/avatar.png"}
                                                                            alt={post.author?.name}
                                                                            className="w-10 h-10 rounded-full"
                                                                        />
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <h4 className="font-semibold text-gray-900">{post.author?.name}</h4>
                                                                                <span className="text-xs text-gray-500">•</span>
                                                                                <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                                                                            </div>
                                                                            <p className="text-gray-700 line-clamp-2">{post.content}</p>
                                                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                                                <span className="flex items-center">
                                                                                    <Heart size={14} className="mr-1" />
                                                                                    {post.likes?.length || 0}
                                                                                </span>
                                                                                <span className="flex items-center">
                                                                                    <MessageCircle size={14} className="mr-1" />
                                                                                    {post.comments?.length || 0}
                                                                                </span>
                                                                                <span className="flex items-center">
                                                                                    <Share2 size={14} className="mr-1" />
                                                                                    Share
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Filtered Search Results */}
                                    {selectedFilter !== 'all' && (
                                        <div className="space-y-4">
                                            {selectedFilter === 'people' && searchResults.people && searchResults.people.length > 0 && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {searchResults.people.map(user => (
                                                        <Link to={`/profile/${user.username}`} key={user._id} className="block">
                                                            <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer">
                                                                <div className="flex items-center space-x-3">
                                                                    <img
                                                                        src={user.profilePicture || "/avatar.png"}
                                                                        alt={user.name}
                                                                        className="w-12 h-12 rounded-full"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <h4 className="font-semibold text-gray-900">{user.name}</h4>
                                                                        <p className="text-sm text-gray-600">{user.headline || user.role}</p>
                                                                        <p className="text-xs text-gray-500">{user.location}</p>
                                                                        {user.skills && user.skills.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                                {cleanSkills(user.skills).slice(0, 2).map((skill, index) => (
                                                                                    <span key={index} className="px-1 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                                                                        {skill}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            {selectedFilter === 'jobs' && searchResults.jobs && searchResults.jobs.length > 0 && (
                                                <div className="space-y-4">
                                                    {searchResults.jobs.map(job => (
                                                        <Link to={`/jobs/${job._id}`} key={job._id} className="block">
                                                            <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border-l-4 border-green-500">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex-1">
                                                                        <h4 className="font-semibold text-gray-900">{job.title}</h4>
                                                                        <div className="flex items-center text-sm text-gray-600 mb-1">
                                                                            <Briefcase className="mr-1" size={14} />
                                                                            {job.createdBy ? (
                                                                                <Link
                                                                                    to={`/profile/${job.createdBy.username}`}
                                                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    {job.createdBy.name}
                                                                                </Link>
                                                                            ) : (
                                                                                "Unknown"
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-gray-600">{job.location}</p>
                                                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                                            <span className="flex items-center">
                                                                                <MapPin size={14} className="mr-1" />
                                                                                {job.type}
                                                                            </span>
                                                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                                                                ${job.package}
                                                                            </span>
                                                                        </div>
                                                                        {job.skill && (
                                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                                {job.skill.split(',').slice(0, 3).map((skill, index) => (
                                                                                    <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                                                                        {cleanSkill(skill.trim())}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <Star className="text-yellow-400" size={16} />
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            {selectedFilter === 'posts' && searchResults.posts && searchResults.posts.length > 0 && (
                                                <div className="space-y-4">
                                                    {searchResults.posts.map(post => (
                                                        <Link to={`/posts/${post._id}`} key={post._id} className="block">
                                                            <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                                                <div className="flex items-start space-x-3">
                                                                    <img
                                                                        src={post.author?.profilePicture || "/avatar.png"}
                                                                        alt={post.author?.name}
                                                                        className="w-10 h-10 rounded-full"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <h4 className="font-semibold text-gray-900">{post.author?.name}</h4>
                                                                            <span className="text-xs text-gray-500">•</span>
                                                                            <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                                                                        </div>
                                                                        <p className="text-gray-700 line-clamp-2">{post.content}</p>
                                                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                                            <span className="flex items-center">
                                                                                <Heart size={14} className="mr-1" />
                                                                                {post.likes?.length || 0}
                                                                            </span>
                                                                            <span className="flex items-center">
                                                                                <MessageCircle size={14} className="mr-1" />
                                                                                {post.comments?.length || 0}
                                                                            </span>
                                                                            <span className="flex items-center">
                                                                                <Share2 size={14} className="mr-1" />
                                                                                Share
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            {((selectedFilter === 'people' && (!searchResults.people || searchResults.people.length === 0)) ||
                                                (selectedFilter === 'jobs' && (!searchResults.jobs || searchResults.jobs.length === 0)) ||
                                                (selectedFilter === 'posts' && (!searchResults.posts || searchResults.posts.length === 0))) && (
                                                    <div className="text-center py-8">
                                                        <div className="text-gray-400 mb-2">
                                                            {selectedFilter === 'people' && <Users size={48} />}
                                                            {selectedFilter === 'jobs' && <Briefcase size={48} />}
                                                            {selectedFilter === 'posts' && <FileText size={48} />}
                                                        </div>
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                            No {selectedFilter} found for "{searchQuery}"
                                                        </h3>
                                                        <p className="text-gray-600">Try different search terms or check your spelling</p>
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                </div>

                                {/* Skill-Matched Content Section (when searching) */}
                                {searchSkillMatchedContent && (
                                    <div className="bg-white rounded-lg shadow-sm border p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold flex items-center">
                                                <Sparkles className="mr-2 text-blue-600" size={20} />
                                                Recommended for You (Based on Your Skills)
                                            </h3>
                                        </div>

                                        {/* User Skills Display */}
                                        {searchSkillMatchedContent.userSkills && searchSkillMatchedContent.userSkills.length > 0 && (
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
                                                <h4 className="text-md font-semibold mb-2 flex items-center">
                                                    <Sparkles className="mr-2 text-blue-600" size={16} />
                                                    Your Skills
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {cleanSkills(searchSkillMatchedContent.userSkills).map((skill, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-300"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Skill-Matched People */}
                                        {searchSkillMatchedContent.people && searchSkillMatchedContent.people.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-md font-semibold mb-3 flex items-center">
                                                    <Users className="mr-2 text-green-600" size={16} />
                                                    People with Similar Skills
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {searchSkillMatchedContent.people.map(user => (
                                                        <Link to={`/profile/${user.username}`} key={user._id} className="block">
                                                            <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer">
                                                                <div className="flex items-center space-x-3">
                                                                    <img
                                                                        src={user.profilePicture || "/avatar.png"}
                                                                        alt={user.name}
                                                                        className="w-12 h-12 rounded-full"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <h4 className="font-semibold text-gray-900">{user.name}</h4>
                                                                        <p className="text-sm text-gray-600">{user.headline || user.role}</p>
                                                                        <p className="text-xs text-gray-500">{user.location}</p>
                                                                        {user.skills && user.skills.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                                {cleanSkills(user.skills).slice(0, 2).map((skill, index) => (
                                                                                    <span key={index} className="px-1 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                                                                        {skill}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Skill-Matched Jobs */}
                                        {searchSkillMatchedContent.jobs && searchSkillMatchedContent.jobs.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-md font-semibold mb-3 flex items-center">
                                                    <Briefcase className="mr-2 text-blue-600" size={16} />
                                                    Jobs Matching Your Skills
                                                </h4>
                                                <div className="space-y-4">
                                                    {searchSkillMatchedContent.jobs.map(job => (
                                                        <Link to={`/jobs/${job._id}`} key={job._id} className="block">
                                                            <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border-l-4 border-green-500">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex-1">
                                                                        <h4 className="font-semibold text-gray-900">{job.title}</h4>
                                                                        <div className="flex items-center text-sm text-gray-600 mb-1">
                                                                            <Briefcase className="mr-1" size={14} />
                                                                            {job.createdBy ? (
                                                                                <Link
                                                                                    to={`/profile/${job.createdBy.username}`}
                                                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    {job.createdBy.name}
                                                                                </Link>
                                                                            ) : (
                                                                                "Unknown"
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-gray-600">{job.location}</p>
                                                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                                            <span className="flex items-center">
                                                                                <MapPin size={14} className="mr-1" />
                                                                                {job.type}
                                                                            </span>
                                                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                                                                ${job.package}
                                                                            </span>
                                                                        </div>
                                                                        {job.skill && (
                                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                                {job.skill.split(',').slice(0, 3).map((skill, index) => (
                                                                                    <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                                                                        {cleanSkill(skill.trim())}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <Star className="text-yellow-400" size={16} />
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Skill-Matched Posts */}
                                        {searchSkillMatchedContent.posts && searchSkillMatchedContent.posts.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-md font-semibold mb-3 flex items-center">
                                                    <FileText className="mr-2 text-purple-600" size={16} />
                                                    Posts Related to Your Skills
                                                </h4>
                                                <div className="space-y-4">
                                                    {searchSkillMatchedContent.posts.map(post => (
                                                        <Link to={`/posts/${post._id}`} key={post._id} className="block">
                                                            <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                                                <div className="flex items-start space-x-3">
                                                                    <img
                                                                        src={post.author?.profilePicture || "/avatar.png"}
                                                                        alt={post.author?.name}
                                                                        className="w-10 h-10 rounded-full"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <h4 className="font-semibold text-gray-900">{post.author?.name}</h4>
                                                                            <span className="text-xs text-gray-500">•</span>
                                                                            <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                                                                        </div>
                                                                        <p className="text-gray-700 line-clamp-2">{post.content}</p>
                                                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                                            <span className="flex items-center">
                                                                                <Heart size={14} className="mr-1" />
                                                                                {post.likes?.length || 0}
                                                                            </span>
                                                                            <span className="flex items-center">
                                                                                <MessageCircle size={14} className="mr-1" />
                                                                                {post.comments?.length || 0}
                                                                            </span>
                                                                            <span className="flex items-center">
                                                                                <Share2 size={14} className="mr-1" />
                                                                                Share
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* No Skills Message */}
                                        {searchSkillMatchedContent.message && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <div className="flex items-center">
                                                    <Sparkles className="text-yellow-600 mr-2" size={20} />
                                                    <div>
                                                        <h4 className="font-semibold text-yellow-800">No Skills Found</h4>
                                                        <p className="text-yellow-700 text-sm">Add skills to your profile to see personalized content</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                ) : (
                    renderSkillMatchedSection()
                )}

                {/* Job Posting Form Modal */}
                <JobPostingForm
                    isOpen={showJobForm}
                    onClose={() => setShowJobForm(false)}
                    onPosted={() => {
                        setShowJobForm(false);
                        // Refresh the page or invalidate queries to show the new job
                        window.location.reload();
                    }}
                />
            </div>
        </div>
    );
};

const SearchPage = () => {
    return (
        <ErrorBoundary>
            <SearchPageContent />
        </ErrorBoundary>
    );
};

export default SearchPage;