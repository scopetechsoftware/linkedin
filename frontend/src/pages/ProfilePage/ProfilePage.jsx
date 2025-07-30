import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";


import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";
import ProfileHeader from "../../components/ProfileHeader/ProfileHeader";
import AboutSection from "../../components/AboutSection/AboutSection";
import ExperienceSection from "../../components/ExperienceSection/ExperienceSection";
import EducationSection from "../../components/EducationSection/EducationSection";
import SkillsSection from "../../components/SkillsSection/SkillsSection";
import { Calendar, Users, GraduationCap, Building } from "lucide-react";
import { format } from "date-fns";

const ProfilePage = () => {
	const { username } = useParams();
	const queryClient = useQueryClient();

	const { data: authUser, isLoading } = useQuery({
		queryKey: ["authUser"],
	});

	const { data: userProfile, isLoading: isUserProfileLoading } = useQuery({
		queryKey: ["userProfile", username],
		queryFn: () => axiosInstance.get(`/users/${username}`),
	});

	// Fetch affiliations for this user
	const { data: userAffiliations, isLoading: isAffiliationsLoading } = useQuery({
		queryKey: ["affiliations", username],
		queryFn: () => axiosInstance.get(`/affiliations/user/${username}`),
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

	const handleSave = (updatedData) => {
		updateProfile(updatedData);
	};

	return (
		<div className='max-w-4xl mx-auto p-4'>
			<ProfileHeader userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
			
			{/* Check if profile is private and not own profile */}
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
				return settings.isProfilePrivate && !isOwnProfile;
			})() ? (
				<div className="bg-white rounded-lg shadow-lg p-6 text-center my-4">
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
					<AboutSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />

					{/* Affiliations Section */}
					{isAffiliationsLoading ? (
						<div className="bg-white rounded-lg shadow p-6 text-center my-4">Loading affiliations...</div>
					) : userAffiliations?.data?.length > 0 ? (
						<div className="bg-white rounded-lg shadow p-6 my-4">
							<h2 className="text-xl font-bold mb-4">Affiliations</h2>
							<div className="space-y-4">
								{[...userAffiliations.data]
									.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
									.map((affiliation) => {
										const org = affiliation.affiliator;
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
										const formatDate = (dateString) => {
											if (!dateString) return "Present";
											return format(new Date(dateString), "MMM yyyy");
										};
										return (
											<div key={affiliation._id} className="bg-gray-50 rounded-lg shadow p-4">
												<div className="flex items-center">
													<img
														src={org.profilePicture || "/avatar.png"}
														alt={org.name}
														className="w-12 h-12 rounded-full mr-4"
													/>
													<div>
														<h3 className="font-semibold text-lg">{org.name}</h3>
														<p className="text-gray-600 text-sm">{org.headline || org.email}</p>
														<div className="flex items-center mt-1 text-sm text-gray-700">
															{getRoleIcon(affiliation.role)}
															<span className="capitalize">{affiliation.role}</span>
														</div>
														<div className="flex items-center mt-1 text-sm text-gray-700">
															<Calendar className="mr-2" size={16} />
															<span>
																{formatDate(affiliation.startDate)} - {formatDate(affiliation.endDate)}
															</span>
														</div>
													</div>
												</div>
											</div>
										);
									})}
							</div>
						</div>
					) : null}

					<ExperienceSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
					<EducationSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
					<SkillsSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
				</>
			)}
		</div>
	);
};
export default ProfilePage;
