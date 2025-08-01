import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/axios';
import { Star, Award } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const RatingsSection = ({ userData }) => {
    // Fetch user projects with ratings
    const { data: projects, isLoading: isProjectsLoading } = useQuery({
        queryKey: ['userProjects', userData.username],
        queryFn: async () => {
            const response = await axiosInstance.get(`/projects/user/${userData.username}`);
            return response.data;
        },
    });

    // Fetch overall project rating
    const { data: overallRating, isLoading: isRatingLoading } = useQuery({
        queryKey: ['projectRating', userData.username],
        queryFn: async () => {
            const response = await axiosInstance.get('/projects/rating');
            return response.data;
        },
        enabled: userData._id === userData._id, // Only fetch for own profile
    });

    // Prepare chart data
    const chartData = {
        labels: projects?.map(project => project.name) || [],
        datasets: [
            {
                label: 'Project Ratings',
                data: projects?.map(project => project.averageRating || 0) || [],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top'
            },
            title: {
                display: true,
                text: 'Project Ratings Overview'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 5
            }
        }
    };

    if (isProjectsLoading || isRatingLoading) {
        return <div className="bg-white rounded-lg shadow p-6 my-4">Loading ratings data...</div>;
    }

    // Calculate average rating from projects if overall rating is not available
    const calculateAverageRating = () => {
        if (overallRating?.average) return overallRating.average;
        
        if (!projects || projects.length === 0) return 0;
        
        const projectsWithRatings = projects.filter(p => p.averageRating);
        if (projectsWithRatings.length === 0) return 0;
        
        const sum = projectsWithRatings.reduce((acc, project) => acc + (project.averageRating || 0), 0);
        return sum / projectsWithRatings.length;
    };

    const averageRating = calculateAverageRating();
    const hasRatedProjects = projects?.some(p => p.averageRating > 0);

    return (
        <div className="bg-white rounded-lg shadow p-6 my-4">
            <h2 className="text-xl font-bold flex items-center mb-4">
                <Award className="mr-2" size={20} />
                Ratings & Reviews
            </h2>

            {hasRatedProjects ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Overall Rating</h3>
                            <div className="flex items-center">
                                <div className="text-3xl font-bold text-blue-600 mr-2">
                                    {averageRating.toFixed(1)}
                                </div>
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span 
                                            key={star} 
                                            className={`text-xl ${star <= Math.round(averageRating) ? 'text-yellow-500' : 'text-gray-300'}`}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                Based on {projects?.filter(p => p.averageRating > 0).length || 0} rated projects
                            </p>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Top Rated Project</h3>
                            {(() => {
                                const topProject = [...(projects || [])]
                                    .filter(p => p.averageRating > 0)
                                    .sort((a, b) => b.averageRating - a.averageRating)[0];
                                
                                if (!topProject) return <p className="text-gray-600">No rated projects yet</p>;
                                
                                return (
                                    <div>
                                        <p className="font-semibold">{topProject.name}</p>
                                        <div className="flex items-center mt-1">
                                            <div className="flex">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <span 
                                                        key={star} 
                                                        className={`text-sm ${star <= Math.round(topProject.averageRating) ? 'text-yellow-500' : 'text-gray-300'}`}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="ml-2 text-sm text-gray-600">
                                                ({topProject.averageRating.toFixed(1)})
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Ratings Chart */}
                    {projects?.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-3">Ratings by Project</h3>
                            <div className="h-64">
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-8">
                    <Star className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 mb-1">No Ratings Yet</h3>
                    <p className="text-gray-500">
                        {userData._id === userData._id
                            ? "Your projects haven't received any ratings yet."
                            : `${userData.name}'s projects haven't received any ratings yet.`}
                    </p>
                </div>
            )}
        </div>
    );
};

export default RatingsSection;