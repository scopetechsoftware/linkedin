import { MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";

const ChatIcon = ({ onClick }) => {
	const { data: unreadCount } = useQuery({
		queryKey: ["unreadMessageCount"],
		queryFn: async () => {
			const response = await axiosInstance.get("/chats/unread/count");
			return response.data.unreadCount;
		},
		refetchInterval: 10000, // Refetch every 10 seconds
	});

	return (
		<button onClick={onClick} className="text-neutral flex flex-col items-center relative">
			<MessageSquare size={20} />
			<span className="text-xs hidden md:block">Messages</span>
			{unreadCount > 0 && (
				<span
					className="absolute -top-1 -right-1 md:right-4 bg-blue-500 text-white text-xs
				rounded-full size-3 md:size-4 flex items-center justify-center"
				>
					{unreadCount}
				</span>
			)}
		</button>
	);
};

export default ChatIcon;