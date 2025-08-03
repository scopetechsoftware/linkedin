import { MessageSquare } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";

const ChatButton = ({ userId, isConnected, onChatStart }) => {
	const queryClient = useQueryClient();

	// Start a new chat with a user
	const { mutate: startChat, isLoading } = useMutation({
		mutationFn: async () => {
			const response = await axiosInstance.get(`/chats/user/${userId}`);
			return response.data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["chats"] });
			onChatStart(data);
		},
	});

	if (!isConnected) {
		return null; // Don't show chat button if not connected
	}

	return (
		<button
			onClick={() => startChat()}
			disabled={isLoading}
			className="bg-primary hover:bg-primary-dark text-white py-1.5 sm:py-2 px-3 sm:px-4 rounded-full transition duration-300 flex items-center justify-center text-xs sm:text-sm"
		>
			<MessageSquare size={16} className="mr-1 sm:mr-2" />
			Message
		</button>
	);
};

export default ChatButton;