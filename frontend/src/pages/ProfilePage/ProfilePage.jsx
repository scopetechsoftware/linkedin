import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";
import ProfileHeader from "../../components/ProfileHeader/ProfileHeader";
import AboutSection from "../../components/AboutSection/AboutSection";
import ExperienceSection from "../../components/ExperienceSection/ExperienceSection";
import EducationSection from "../../components/EducationSection/EducationSection";
import SkillsSection from "../../components/SkillsSection/SkillsSection";
import ProjectsSection from "../../components/ProjectsSection/ProjectsSection";
import RatingsSection from "../../components/RatingsSection/RatingsSection";
import { Calendar, Users, GraduationCap, Building, XCircle, CheckCircle, Briefcase, MapPin, Clock, FileText } from "lucide-react";
import { format } from "date-fns";

const ProfilePage = () => {
	const { username } = useParams();
	const queryClient = useQueryClient();

	const { data: authUser, isLoading } = useQuery({
		queryKey: ["authUser"],
	});

	const { data: userProfile, isLoading: isUserProfileLoading } = useQuery({
		queryKey: ["userProfile", username],
		queryFn: () => axiosInstance.get(`/users/profile/${username}`),
	});

	// Fetch affiliations for this user
	const { data: userAffiliations, isLoading: isAffiliationsLoading } = useQuery({
		queryKey: ["affiliations", username],
		queryFn: () => axiosInstance.get(`/affiliations/user/${username}`),
	});

	// Fetch affiliators for this user (organizations that the user is affiliated with)
	const { data: userAffiliators, isLoading: isAffiliatorsLoading } = useQuery({
		queryKey: ["affiliators", username],
		queryFn: () => axiosInstance.get(`/affiliations/affiliators/${username}`),
	});

	// Fetch users affiliated with this profile (for organizations/companies)
	const { data: affiliatedUsers, isLoading: isAffiliatedUsersLoading } = useQuery({
		queryKey: ["affiliatedUsers", username],
		queryFn: () => axiosInstance.get(`/affiliations/affiliated/${username}`),
	});

	// Fetch jobs by this user
	const { data: userJobs, isLoading: isJobsLoading } = useQuery({
		queryKey: ["userJobs", username],
		queryFn: () => axiosInstance.get(`/jobs/user/${username}`),
	});

	// Fetch posts by this user
	const { data: userPosts, isLoading: isPostsLoading } = useQuery({
		queryKey: ["userPosts", username],
		queryFn: () => axiosInstance.get(`/posts/user/${username}`),
	});

	const { mutate: updateProfile } = useMutation({
		mutationFn: async (updatedData) => {
			// Create FormData for file uploads
			const formData = new FormData();
			
			// Add all fields to FormData
			Object.keys(updatedData).forEach(key => {
				// Check if the value is a base64 string for profile picture or banner image
				if ((key === 'profilePicture' || key === 'bannerImg') && updatedData[key] && 
					typeof updatedData[key] === 'string' && updatedData[key].startsWith('data:')) {
					// Skip base64 strings - they'll be handled by the file input directly
				} else {
					formData.append(key, updatedData[key]);
				}
			});
			
			await axiosInstance.put("/users/profile", formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			});
		},
		onSuccess: () => {
			toast.success("Profile updated successfully");
			queryClient.invalidateQueries(["userProfile", username]);
		},
	});

	if (isLoading || isUserProfileLoading) return null;

	const isOwnProfile = authUser.username === userProfile.data.username;
	const userData = isOwnProfile ? authUser : userProfile.data;
	
	// Check if this is a limited profile (private profile)
	const isLimitedProfile = userData && Object.keys(userData).length <= 6 && userData.privacySettings?.isProfilePrivate;
	


	const handleSave = (updatedData) => {
		updateProfile(updatedData);
	};

	const formatDate = (dateString) => {
		if (!dateString) return "Present";
		return format(new Date(dateString), "MMM yyyy");
	};

	const getRoleIcon = (role) => {
		switch (role) {
			case "student":
			case "professor":
				return <GraduationCap className="mr-2" size={18} />;
			case "employee":
			case "employer":
				return <Building className="mr-2" size={18} />;
			default:
				return <Users className="mr-2" size={18} />;
		}
	};

	return (
		<div className='max-w-4xl mx-auto p-2 lg:p-4'>
			<ProfileHeader userData={userData} isOwnProfile={false} />
			
			{/* Check if profile is private and not own profile */}
			{isLimitedProfile && !isOwnProfile ? (
				<div className="bg-white rounded-lg shadow-lg p-6 text-center my-4">
					<div className="text-gray-600 mb-4">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
						<h2 className="text-2xl font-bold mb-2">This Profile is Private</h2>
						<p className="text-lg">The user has chosen to keep their profile private.</p>
						<p className="mt-2">Only basic profile information is visible.</p>
					</div>
				</div>
			) : (
				<>
					{/* Only show About section if not limited profile */}
					{!isLimitedProfile && <AboutSection userData={userData} isOwnProfile={false} />}

					{/* Posts Section - Only show if not limited profile */}
					{!isLimitedProfile && (
						isPostsLoading ? (
							<div className="bg-white rounded-lg shadow p-6 text-center my-4">Loading posts...</div>
						) : userPosts?.data?.length > 0 ? (
						<div className="bg-white rounded-lg shadow p-6 my-4">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-xl font-bold flex items-center">
									<FileText className="mr-2" size={20} />
									Posts
								</h2>
								<Link 
									to={`/`}
									className="text-blue-600 hover:text-blue-800 text-sm font-medium"
								>
									View All ({userPosts.data.length})
								</Link>
							</div>
							<div className="space-y-4">
								{userPosts.data.slice(0, 3).map((post) => (
									<Link 
										key={post._id} 
										to={`/`}
										className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<h3 className="font-semibold text-lg mb-2">{post.title || "Post"}</h3>
												<p className="text-gray-700 line-clamp-3">{post.content}</p>
												<div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
													<span className="flex items-center">
														<Calendar size={14} className="mr-1" />
														{format(new Date(post.createdAt), "MMM dd, yyyy")}
													</span>
													{post.likes && (
														<span className="flex items-center">
															<Users size={14} className="mr-1" />
															{post.likes.length} likes
														</span>
													)}
													{post.comments && (
														<span className="flex items-center">
															<FileText size={14} className="mr-1" />
															{post.comments.length} comments
														</span>
													)}
												</div>
											</div>
										</div>
									</Link>
								))}
							</div>
						</div>
					) : null
					)}

					{/* Jobs Section - Only show if not limited profile */}
					{!isLimitedProfile && (
						isJobsLoading ? (
							<div className="bg-white rounded-lg shadow p-6 text-center my-4">Loading jobs...</div>
						) : userJobs?.data?.length > 0 ? (
						<div className="bg-white rounded-lg shadow p-6 my-4">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-xl font-bold flex items-center">
									<Briefcase className="mr-2" size={20} />
									Job Postings
								</h2>
								<Link 
									to={`/jobs/user/${username}`}
									className="text-blue-600 hover:text-blue-800 text-sm font-medium"
								>
									View All ({userJobs.data.length})
								</Link>
							</div>
							<div className="space-y-4">
								{userJobs.data.slice(0, 3).map((job) => (
									<Link 
										key={job._id} 
										to={`/jobs/${job._id}`}
										className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<h3 className="font-semibold text-lg mb-2">{job.title}</h3>
												<div className="flex items-center text-sm text-gray-600 mb-2">
													<Briefcase className="mr-1" size={14} />
													<span className="text-blue-600 font-medium">{userData.name}</span>
												</div>
												<div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
													<span className="flex items-center">
														<MapPin size={14} className="mr-1" />
														{job.location}
													</span>
													<span className="flex items-center">
														<Clock size={14} className="mr-1" />
														{job.type}
													</span>
													<span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
														${job.package}
													</span>
												</div>
												<p className="text-gray-700 line-clamp-2">{job.description}</p>
												<div className="flex flex-wrap gap-2 mt-2">
													{job.skill?.split(',').map((skill, index) => (
														<span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
															{skill.trim()}
														</span>
													))}
												</div>
											</div>
										</div>
									</Link>
								))}
							</div>
						</div>
					) : null
					)}

					{/* Affiliators Section (Organizations that the user is affiliated with) - Only show if not limited profile */}
					{!isLimitedProfile && (
						isAffiliationsLoading ? (
							<div className="bg-white rounded-lg shadow p-6 text-center my-4">Loading affiliators...</div>
						) : userAffiliations?.data?.length > 0 ? (
						<div className="bg-white rounded-lg shadow p-6 my-4">
							<div className="flex items-center mb-4">
								<h2 className="text-xl font-bold flex items-center">
									<Building className="mr-2" size={20} />
									Organizations & Companies
								</h2>
							</div>
							<div className="space-y-4">
								{userAffiliations.data.slice(0, 3).map((affiliation) => {
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
										<Link 
										key={affiliation._id} 
										to={`/`}
										className={`block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors ${!affiliation.isActive ? 'opacity-70' : ''}`}
									>
											<div className="flex items-start justify-between">
												<div className="flex items-center">
													<img
														src={org.profilePicture || "/avatar.png"}
														alt={orgDisplayName}
														className="w-12 h-12 rounded-full mr-4"
													/>
													<div>
														<div className="flex items-center gap-2">
															<h3 className="font-semibold text-lg">{orgDisplayName}</h3>
															<span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
																{getOrgType(org.role)}
															</span>
														</div>
														<p className="text-gray-600 text-sm">{org.headline || org.email}</p>
														<div className="flex items-center mt-1 text-sm text-gray-700">
															{getRoleIcon(affiliation.role)}
															<span className="capitalize">{userData.name} role: {affiliation.role}</span>
														</div>
														<div className="flex items-center mt-1 text-sm text-gray-700">
															<Calendar className="mr-2" size={16} />
															<span>
																{formatDate(affiliation.startDate)} - {formatDate(affiliation.endDate)}
															</span>
														</div>
														{!affiliation.isActive && (
															<div className="flex items-center mt-1 text-sm text-red-500">
																<XCircle className="mr-2" size={16} />
																<span>Deactivated</span>
															</div>
														)}
													</div>
												</div>
												<div className="flex-shrink-0">
													{affiliation.isActive ? (
														<div className="text-green-500 flex items-center">
															<CheckCircle size={16} className="mr-1" />
															<span className="text-xs">Active</span>
														</div>
													) : (
														<div className="text-red-500 flex items-center">
															<XCircle size={16} className="mr-1" />
															<span className="text-xs">Inactive</span>
														</div>
													)}
												</div>
											</div>
										</Link>
									);
								})}
							</div>
						</div>
					) : null
					)}

					{/* Affiliations Section (Users who are affiliated with this profile) - Only show if not limited profile */}
					{!isLimitedProfile && (
						isAffiliatedUsersLoading ? (
							<div className="bg-white rounded-lg shadow p-6 text-center my-4">Loading affiliations...</div>
						) : affiliatedUsers?.data?.length > 0 ? (
						<div className="bg-white rounded-lg shadow p-6 my-4">
							<div className="flex items-center mb-4">
								<h2 className="text-xl font-bold flex items-center">
									<Users className="mr-2" size={20} />
									Affiliated Users
								</h2>
							</div>
							<div className="space-y-4">
								{affiliatedUsers.data.slice(0, 3).map((affiliation) => {
									const user = affiliation.affiliated;
									
									return (
										<Link 
										key={affiliation._id} 
										to={`/`}
										className={`block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors ${!affiliation.isActive ? 'opacity-70' : ''}`}
									>
											<div className="flex items-start justify-between">
												<div className="flex items-center">
													<img
														src={user.profilePicture || "/avatar.png"}
														alt={user.name}
														className="w-12 h-12 rounded-full mr-4"
													/>
													<div>
														<div className="flex items-center gap-2">
															<h3 className="font-semibold text-lg">{user.name}</h3>
															<span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
																{affiliation.role}
															</span>
														</div>
														<p className="text-gray-600 text-sm">{user.headline || user.email}</p>
														<div className="flex items-center mt-1 text-sm text-gray-700">
															{getRoleIcon(affiliation.role)}
															<span className="capitalize">Role: {affiliation.role}</span>
														</div>
														<div className="flex items-center mt-1 text-sm text-gray-700">
															<Calendar className="mr-2" size={16} />
															<span>
																{formatDate(affiliation.startDate)} - {formatDate(affiliation.endDate)}
															</span>
														</div>
														{!affiliation.isActive && (
															<div className="flex items-center mt-1 text-sm text-red-500">
																<XCircle className="mr-2" size={16} />
																<span>Deactivated</span>
															</div>
														)}
													</div>
												</div>
												<div className="flex-shrink-0">
													{affiliation.isActive ? (
														<div className="text-green-500 flex items-center">
															<CheckCircle size={16} className="mr-1" />
															<span className="text-xs">Active</span>
														</div>
													) : (
														<div className="text-red-500 flex items-center">
															<XCircle size={16} className="mr-1" />
															<span className="text-xs">Inactive</span>
														</div>
													)}
												</div>
											</div>
										</Link>
									);
								})}
							</div>
						</div>
					) : null
					)}

					{/* Only show detailed sections if not limited profile */}
					{!isLimitedProfile && (
						<>
							<ExperienceSection userData={userData} isOwnProfile={false} />
							<EducationSection userData={userData} isOwnProfile={false} />
							<SkillsSection userData={userData} isOwnProfile={false} />
							<ProjectsSection userData={userData} isOwnProfile={false} />
							<RatingsSection userData={userData} />
						</>
					)}
				</>
			)}
		</div>
	);
};

export default ProfilePage;
