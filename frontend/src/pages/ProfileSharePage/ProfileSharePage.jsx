import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { axiosInstance } from '../../lib/axios';
import ProfileHeader from '../../components/ProfileHeader/ProfileHeader';
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

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function ProfileSharePage() {
    const { username } = useParams();

    const { data: userData } = useQuery({
        queryKey: ['user', username],
        queryFn: async () => {
            const res = await axiosInstance.get(`/users/profile/${username}`);
            return res.data;
        }
    });

    const { data: userAffiliations } = useQuery({
        queryKey: ['userAffiliations', username],
        queryFn: async () => {
            const res = await axiosInstance.get(`/affiliations/user/${username}`);
            return res.data;
        },
        enabled: !!username
    });

    const { data: userProjects } = useQuery({
        queryKey: ['userProjects', username],
        queryFn: async () => {
            const res = await axiosInstance.get(`/projects/user/${username}`);
            return res.data;
        },
        enabled: !!username
    });

    const { data: projectRatings } = useQuery({
        queryKey: ['projectRatings', username],
        queryFn: async () => {
            const res = await axiosInstance.get(`/projects/my/average-rating`);
            return res.data;
        },
        enabled: !!username
    });

    const chartData = {
        labels: userProjects?.map(project => project.name) || [],
        datasets: [
            {
                label: 'Project Ratings',
                data: userProjects?.map(project => project.averageRating || 0) || [],
                borderColor: 'rgb(75, 192, 192)',
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

    if (!userData) return <div className="text-center p-8">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto p-4">
            {/* Hero Section with User Details */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <ProfileHeader userData={userData} />
            </div>

            {/* Affiliations Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-bold mb-6">Affiliations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userAffiliations?.map(affiliation => (
                        <div key={affiliation._id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center mb-4">
                                <img
                                    src={affiliation.affiliator?.profilePicture || "/avatar.png"}
                                    alt={affiliation.affiliator?.name}
                                    className="w-12 h-12 rounded-full mr-4"
                                />
                                <div>
                                    <h3 className="font-semibold text-lg">{affiliation.affiliator?.name}</h3>
                                    <p className="text-gray-600">{affiliation.role}</p>
                                </div>
                            </div>
                            <p className="text-gray-700">{affiliation.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Projects and Ratings Dashboard */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Projects & Ratings</h2>
                
                {/* Projects List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {userProjects?.map(project => (
                        <div key={project._id} className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                            <p className="text-gray-700 mb-2">{project.description}</p>
                            <div className="flex items-center">
                                <span className="text-yellow-500 mr-1">★</span>
                                <span>{project.averageRating?.toFixed(1) || 'No ratings'}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Ratings Chart */}
                <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Ratings Overview</h3>
                    <div className="h-[300px]">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
}