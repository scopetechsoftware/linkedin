import { Link } from "react-router-dom";
import { Home, UserPlus, Bell, Briefcase, Users, GraduationCap, Building } from "lucide-react";
import { useState } from "react";
import AffiliationForm from "../AffiliationForm/AffiliationForm";
import JobPostingForm from "../JobPostingForm/JobPostingForm";

export default function Sidebar({ user }) {
	const [isAffiliationFormOpen, setIsAffiliationFormOpen] = useState(false);
	const [isJobPostingFormOpen, setIsJobPostingFormOpen] = useState(false);

	const handleOpenAffiliationForm = () => {
		setIsAffiliationFormOpen(true);
	};

	const handleOpenJobPostingForm = () => {
		setIsJobPostingFormOpen(true);
	};

	return (
		<div className='bg-secondary rounded-lg shadow'>
			<div className='p-4 text-center'>
				<div
					className='h-16 rounded-t-lg bg-cover bg-center'
					style={{
						backgroundImage: `url("${user.bannerImg || "/banner.png"}")`,
					}}
				/>
				<Link to={`/profile/${user.username}`}>
					<img
						src={user.profilePicture || "/avatar.png"}
						alt={user.name}
						className='w-20 h-20 rounded-full mx-auto mt-[-40px]'
					/>
					<h2 className='text-xl font-semibold mt-2'>{user.name}</h2>
				</Link>
				<p className='text-info'>{user.headline}</p>
				<p className='text-info text-xs'>{user.connections.length} connections</p>
			</div>
			<div className='border-t border-base-100 p-4'>
				<nav>
					<ul className='space-y-2'>
						<li>
							<Link
								to='/'
								className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors'
							>
								<Home className='mr-2' size={20} /> Home
							</Link>
						</li>
						<li>
							<Link
								to='/network'
								className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors'
							>
								<UserPlus className='mr-2' size={20} /> My Network
							</Link>
						</li>
						<li>
							<Link
								to='/notifications'
								className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors'
							>
								<Bell className='mr-2' size={20} /> Notifications
							</Link>
						</li>
						<li>
							<Link
								to='/projects'
								className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors'
							>
								<Briefcase className='mr-2' size={20} /> Projects
							</Link>
						</li>
						<li>
							<Link
								to='/affiliations'
								className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors'
							>
								<Building className='mr-2' size={20} /> Affiliations
							</Link>
						</li>

						{user.role === "company" && (
							<li>
								<button
									onClick={handleOpenAffiliationForm}
									className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors w-full text-left'
								>
									<Users className='mr-2' size={20} /> Add Employee/Employer
								</button>
							</li>
						)}

						{user.role === "university" && (
							<li>
								<button
									onClick={handleOpenAffiliationForm}
									className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors w-full text-left'
								>
									<GraduationCap className='mr-2' size={20} /> Add Student/Professor
								</button>
							</li>
						)}
						{["employer", "company", "professor", "university"].includes(user.role) && (
							<li>
								<button
									onClick={handleOpenJobPostingForm}
									className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors w-full text-left'
								>
									<Briefcase className='mr-2' size={20} /> Job Posting
								</button>
							</li>
						)}
					</ul>
				</nav>
			</div>
			<div className='border-t border-base-100 p-4'>
				<Link to={`/profile/${user.username}`} className='text-sm font-semibold'>
					Visit your profile
				</Link>
			</div>

			{(user.role === "company" || user.role === "university") && (
				<AffiliationForm 
					isOpen={isAffiliationFormOpen} 
					onClose={() => setIsAffiliationFormOpen(false)} 
					userRole={user.role} 
				/>
			)}
			<JobPostingForm isOpen={isJobPostingFormOpen} onClose={() => setIsJobPostingFormOpen(false)} />
		</div>
	);
}
