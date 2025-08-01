import { useQuery } from '@tanstack/react-query';
import { Search, Users, Briefcase, FileText, Building, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { axiosInstance } from '../../lib/axios';
import UserCard from '../../components/UserCard/UserCard';
import ErrorBoundary from '../../components/ErrorBoundary/ErrorBoundary';

const SearchPageContent = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('people');
    const [jobFilters, setJobFilters] = useState({
        skill: '',
        location: '',
        type: '',
        employmentType: '',
        remote: false
    });

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

    const renderSearchResults = () => {
        if (!searchQuery.trim()) {
            return <p className="text-gray-500 text-center py-4">Enter a search term to begin</p>;
        }
        
        if (isLoading) {
            return <p className="text-gray-500 text-center py-4">Loading...</p>;
        }

        if (!searchResults || searchResults.length === 0) {
            return <p className="text-gray-500 text-center py-4">No results found</p>;
        }

        switch (selectedFilter) {
            case 'people':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {searchResults.map(user => (
                            <UserCard key={user._id} user={user} />
                        ))}
                    </div>
                );
            case 'jobs':
                return (
                    <div className="space-y-4">
                        {searchResults.map(job => (
                            <Link to={`/jobs/${job._id}`} key={job._id} className="block">
                                <div className="p-4 border rounded-lg hover:bg-gray-50 transition cursor-pointer">
                                    <h3 className="font-semibold text-lg text-primary">{job.title}</h3>
                                    <p className="text-gray-600">{job.company}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <MapPin size={16} />
                                            {job.location}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Briefcase size={16} />
                                            {job.type}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {job.skill && <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">{job.skill}</span>}
                                        {job.technology && <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">{job.technology}</span>}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                );
            case 'posts':
                return (
                    <div className="space-y-4">
                        {searchResults.map(post => (
                            <div key={post._id} className="p-4 border rounded-lg hover:bg-gray-50">
                                <p className="text-gray-800">{post.content}</p>
                                <p className="text-gray-500 mt-2">Posted by {post.author.name}</p>
                            </div>
                        ))}
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
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex gap-4">
                <div className="w-64 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow p-4">
                        <h2 className="font-semibold mb-4">Filter Search</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                                <select
                                    value={jobFilters.employmentType}
                                    onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                                    className="w-full border rounded p-2"
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
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={jobFilters.location}
                                    onChange={(e) => handleFilterChange('location', e.target.value)}
                                    placeholder="e.g. New York, Remote"
                                    className="w-full border rounded p-2"
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
                    </div>
                </div>

                <div className="flex-1">
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    </div>

                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4">
                            <div className="flex gap-4 mb-4">
                                <button
                                    onClick={() => setSelectedFilter('people')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded ${selectedFilter === 'people' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                                >
                                    <Users size={20} />
                                    People
                                </button>
                                <button
                                    onClick={() => setSelectedFilter('jobs')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded ${selectedFilter === 'jobs' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                                >
                                    <Briefcase size={20} />
                                    Jobs
                                </button>
                                <button
                                    onClick={() => setSelectedFilter('posts')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded ${selectedFilter === 'posts' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                                >
                                    <FileText size={20} />
                                    Posts
                                </button>
                            </div>
                            {searchQuery && <h2 className="font-semibold mb-4">Results for "{searchQuery}"</h2>}
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