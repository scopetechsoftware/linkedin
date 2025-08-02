import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
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
    
    // Add new query to fetch affiliators (organizations the user is affiliated with)
    const { data: userAffiliators } = useQuery({
        queryKey: ['userAffiliators', username],
        queryFn: async () => {
            const res = await axiosInstance.get(`/affiliations/affiliators/${username}`);
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
            // If we're viewing another user's profile, we should get their projects' ratings
            // If we're viewing our own profile, we can use the my/average-rating endpoint
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

            {/* Check if profile is private */}
            {(() => {
                // Helper function to safely parse privacySettings
                const parsePrivacySettings = (settings) => {
                    if (!settings) return { isProfilePrivate: false };
                    if (typeof settings === 'string') {
                        if (settings === '[object Object]') {
                            return { isProfilePrivate: false };
                        }
                        try {
                            return JSON.parse(settings);
                        } catch (e) {
                            console.error('Error parsing privacySettings:', e);
                            return { isProfilePrivate: false };
                        }
                    }
                    return settings;
                };
                
                // Get privacySettings from userData
                const settings = parsePrivacySettings(userData.privacySettings);
                return settings.isProfilePrivate;
            })() ? (
                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                    <div className="text-gray-600 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <h2 className="text-2xl font-bold mb-2">This Profile is Private</h2>
                        <p className="text-lg">The user has chosen to keep their profile private.</p>
                        <p className="mt-2">Only basic profile information is visible.</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Organizations & Companies Section */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                        <h2 className="text-2xl font-bold mb-6">Organizations & Companies</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {userAffiliators?.map(affiliation => {
                                const org = affiliation.affiliator;
                                const getOrgType = (role) => {
                                    switch (role) {
                                        case "company":
                                            return "Company";
                                        case "university":
                                            return "University";
                                        case "employer":
                                            return "Employer";
                                        default:
                                            return "Organization";
                                    }
                                };
                                
                                // Use organization name, fallback to username if name is not set
                                const orgDisplayName = org.name || org.username;
                                
                                return (
                                    <div key={affiliation._id} className={`bg-gray-50 rounded-lg p-4 ${!affiliation.isActive ? 'opacity-70' : ''}`}>
                                        <div className="flex items-center mb-4">
                                            <Link to={`/profile/${org.username}`}>
                                                <img
                                                    src={org.profilePicture ? `http://localhost:5000/uploads/${org.profilePicture}` : "/avatar.png"}
                                                    alt={orgDisplayName}
                                                    className="w-12 h-12 rounded-full mr-4 hover:opacity-90 transition-opacity"
                                                />
                                            </Link>
                                            <div>
                                                <Link to={`/profile/${org.username}`} className="hover:text-primary transition-colors">
                                                    <h3 className="font-semibold text-lg">{orgDisplayName}</h3>
                                                </Link>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-gray-600">{getOrgType(org.role)}</p>
                                                    {!affiliation.isActive && (
                                                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                                            Deactivated
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-gray-700">{org.headline}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Affiliations Section */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                        <h2 className="text-2xl font-bold mb-6">Affiliations</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {userAffiliations?.map(affiliation => (
                                <div key={affiliation._id} className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center mb-4">
                                        <Link to={`/profile/${affiliation.affiliator?.username}`}>
                                            <img
                                                src={affiliation.affiliator?.profilePicture ? `http://localhost:5000/uploads/${affiliation.affiliator.profilePicture}` : "/avatar.png"}
                                                alt={affiliation.affiliator?.name}
                                                className="w-12 h-12 rounded-full mr-4 hover:opacity-90 transition-opacity"
                                            />
                                        </Link>
                                        <div>
                                            <Link to={`/profile/${affiliation.affiliator?.username}`} className="hover:text-primary transition-colors">
                                                <h3 className="font-semibold text-lg">{affiliation.affiliator?.name}</h3>
                                            </Link>
                                            <div className="flex items-center gap-2">
                                                <p className="text-gray-600">{affiliation.role}</p>
                                                {!affiliation.isActive && (
                                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
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
                </>
            )}
        </div>
    );
}