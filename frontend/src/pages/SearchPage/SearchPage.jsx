import { useQuery } from '@tanstack/react-query';
import { Search, Users, Briefcase, FileText, Building, MapPin, TrendingUp, Star, Calendar, MessageCircle, Heart, Share2, ArrowRight, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { axiosInstance } from '../../lib/axios';
import UserCard from '../../components/UserCard/UserCard';
import ErrorBoundary from '../../components/ErrorBoundary/ErrorBoundary';

const SearchPageContent = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [jobFilters, setJobFilters] = useState({
        skill: '',
        location: '',
        type: '',
        employmentType: '',
        remote: false
    });

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
            console.log('Making search request:', selectedFilter, searchQuery);
            try {
                const response = await axiosInstance.get(`/search/${selectedFilter}`, {
                    params: {
                        query: searchQuery,
                        ...jobFilters
                    }
                });
                return response.data;
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
                            {content.userSkills.map((skill, index) => (
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
                                <div key={user._id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
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
                                                    {user.skills.slice(0, 2).map((skill, index) => (
                                                        <span key={index} className="px-1 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
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
                                                                {skill.trim()}
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
                                    <div key={user._id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
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
                                                        {user.skills.slice(0, 2).map((skill, index) => (
                                                            <span key={index} className="px-1 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
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
                                                                    {skill.trim()}
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

    const renderSearchResults = () => {
        if (!searchQuery.trim()) {
            return renderSkillMatchedSection();
        }
        
        if (isLoading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Searching...</span>
                </div>
            );
        }

        if (!searchResults || searchResults.length === 0) {
            return (
                <div className="text-center py-12">
                    <Search className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600">Try adjusting your search terms or filters</p>
                </div>
            );
        }

        const renderPeopleResults = () => (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map(user => (
                    <div key={user._id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                        <UserCard user={user} />
                    </div>
                ))}
            </div>
        );

        const renderJobsResults = () => (
            <div className="space-y-4">
                {searchResults.map(job => (
                    <Link to={`/jobs/${job._id}`} key={job._id} className="block">
                        <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow border-l-4 border-blue-500">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{job.title}</h3>
                                    <p className="text-gray-600 mb-3">{job.description?.substring(0, 150)}...</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                        <span className="flex items-center">
                                            <MapPin size={16} className="mr-1" />
                                            {job.location}
                                        </span>
                                        <span className="flex items-center">
                                            <Briefcase size={16} className="mr-1" />
                                            {job.type}
                                        </span>
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                            ${job.package}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {job.skill?.split(',').map((skill, index) => (
                                            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                                {skill.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-shrink-0 ml-4">
                                    <Star className="text-yellow-400" size={20} />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        );

        const renderPostsResults = () => (
            <div className="space-y-4">
                {searchResults.map(post => (
                    <Link to={`/posts/${post._id}`} key={post._id} className="block">
                        <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start space-x-4">
                                <img
                                    src={post.author?.profilePicture || "/avatar.png"}
                                    alt={post.author?.name}
                                    className="w-12 h-12 rounded-full"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <h4 className="font-semibold text-gray-900">{post.author?.name}</h4>
                                        <span className="text-gray-500">•</span>
                                        <span className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2">{post.title || "Post"}</h3>
                                    <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>
                                    <div className="flex items-center gap-6 text-sm text-gray-500">
                                        <span className="flex items-center">
                                            <Heart size={16} className="mr-1" />
                                            {post.likes?.length || 0} likes
                                        </span>
                                        <span className="flex items-center">
                                            <MessageCircle size={16} className="mr-1" />
                                            {post.comments?.length || 0} comments
                                        </span>
                                        <span className="flex items-center">
                                            <Share2 size={16} className="mr-1" />
                                            Share
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        );

        switch (selectedFilter) {
            case 'people':
                return renderPeopleResults();
            case 'jobs':
                return renderJobsResults();
            case 'posts':
                return renderPostsResults();
            case 'all':
                return (
                    <div className="space-y-8">
                        {searchResults.people && searchResults.people.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <Users className="mr-2 text-blue-600" size={20} />
                                    People ({searchResults.people.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {searchResults.people.slice(0, 6).map(user => (
                                        <div key={user._id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                                            <UserCard user={user} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {searchResults.jobs && searchResults.jobs.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <Briefcase className="mr-2 text-green-600" size={20} />
                                    Jobs ({searchResults.jobs.length})
                                </h3>
                                {renderJobsResults()}
                            </div>
                        )}
                        {searchResults.posts && searchResults.posts.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <FileText className="mr-2 text-purple-600" size={20} />
                                    Posts ({searchResults.posts.length})
                                </h3>
                                {renderPostsResults()}
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    const handleFilterChange = (field, value) => {
        setJobFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Hero Section */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Find what you're looking for</h1>
                <p className="text-gray-600 text-lg">Search for people, jobs, posts, and more</p>
            </div>

            <div className="flex gap-6">
                {/* Filters Sidebar */}
                <div className="w-80 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
                        <h2 className="font-semibold text-lg mb-4">Search Filters</h2>
                        
                        {/* Search Type Filter */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Search Type</label>
                            <div className="space-y-2">
                                {[
                                    { key: 'all', label: 'All', icon: Search },
                                    { key: 'people', label: 'People', icon: Users },
                                    { key: 'jobs', label: 'Jobs', icon: Briefcase },
                                    { key: 'posts', label: 'Posts', icon: FileText }
                                ].map(({ key, label, icon: Icon }) => (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedFilter(key)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                                            selectedFilter === key 
                                                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <Icon size={18} />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Job Filters */}
                        {selectedFilter === 'jobs' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                                    <select
                                        value={jobFilters.employmentType}
                                        onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                                        className="w-full border rounded-lg p-2 text-sm"
                                    >
                                        <option value="">All Types</option>
                                        <option value="Full-time">Full-time</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Internship">Internship</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                                    <input
                                        type="text"
                                        value={jobFilters.skill}
                                        onChange={(e) => handleFilterChange('skill', e.target.value)}
                                        placeholder="e.g. JavaScript, React"
                                        className="w-full border rounded-lg p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={jobFilters.location}
                                        onChange={(e) => handleFilterChange('location', e.target.value)}
                                        placeholder="e.g. New York, Remote"
                                        className="w-full border rounded-lg p-2 text-sm"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="remote"
                                        checked={jobFilters.remote}
                                        onChange={(e) => handleFilterChange('remote', e.target.checked)}
                                        className="mr-2"
                                    />
                                    <label htmlFor="remote" className="text-sm text-gray-700">Remote Only</label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Search for people, jobs, posts, skills..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        />
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                    </div>

                    {/* Recommended Skills */}
                    {searchQuery && renderRecommendedSkills()}

                    {/* Search Results */}
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="p-6">
                            {searchQuery && (
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Results for "{searchQuery}"
                                    </h2>
                                    <span className="text-sm text-gray-500">
                                        {searchResults?.length || 0} results
                                    </span>
                                </div>
                            )}
                            {renderSearchResults()}
                        </div>
                    </div>
                </div>
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