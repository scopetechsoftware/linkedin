import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "../../lib/axios"
import { Link } from "react-router-dom";
import { Bell, Home, LogOut, Search, User, Users } from "lucide-react";
import { useState } from "react";
import ChatIcon from "../Chat/ChatIcon";
import ChatWindow from "../Chat/ChatWindow";
import AIChatIcon from "../AIChat/AIChatIcon";
import AIChatWindow from "../AIChat/AIChatWindow";
 // make sure axios is set up with auth token


const Navbar = () => {
    const {data: authUser} = useQuery({
        queryKey: ['authUser'],
    });
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const queryClient = useQueryClient();


    

    const {data: notifications} = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => axiosInstance.get('/notifications'),
        enabled: !!authUser
    })

    const { data: connectionRequests } = useQuery({
		queryKey: ["connectionRequests"],
		queryFn: async () => axiosInstance.get("/connections/requests"),
		enabled: !!authUser,
	});

    const { mutate: logout } = useMutation({
		mutationFn: () => axiosInstance.post("/auth/logout"),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
	});

    const unreadNotificationCount = notifications?.data.filter((notif) => !notif.read).length;
	const unreadConnectionRequestsCount = connectionRequests?.data?.length;


    return (
        <>
            <nav className='bg-secondary shadow-md sticky top-0 z-10'>
                <div className='max-w-7xl mx-auto px-4'>
                    <div className='flex justify-between items-center py-3'>
                        <div className='flex items-center space-x-4'>
                            <Link to='/'>
                                <img className='h-8 rounded' src='/small-logo.png' alt='LinkedIn' />
                            </Link>
                        </div>
                        <div className='flex items-center gap-2 md:gap-6'>
                            {authUser ? (
                                <>
                                    <Link to={"/"} className='text-neutral flex flex-col items-center'>
                                        <Home size={20} />
                                        <span className='text-xs hidden md:block'>Home</span>
                                    </Link>
                                    <Link to={"/search"} className='text-neutral flex flex-col items-center'>
                                        <Search size={20} />
                                        <span className='text-xs hidden md:block'>Search</span>
                                    </Link>
                                    <Link to='/network' className='text-neutral flex flex-col items-center relative'>
                                        <Users size={20} />
                                        <span className='text-xs hidden md:block'>My Network</span>
                                        {unreadConnectionRequestsCount > 0 && (
                                            <span
                                                className='absolute -top-1 -right-1 md:right-4 bg-blue-500 text-white text-xs
                                            rounded-full size-3 md:size-4 flex items-center justify-center'
                                            >
                                                {unreadConnectionRequestsCount}
                                            </span>
                                        )}
                                    </Link>
                                    <Link to='/notifications' className='text-neutral flex flex-col items-center relative'>
                                        <Bell size={20} />
                                        <span className='text-xs hidden md:block'>Notifications</span>
                                        {unreadNotificationCount > 0 && (
                                            <span
                                                className='absolute -top-1 -right-1 md:right-4 bg-blue-500 text-white text-xs
                                            rounded-full size-3 md:size-4 flex items-center justify-center'
                                            >
                                                {unreadNotificationCount}
                                            </span>
                                        )}
                                    </Link>
                                    <Link
                                        to='/settings'
                                        className='text-neutral flex flex-col items-center'
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                        <span className='text-xs hidden md:block'>Settings</span>
                                    </Link>
                                    <ChatIcon onClick={() => setIsChatOpen(!isChatOpen)} />
                                    <AIChatIcon 
                                        onClick={() => setIsAIChatOpen(!isAIChatOpen)} 
                                        isOpen={isAIChatOpen}
                                    />
                                    <button
                                        className='flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800'
                                        onClick={() => logout()}
                                    >
                                        <LogOut size={20} />
                                        <span className='hidden md:inline'>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to='/login' className='btn btn-ghost'>
                                        Sign In
                                    </Link>
                                    <Link to='/signup' className='btn btn-primary'>
                                        Join now
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            {authUser && (
                <ChatWindow 
                    isOpen={isChatOpen} 
                    onClose={() => setIsChatOpen(false)} 
                    selectedChat={selectedChat} 
                    setSelectedChat={setSelectedChat} 
                />
            )}
            {authUser && (
                <AIChatWindow 
                    isOpen={isAIChatOpen} 
                    onClose={() => setIsAIChatOpen(false)} 
                />
            )}
        </>
    )
}

export default Navbar