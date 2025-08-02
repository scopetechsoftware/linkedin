import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { Camera, Clock, MapPin, UserCheck, UserPlus, X, GraduationCap, Building, User } from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import ChatButton from "../Chat/ChatButton";
import ChatWindow from "../Chat/ChatWindow";

const ProfileHeader = ({ userData, onSave, isOwnProfile }) => {
	// State for chat window
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [selectedChat, setSelectedChat] = useState(null);
	const [isEditing, setIsEditing] = useState(false);
	const [editedData, setEditedData] = useState({});
	const queryClient = useQueryClient();

	const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	const { data: connectionStatus, refetch: refetchConnectionStatus } = useQuery({
		queryKey: ["connectionStatus", userData._id],
		queryFn: () => axiosInstance.get(`/connections/status/${userData._id}`),
		enabled: !isOwnProfile && userData.connections !== undefined,
	});

	const isConnected = userData.connections?.some((connection) => connection === authUser._id) || false;

	const { mutate: sendConnectionRequest } = useMutation({
		mutationFn: (userId) => axiosInstance.post(`/connections/request/${userId}`),
		onSuccess: () => {
			toast.success("Connection request sent");
			refetchConnectionStatus();
			queryClient.invalidateQueries(["connectionRequests"]);
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || "An error occurred");
		},
	});

	const { mutate: acceptRequest } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/connections/accept/${requestId}`),
		onSuccess: () => {
			toast.success("Connection request accepted");
			refetchConnectionStatus();
			queryClient.invalidateQueries(["connectionRequests"]);
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || "An error occurred");
		},
	});

	const { mutate: rejectRequest } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/connections/reject/${requestId}`),
		onSuccess: () => {
			toast.success("Connection request rejected");
			refetchConnectionStatus();
			queryClient.invalidateQueries(["connectionRequests"]);
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || "An error occurred");
		},
	});

	const { mutate: removeConnection } = useMutation({
		mutationFn: (userId) => axiosInstance.delete(`/connections/${userId}`),
		onSuccess: () => {
			toast.success("Connection removed");
			refetchConnectionStatus();
			queryClient.invalidateQueries(["connectionRequests"]);
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || "An error occurred");
		},
	});

	const getConnectionStatus = useMemo(() => {
		if (isConnected) return "connected";
		if (!isConnected) return "not_connected";
		return connectionStatus?.data?.status;
	}, [isConnected, connectionStatus]);

	const renderConnectionButton = () => {
		// Don't show connection buttons for private profiles (no connection data)
		if (userData.connections === undefined) {
			return null;
		}
		
		const baseClass = "text-white py-2 px-4 rounded-full transition duration-300 flex items-center justify-center";
		switch (getConnectionStatus) {
			case "connected":
				return (
					<div className='flex gap-2 justify-center'>
						<div className={`${baseClass} bg-green-500 hover:bg-green-600`}>
							<UserCheck size={20} className='mr-2' />
							Connected
						</div>
						<ChatButton 
							userId={userData._id} 
							isConnected={true} 
							onChatStart={(chat) => {
								setSelectedChat(chat);
								setIsChatOpen(true);
							}} 
						/>
						<button
							className={`${baseClass} bg-red-500 hover:bg-red-600 text-sm`}
							onClick={() => removeConnection(userData._id)}
						>
							<X size={20} className='mr-2' />
							Remove Connection
						</button>
					</div>
				);

			case "pending":
				return (
					<button className={`${baseClass} bg-yellow-500 hover:bg-yellow-600`}>
						<Clock size={20} className='mr-2' />
						Pending
					</button>
				);

			case "received":
				return (
					<div className='flex gap-2 justify-center'>
						<button
							onClick={() => acceptRequest(connectionStatus.data.requestId)}
							className={`${baseClass} bg-green-500 hover:bg-green-600`}
						>
							Accept
						</button>
						<button
							onClick={() => rejectRequest(connectionStatus.data.requestId)}
							className={`${baseClass} bg-red-500 hover:bg-red-600`}
						>
							Reject
						</button>
					</div>
				);
			default:
				return (
					<button
						onClick={() => sendConnectionRequest(userData._id)}
						className='bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-full transition duration-300 flex items-center justify-center'
					>
						<UserPlus size={20} className='mr-2' />
						Connect
					</button>
				);
		}
	};

	const handleImageChange = (event) => {
		const file = event.target.files[0];
		if (file) {
			// Store the file object directly for FormData
			setEditedData((prev) => ({ ...prev, [event.target.name]: file }));
			
			// Also create a preview for UI display
			const reader = new FileReader();
			reader.onloadend = () => {
				// Store the preview separately for display purposes only
				if (event.target.name === 'profilePicture') {
					setEditedData((prev) => ({ ...prev, profilePicturePreview: reader.result }));
				} else if (event.target.name === 'bannerImg') {
					setEditedData((prev) => ({ ...prev, bannerImgPreview: reader.result }));
				}
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSave = () => {
		onSave(editedData);
		setIsEditing(false);
	};

	return (
		<>
			<div className='bg-white shadow rounded-lg mb-6'>
				<div
					className='relative h-48 rounded-t-lg bg-cover bg-center'
					style={{
						backgroundImage: `url('${editedData.bannerImgPreview || (userData.bannerImg ? `http://localhost:5000/uploads/${userData.bannerImg}` : "/banner.png")}')`,
					}}
				>
				{isEditing && (
					<label className='absolute top-2 right-2 bg-white p-2 rounded-full shadow cursor-pointer'>
						<Camera size={20} />
						<input
							type='file'
							className='hidden'
							name='bannerImg'
							onChange={handleImageChange}
							accept='image/*'
						/>
					</label>
				)}
			</div>

			<div className='p-4'>
				<div className='relative -mt-20 mb-4'>
					<img
						className='w-32 h-32 rounded-full mx-auto object-cover'
						src={editedData.profilePicturePreview || (userData.profilePicture ? `http://localhost:5000/uploads/${userData.profilePicture}` : "/avatar.png")}
						alt={userData.name}
					/>

					{isEditing && (
						<label className='absolute bottom-0 right-1/2 transform translate-x-16 bg-white p-2 rounded-full shadow cursor-pointer'>
							<Camera size={20} />
							<input
								type='file'
								className='hidden'
								name='profilePicture'
								onChange={handleImageChange}
								accept='image/*'
							/>
						</label>
					)}
				</div>

				<div className='text-center mb-4'>
					{isEditing ? (
						<input
							type='text'
							value={editedData.name ?? userData.name}
							onChange={(e) => {
								// Allow editing but prevent completely empty values
								if (e.target.value === '') {
									// Reset to original value instead of blocking the update
									setEditedData({ ...editedData, name: userData.name });
									return;
								}
								setEditedData({ ...editedData, name: e.target.value })
							}}
							className='text-2xl font-bold mb-2 text-center w-full'
						/>
					) : (
						<div className="flex items-center justify-center gap-2 mb-2">
							<h1 className='text-2xl font-bold'>{userData.name}</h1>
							{userData.privacySettings?.isProfilePrivate && !isOwnProfile && (
								<span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center">
									<svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
									</svg>
									Private
								</span>
							)}
						</div>
					)}

					{/* Role Display */}
					<div className='flex justify-center items-center mb-2'>
						{(() => {
							const getRoleIcon = (role) => {
								switch (role) {
									case "student":
									case "professor":
										return <GraduationCap size={16} className="mr-1" />;
									case "employee":
									case "employer":
										return <Building size={16} className="mr-1" />;
									case "company":
										return <Building size={16} className="mr-1" />;
									case "university":
										return <GraduationCap size={16} className="mr-1" />;
									default:
										return <User size={16} className="mr-1" />;
								}
							};

							const getRoleDisplayName = (role) => {
								switch (role) {
									case "student":
										return "Student";
									case "professor":
										return "Professor";
									case "employee":
										return "Employee";
									case "employer":
										return "Employer";
									case "company":
										return "Company";
									case "university":
										return "University";
									default:
										return role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";
								}
							};

							const getRoleColor = (role) => {
								switch (role) {
									case "student":
									case "professor":
										return "bg-blue-100 text-blue-800";
									case "employee":
									case "employer":
										return "bg-green-100 text-green-800";
									case "company":
										return "bg-purple-100 text-purple-800";
									case "university":
										return "bg-indigo-100 text-indigo-800";
									default:
										return "bg-gray-100 text-gray-800";
								}
							};

							return userData.role ? (
								<span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(userData.role)}`}>
									{getRoleIcon(userData.role)}
									{getRoleDisplayName(userData.role)}
								</span>
							) : null;
						})()}
					</div>

					{isEditing ? (
						<input
							type='text'
							value={editedData.headline ?? userData.headline ?? ''}
							onChange={(e) => {
								// Allow editing but prevent completely empty values
								if (e.target.value === '') {
									// Reset to original value instead of blocking the update
									setEditedData({ ...editedData, headline: userData.headline || '' });
									return;
								}
								setEditedData({ ...editedData, headline: e.target.value })
							}}
							className='text-gray-600 text-center w-full'
						/>
					) : (
													<p className='text-gray-600'>{userData.headline || 'No headline'}</p>
					)}

					<div className='flex justify-center items-center mt-2'>
						<MapPin size={16} className='text-gray-500 mr-1' />
						{isEditing ? (
							<input
								type='text'
								value={editedData.location ?? userData.location}
								onChange={(e) => {
									// Allow editing but prevent completely empty values
									if (e.target.value === '') {
										// Reset to original value instead of blocking the update
										setEditedData({ ...editedData, location: userData.location });
										return;
									}
									setEditedData({ ...editedData, location: e.target.value })
								}}
								className='text-gray-600 text-center'
							/>
						) : (
							<span className='text-gray-600'>{userData.location}</span>
						)}
					</div>
				</div>

				{isOwnProfile ? (
					isEditing ? (
						<button
							className='w-full bg-primary text-white py-2 px-4 rounded-full hover:bg-primary-dark
							 transition duration-300'
							onClick={handleSave}
						>
							Save Profile
						</button>
					) : (
						<button
							onClick={() => setIsEditing(true)}
							className='w-full bg-primary text-white py-2 px-4 rounded-full hover:bg-primary-dark
							 transition duration-300'
						>
							Edit Profile
						</button>
					)
				) : (
					<div className='flex justify-center'>{renderConnectionButton()}</div>
				)}
				</div>
			</div>
			{/* Chat Window */}
			{!isOwnProfile && (
				<ChatWindow 
					isOpen={isChatOpen} 
					onClose={() => setIsChatOpen(false)} 
					selectedChat={selectedChat} 
					setSelectedChat={setSelectedChat} 
				/>
			)}
		</>
	);
};
export default ProfileHeader;
