import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import { UserPlus, Menu } from "lucide-react";
import FriendRequest from "../../components/FriendRequest/FriendRequest";
import Sidebar from "../../components/Sidebar/Sidebar";
import MobileSidebar from "../../components/MobileSidebar/MobileSidebar";
import UserCard from "../../components/UserCard/UserCard";
import { useState } from "react";

const NetworkPage = () => {
    const { data: user } = useQuery({ queryKey: ["authUser"] });
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

	const { data: connectionRequests } = useQuery({
		queryKey: ["connectionRequests"],
		queryFn: () => axiosInstance.get("/connections/requests"),
	});

	const { data: connections } = useQuery({
		queryKey: ["connections"],
		queryFn: () => axiosInstance.get("/connections"),
	});
    return (
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6'>
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
				<Sidebar user={user} />
			</div>
			<div className='col-span-1 lg:col-span-3'>
				<div className='bg-secondary rounded-lg shadow p-4 lg:p-6 mb-4 lg:mb-6'>
					<h1 className='text-xl lg:text-2xl font-bold mb-4 lg:mb-6'>My Network</h1>

					{connectionRequests?.data?.length > 0 ? (
						<div className='mb-6 lg:mb-8'>
							<h2 className='text-lg lg:text-xl font-semibold mb-2'>Connection Request</h2>
							<div className='space-y-4'>
								{connectionRequests.data.map((request) => (
									<FriendRequest key={request.id} request={request} />
								))}
							</div>
						</div>
					) : (
						<div className='bg-white rounded-lg shadow p-4 lg:p-6 text-center mb-4 lg:mb-6'>
							<UserPlus size={40} className="lg:w-12 lg:h-12 mx-auto text-gray-400 mb-3 lg:mb-4" />
							<h3 className='text-lg lg:text-xl font-semibold mb-2'>No Connection Requests</h3>
							<p className='text-sm lg:text-base text-gray-600'>
								You don&apos;t have any pending connection requests at the moment.
							</p>
							<p className='text-sm lg:text-base text-gray-600 mt-2'>
								Explore suggested connections below to expand your network!
							</p>
						</div>
					)}
                    {connections?.data?.length > 0 && (
						<div className='mb-6 lg:mb-8'>
							<h2 className='text-lg lg:text-xl font-semibold mb-4'>My Connections</h2>
							<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4'>
								{connections.data.map((connection) => (
									<UserCard key={connection._id} user={connection} isConnection={true} />
								))}
							</div>
						</div>
					)}
				</div>
			</div>
			
			{/* Mobile Sidebar */}
			<MobileSidebar 
				user={user} 
				isOpen={isMobileSidebarOpen} 
				onClose={() => setIsMobileSidebarOpen(false)} 
			/>
		</div>
    )
}

export default NetworkPage