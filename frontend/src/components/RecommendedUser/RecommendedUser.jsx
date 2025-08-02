import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios.js";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Check, Clock, UserCheck, UserPlus, X } from "lucide-react";

const RecommendedUser = ({ user }) => {
	const queryClient = useQueryClient();

	const { data: connectionStatus, isLoading } = useQuery({
		queryKey: ["connectionStatus", user._id],
		queryFn: () => axiosInstance.get(`/connections/status/${user._id}`),
	});

	const { mutate: sendConnectionRequest } = useMutation({
		mutationFn: (userId) => axiosInstance.post(`/connections/request/${userId}`),
		onSuccess: () => {
			toast.success("Connection request sent successfully");
			queryClient.invalidateQueries({ queryKey: ["connectionStatus", user._id] });
		},
		onError: (error) => {
			toast.error(error.response?.data?.error || "An error occurred");
		},
	});

	const { mutate: acceptRequest } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/connections/accept/${requestId}`),
		onSuccess: () => {
			toast.success("Connection request accepted");
			queryClient.invalidateQueries({ queryKey: ["connectionStatus", user._id] });
		},
		onError: (error) => {
			toast.error(error.response?.data?.error || "An error occurred");
		},
	});

	const { mutate: rejectRequest } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/connections/reject/${requestId}`),
		onSuccess: () => {
			toast.success("Connection request rejected");
			queryClient.invalidateQueries({ queryKey: ["connectionStatus", user._id] });
		},
		onError: (error) => {
			toast.error(error.response?.data?.error || "An error occurred");
		},
	});

	const renderButton = () => {
		if (isLoading) {
			return (
				<button className='px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-500' disabled>
					Loading...
				</button>
			);
		}

		switch (connectionStatus?.data?.status) {
			case "pending":
				return (
					<button
						className='px-3 py-1 rounded-full text-sm bg-yellow-500 text-white flex items-center'
						disabled
					>
						<Clock size={16} className='mr-1' />
						Pending
					</button>
				);
			case "received":
				return (
					<div className='flex gap-2 justify-center'>
						<button
							onClick={() => acceptRequest(connectionStatus.data.requestId)}
							className={`rounded-full p-1 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white`}
						>
							<Check size={16} />
						</button>
						<button
							onClick={() => rejectRequest(connectionStatus.data.requestId)}
							className={`rounded-full p-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white`}
						>
							<X size={16} />
						</button>
					</div>
				);
			case "connected":
				return (
					<button
						className='px-3 py-1 rounded-full text-sm bg-green-500 text-white flex items-center'
						disabled
					>
						<UserCheck size={16} className='mr-1' />
						Connected
					</button>
				);
			default:
				return (
					<button
						className='px-3 py-1 rounded-full text-sm border border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-200 flex items-center'
						onClick={handleConnect}
					>
						<UserPlus size={16} className='mr-1' />
						Connect
					</button>
				);
		}
	};

	const handleConnect = () => {
		if (connectionStatus?.data?.status === "not_connected") {
			sendConnectionRequest(user._id);
		}
	};

	return (
		<div className='flex items-center justify-between mb-4'>
			<Link to={`/profile/${user.username}`} className='flex items-center flex-grow'>
				<img
				src={user.profilePicture ? `http://localhost:5000/uploads/${user.profilePicture}` : "/avatar.png"}
				alt={user.name}
				className='w-12 h-12 rounded-full mr-3'
			/>
				<div>
					<h3 className='font-semibold text-sm'>{user.name}</h3>
					<div className="flex items-center gap-1 mb-1">
						<span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full capitalize">
							{user.role}
						</span>
					</div>
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
						
						// Get privacySettings from user
						const settings = parsePrivacySettings(user.privacySettings);
						return settings.isProfilePrivate;
					})() ? (
						<p className='text-xs text-info'>{user.location || 'Location not specified'}</p>
					) : (
						<p className='text-xs text-info'>{user.headline}</p>
					)}
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
						
						// Get privacySettings from user
						const settings = parsePrivacySettings(user.privacySettings);
						return settings.isProfilePrivate;
					})() && (
						<p className='text-xs text-gray-400 flex items-center'>
							<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
							</svg>
							Private Profile
						</p>
					)}
				</div>
			</Link>
			{renderButton()}
		</div>
	);
};
export default RecommendedUser;
