import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import Sidebar from "../../components/Sidebar/Sidebar.jsx";
import MobileSidebar from "../../components/MobileSidebar/MobileSidebar";
import { ExternalLink, Eye, MessageSquare, ThumbsUp, Trash2, UserPlus, Share2, Star, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

const NotificationsPage = () => {
    const { data: authUser } = useQuery({ queryKey: ["authUser"] });
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    // State for project ratings
    const [projectRatings, setProjectRatings] = useState({});
    // State to track which projects the user has already rated
    const [userRatedProjects, setUserRatedProjects] = useState({});

    const { data: notifications, isLoading } = useQuery({
		queryKey: ["notifications"],
		queryFn: () => axiosInstance.get("/notifications"),
	});
	
	// Fetch projects that the current user has already rated
	useEffect(() => {
		if (!user) return;
		
		const fetchUserRatings = async () => {
			try {
				// Get all projects from notifications
				const projectIds = notifications?.data
					?.filter(n => n.type === "projectShared" && n.relatedProject)
					?.map(n => n.relatedProject._id) || [];
				
				// Remove duplicates
				const uniqueProjectIds = [...new Set(projectIds)];
				
				if (uniqueProjectIds.length === 0) return;
				
				// For each project, check if the user has already rated it
				const ratedProjectsMap = {};
				
				await Promise.all(uniqueProjectIds.map(async (projectId) => {
					try {
						const response = await axiosInstance.get(`/projects/${projectId}/ratings`);
						const hasUserRated = response.data.some(rating => 
							rating.sender._id === user._id
						);
						
						ratedProjectsMap[projectId] = hasUserRated;
					} catch (error) {
						console.error(`Error checking rating for project ${projectId}:`, error);
					}
				}));
				
				setUserRatedProjects(ratedProjectsMap);
			} catch (error) {
				console.error("Error fetching user ratings:", error);
			}
		};
		
		if (notifications?.data) {
			fetchUserRatings();
		}
	}, [notifications, user]);

    const { mutate: markAsReadMutation } = useMutation({
		mutationFn: (id) => axiosInstance.put(`/notifications/${id}/read`),
		onSuccess: () => {
			queryClient.invalidateQueries(["notifications"]);
		},
	});

    const { mutate: deleteNotificationMutation } = useMutation({
		mutationFn: (id) => axiosInstance.delete(`/notifications/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries(["notifications"]);
			toast.success("Notification deleted");
		},
	});
	
	// Rate project mutation
	const { mutate: rateProjectMutation } = useMutation({
		mutationFn: ({ projectId, rating, comment }) => {
			return axiosInstance.post(`/projects/${projectId}/rate`, {
				rating,
				comment
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries(["notifications"]);
			toast.success("Project rated successfully");
		},
		onError: (error) => {
			toast.error("Failed to rate project");
		},
	});
	
	// Handle rating a project
	const handleRateProject = (projectId, rating) => {
		setProjectRatings(prev => ({
			...prev,
			[projectId]: {
				...prev[projectId],
				rating
			}
		}));
	};
	
	// Handle comment change
	const handleCommentChange = (projectId, comment) => {
		setProjectRatings(prev => ({
			...prev,
			[projectId]: {
				...prev[projectId],
				comment
			}
		}));
	};
	
	// Submit rating and comment
	const handleSubmitRating = (projectId) => {
		const projectRating = projectRatings[projectId];
		if (!projectRating || !projectRating.rating) {
			toast.error("Please select a rating");
			return;
		}
		
		rateProjectMutation({
			projectId,
			rating: projectRating.rating,
			comment: projectRating.comment || ""
		});
		// Clear local state after submit
		setProjectRatings(prev => {
			const newRatings = { ...prev };
			delete newRatings[projectId];
			return newRatings;
		});
		
		// Mark this project as rated by the user
		setUserRatedProjects(prev => ({
			...prev,
			[projectId]: true
		}));
	};

    // render the notifications icon
    const renderNotificationIcon = (type) => {
		switch (type) {
			case "like":
				return <ThumbsUp className='text-blue-500' />;

			case "comment":
				return <MessageSquare className='text-green-500' />;
			case "connectionAccepted":
				return <UserPlus className='text-purple-500' />;
			case "projectShared":
				return <Share2 className='text-blue-500' />;
			case "projectRated":
				return <Star className='text-yellow-500' />;
			case "profileVisit":
				return <Eye className='text-indigo-500' />;
			default:
				return null;
		}
	};

    // render the notification content
    const renderNotificationContent = (notification) => {
		switch (notification.type) {
			case "like":
				return (
					<div className='flex flex-col'>
						<p>
							<Link
								to={`/profile/${notification.relatedUser.username}`}
								className='font-semibold hover:underline'
							>
								{notification.relatedUser.name}
							</Link>{" "}
							liked your post
						</p>
						<Link
							to={`/post/${notification.relatedPost._id}`}
							className='text-sm text-gray-500 hover:underline flex items-center gap-1'
						>
							<ExternalLink className='h-3 w-3' /> View post
						</Link>
					</div>
				);
			case "comment":
				return (
					<div className='flex flex-col'>
						<p>
							<Link
								to={`/profile/${notification.relatedUser.username}`}
								className='font-semibold hover:underline'
							>
								{notification.relatedUser.name}
							</Link>{" "}
							commented on your post
						</p>
						<Link
							to={`/post/${notification.relatedPost._id}`}
							className='text-sm text-gray-500 hover:underline flex items-center gap-1'
						>
							<ExternalLink className='h-3 w-3' /> View post
						</Link>
					</div>
				);
			case "connectionAccepted":
				return (
					<div className='flex flex-col'>
						<p>
							<Link
								to={`/profile/${notification.relatedUser.username}`}
								className='font-semibold hover:underline'
							>
								{notification.relatedUser.name}
							</Link>{" "}
							accepted your connection request
						</p>
						<Link
							to={`/profile/${notification.relatedUser.username}`}
							className='text-sm text-gray-500 hover:underline flex items-center gap-1'
						>
							<ExternalLink className='h-3 w-3' /> View profile
						</Link>
					</div>
				);
			case "profileVisit":
				return (
					<div className='flex flex-col'>
						<p>
							<Link
								to={`/profile/${notification.relatedUser.username}`}
								className='font-semibold hover:underline'
							>
								{notification.relatedUser.name}
							</Link>{" "}
							visited your profile
						</p>
						<Link
							to={`/profile/${notification.relatedUser.username}`}
							className='text-sm text-gray-500 hover:underline flex items-center gap-1'
						>
							<ExternalLink className='h-3 w-3' /> View their profile
						</Link>
					</div>
				);
			case "projectShared":
				return (
					<div className='flex flex-col'>
						<p>
							<Link
								to={`/profile/${notification.relatedUser.username}`}
								className='font-semibold hover:underline'
							>
								{notification.relatedUser.name}
							</Link>{" "}
							shared a project with you
						</p>
						{notification.relatedProject && (
							<div className="mt-2 p-3 bg-gray-50 rounded-md">
								<h3 className="font-medium">{notification.relatedProject.name}</h3>
								<p className="text-sm text-gray-600 mt-1">{notification.relatedProject.description}</p>
								
								{/* Rating Component - Only show if user hasn't rated this project yet */}
								{!userRatedProjects[notification.relatedProject._id] ? (
									<div className="mt-3">
										<p className="text-sm font-medium mb-1">Rate this project:</p>
										<div className="flex items-center gap-1">
											{[1, 2, 3, 4, 5].map((star) => (
												<button
													key={star}
													className={`text-xl ${star <= (projectRatings[notification.relatedProject._id]?.rating || 0) ? 'text-yellow-500' : 'text-gray-300'}`}
													onClick={() => handleRateProject(notification.relatedProject._id, star)}
												>
													★
												</button>
											))}
										</div>
										
										{/* Comment Box */}
										<div className="mt-2">
											<textarea
												className="w-full p-2 border rounded-md text-sm"
												rows="2"
												placeholder="Add a comment..."
												value={projectRatings[notification.relatedProject._id]?.comment || ""}
												onChange={(e) => handleCommentChange(notification.relatedProject._id, e.target.value)}
											></textarea>
											<button
												className="mt-1 px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary-dark"
												onClick={() => handleSubmitRating(notification.relatedProject._id)}
											>
												Submit
											</button>
										</div>
									</div>
								) : (
									<div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
										<p className="text-sm text-green-700 flex items-center">
											<Star className="h-4 w-4 mr-1 text-green-500" />
											You've already rated this project
										</p>
									</div>
								)}
								
								<div className="mt-3 flex gap-2">
									{notification.relatedProject.gitlink && (
										<a 
											href={notification.relatedProject.gitlink} 
											target="_blank" 
											rel="noopener noreferrer"
											className="text-xs bg-gray-200 px-2 py-1 rounded flex items-center gap-1"
										>
											<ExternalLink className="h-3 w-3" /> GitHub
										</a>
									)}
									{notification.relatedProject.projecturl && (
										<a 
											href={notification.relatedProject.projecturl} 
											target="_blank" 
											rel="noopener noreferrer"
											className="text-xs bg-gray-200 px-2 py-1 rounded flex items-center gap-1"
										>
											<ExternalLink className="h-3 w-3" /> Live Demo
										</a>
									)}
								</div>
							</div>
						)}
					</div>
				);
			case "projectRated":
				return (
					<div className='flex flex-col'>
						<p>
							<Link
								to={`/profile/${notification.relatedUser.username}`}
								className='font-semibold hover:underline'
							>
								{notification.relatedUser.name}
							</Link>{" "}
							rated your project {notification.rating} stars
						</p>
						{notification.comment && (
							<p className="text-sm text-gray-600 mt-1 italic">"{notification.comment}"</p>
						)}
						<Link
							to={`/projects/${notification.relatedProject?._id}`}
							className='text-sm text-gray-500 hover:underline flex items-center gap-1 mt-1'
						>
							<ExternalLink className='h-3 w-3' /> View project
						</Link>
					</div>
				);
			default:
				return null;
		}
	};

    // render related post
    const renderRelatedPost = (relatedPost) => {
		if (!relatedPost) return null;

		return (
			<Link
				to={`/post/${relatedPost._id}`}
				className='mt-2 p-2 bg-gray-50 rounded-md flex items-center space-x-2 hover:bg-gray-100 transition-colors'
			>
				{relatedPost.image && (
					<img src={relatedPost.image} alt='Post preview' className='w-10 h-10 object-cover rounded' />
				)}
				<div className='flex-1 overflow-hidden'>
					<p className='text-sm text-gray-600 truncate'>{relatedPost.content}</p>
				</div>
				<ExternalLink size={14} className='text-gray-400' />
			</Link>
		);
	};

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Mobile Sidebar Toggle Button */}
            <div className="md:hidden mb-4">
                <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="bg-white shadow-md rounded-lg p-3 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <Menu size={24} />
                </button>
            </div>
            
            <div className='hidden md:block lg:col-span-1'>
				<Sidebar user={authUser} />
			</div>

            <div className='col-span-1 lg:col-span-3'>
				<div className='bg-white rounded-lg shadow p-4 lg:p-6'>
					<h1 className='text-xl lg:text-2xl font-bold mb-4 lg:mb-6'>Notifications</h1>

					{isLoading ? (
						<p>Loading notifications...</p>
					) : notifications && notifications.data.length > 0 ? (
						<ul>
							{notifications.data.map((notification) => (
								<li
									key={notification._id}
									className={`border rounded-lg p-3 lg:p-4 my-3 lg:my-4 transition-all hover:shadow-md ${
										!notification.read ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
									}`}
								>
									<div className='flex items-start justify-between'>
										<div className='flex items-center space-x-2 lg:space-x-4'>
											<Link to={`/profile/${notification.relatedUser.username}`}>
												<img
													src={`http://localhost:5000/uploads/${notification.relatedUser.profilePicture}`|| "/avatar.png"}
													alt={notification.relatedUser.name}
													className='w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover'
												/>
											</Link>

											<div>
												<div className='flex items-center gap-2'>
													<div className='p-1 bg-gray-100 rounded-full'>
														{renderNotificationIcon(notification.type)}
													</div>
													<p className='text-sm'>{renderNotificationContent(notification)}</p>
												</div>
												<p className='text-xs text-gray-500 mt-1'>
													{notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), {
														addSuffix: true,
													}) : 'Recently'}
												</p>
												{renderRelatedPost(notification.relatedPost)}
											</div>
										</div>

										<div className='flex gap-2'>
											{!notification.read && (
												<button
													onClick={() => markAsReadMutation(notification._id)}
													className='p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors'
													aria-label='Mark as read'
												>
													<Eye size={16} />
												</button>
											)}

											<button
												onClick={() => deleteNotificationMutation(notification._id)}
												className='p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors'
												aria-label='Delete notification'
											>
												<Trash2 size={16} />
											</button>
										</div>
									</div>
								</li>
							))}
						</ul>
					) : (
						<p>No notification at the moment.</p>
					)}
				</div>
			</div>
			
			{/* Mobile Sidebar */}
			<MobileSidebar 
				user={authUser} 
				isOpen={isMobileSidebarOpen} 
				onClose={() => setIsMobileSidebarOpen(false)} 
			/>
        </div>
    )
}

export default NotificationsPage