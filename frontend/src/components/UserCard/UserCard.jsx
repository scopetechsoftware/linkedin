import { Link } from "react-router-dom";

function UserCard({ user, isConnection }) {
	return (
		<div className='bg-white rounded-lg shadow p-4 flex flex-col items-center transition-all hover:shadow-md'>
			<Link to={`/profile/${user.username}`} className='flex flex-col items-center'>
				<img
					src={user.profilePicture || "/avatar.png"}
					alt={user.name}
					className='w-24 h-24 rounded-full object-cover mb-4'
				/>
				<h3 className='font-semibold text-lg text-center'>{user.name}</h3>
			</Link>
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
				<div>
					<p className='text-gray-600 text-center'>{user.location || 'Location not specified'}</p>
					<p className='text-xs text-gray-400 flex items-center justify-center mt-1'>
						<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
						Private Profile
					</p>
				</div>
			) : (
				<>
					<p className='text-gray-600 text-center'>{user.headline}</p>
					<p className='text-sm text-gray-500 mt-2'>{user.connections?.length} connections</p>
				</>
			)}
			<button className='mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors w-full'>
				{isConnection ? "Connected" : "Connect"}
			</button>
		</div>
	);
}

export default UserCard;
