import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import { format } from "date-fns";
import { Send, X, Trash2 } from "lucide-react";
import { useSocket } from "../../context/SocketContext";

const ChatWindow = ({ isOpen, onClose, selectedChat, setSelectedChat }) => {
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState([]);
	const [isTyping, setIsTyping] = useState(false);
	const [typingTimeout, setTypingTimeout] = useState(null);
	const [selectedMessageId, setSelectedMessageId] = useState(null);
	const [isLoadingMessages, setIsLoadingMessages] = useState(false);
	const messagesEndRef = useRef(null);
	const queryClient = useQueryClient();
	const { socket } = useSocket();
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	// Fetch chat list
	const { data: chats } = useQuery({
		queryKey: ["chats"],
		queryFn: async () => {
			const response = await axiosInstance.get("/chats");
			return response.data;
		},
		enabled: isOpen && !selectedChat,
	});

	// Fetch messages for selected chat
	const { data: chatMessages, refetch: refetchMessages, isLoading } = useQuery({
		queryKey: ["chatMessages", selectedChat?._id],
		queryFn: async () => {
			setIsLoadingMessages(true);
			try {
				const response = await axiosInstance.get(`/chats/${selectedChat._id}/messages`);
				return response.data;
			} finally {
				setIsLoadingMessages(false);
			}
		},
		enabled: !!selectedChat,
		onSuccess: (data) => {
			setMessages(data);
			// Scroll to bottom when messages are loaded
			setTimeout(() => {
				messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
			}, 100);
		},
	});

	// Send message mutation
	const { mutate: sendMessage } = useMutation({
		mutationFn: async (content) => {
			return axiosInstance.post(`/chats/${selectedChat._id}/messages`, { content });
		},
		onSuccess: () => {
			setMessage("");
			queryClient.invalidateQueries({ queryKey: ["chatMessages", selectedChat._id] });
			queryClient.invalidateQueries({ queryKey: ["chats"] });
		},
	});

	// Start a new chat with a user
	const { mutate: startChat } = useMutation({
		mutationFn: async (userId) => {
			const response = await axiosInstance.get(`/chats/user/${userId}`);
			return response.data;
		},
		onSuccess: (data) => {
			setSelectedChat(data);
			queryClient.invalidateQueries({ queryKey: ["chats"] });
		},
	});

	// Delete message mutation
	const { mutate: deleteMessage } = useMutation({
		mutationFn: async (messageId) => {
			return axiosInstance.delete(`/chats/messages/${messageId}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chatMessages", selectedChat._id] });
			queryClient.invalidateQueries({ queryKey: ["chats"] });
			setSelectedMessageId(null);
		},
	});

	// Handle message deletion
	const handleDeleteMessage = (messageId) => {
		if (socket) {
			socket.emit("delete_message", { messageId });
			setSelectedMessageId(null);
		} else {
			// Fallback to REST API if socket is not available
			deleteMessage(messageId);
		}
	};

	// Socket.io event handlers
	useEffect(() => {
		if (!socket || !selectedChat) return;

		// Join the chat room
		socket.emit("join_chat", selectedChat._id);

		// Refetch messages when chat is selected
		refetchMessages();

		// Mark messages as read
		socket.emit("mark_read", { chatId: selectedChat._id });

		// Listen for new messages
		const handleReceiveMessage = (newMessage) => {
			if (newMessage.chatId === selectedChat._id) {
				setMessages((prev) => [...prev, newMessage]);

				// If the message is from the other user, mark it as read
				if (newMessage.sender._id !== authUser._id) {
					socket.emit("mark_read", { chatId: selectedChat._id });
				}
			}
		};

		// Listen for message deletion
		const handleMessageDeleted = (data) => {
			if (data.chatId === selectedChat._id) {
				setMessages((prev) => prev.filter(msg => msg._id !== data.messageId));
				setSelectedMessageId(null);
			}
		};

		// Listen for typing indicators
		const handleUserTyping = (data) => {
			if (data.chatId === selectedChat._id && data.user._id !== authUser._id) {
				setIsTyping(true);
			}
		};

		const handleUserStopTyping = (data) => {
			if (data.chatId === selectedChat._id && data.userId !== authUser._id) {
				setIsTyping(false);
			}
		};

		socket.on("receive_message", handleReceiveMessage);
		socket.on("message_deleted", handleMessageDeleted);
		socket.on("user_typing", handleUserTyping);
		socket.on("user_stop_typing", handleUserStopTyping);

		return () => {
			// Leave the chat room when component unmounts or chat changes
			socket.emit("leave_chat", selectedChat._id);
			socket.off("receive_message", handleReceiveMessage);
			socket.off("message_deleted", handleMessageDeleted);
			socket.off("user_typing", handleUserTyping);
			socket.off("user_stop_typing", handleUserStopTyping);
		};
	}, [socket, selectedChat, authUser]);

	// Scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Clear messages when chat is deselected
	useEffect(() => {
		if (!selectedChat) {
			setMessages([]);
			setSelectedMessageId(null);
		}
	}, [selectedChat]);

	// Add click handler to close selected message when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			// Check if click is outside of any message bubble
			if (selectedMessageId && !event.target.closest('.message-bubble')) {
				setSelectedMessageId(null);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [selectedMessageId]);

	// Handle typing indicator
	const handleTyping = () => {
		if (!socket || !selectedChat) return;

		socket.emit("typing", { chatId: selectedChat._id });

		// Clear existing timeout
		if (typingTimeout) clearTimeout(typingTimeout);

		// Set new timeout
		const timeout = setTimeout(() => {
			socket.emit("stop_typing", { chatId: selectedChat._id });
		}, 3000);

		setTypingTimeout(timeout);
	};

	const handleSendMessage = (e) => {
		e.preventDefault();
		if (!message.trim() || !selectedChat) return;

		// Use socket to send message
		if (socket) {
			socket.emit("send_message", {
				chatId: selectedChat._id,
				content: message.trim(),

			});
			setMessage("");
		} else {
			// Fallback to REST API if socket is not available
			sendMessage(message.trim());
		}

		// Clear typing indicator
		if (typingTimeout) clearTimeout(typingTimeout);
		if (socket) socket.emit("stop_typing", { chatId: selectedChat._id });

	};

	const handleBackToList = () => {
		setSelectedChat(null);
	};

	const getOtherParticipant = (chat) => {
		if (!chat || !chat.participants || !authUser) return null;
		return chat.participants.find((p) => p._id !== authUser._id);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed bottom-0 right-4 w-80 bg-white rounded-t-lg shadow-lg z-20 flex flex-col">
			{/* Chat Header */}
			<div className="bg-primary text-white p-3 rounded-t-lg flex justify-between items-center">
				<div className="flex items-center">
					{selectedChat ? (
						<>
							<h3 className="font-semibold">
								{getOtherParticipant(selectedChat)?.name || "Chat"}
							</h3>
							{getOtherParticipant(selectedChat)?.username && (
								<a
									href={`/profile/${getOtherParticipant(selectedChat)?.username}`}
									onClick={(e) => {
										e.preventDefault();
										window.open(`/profile/${getOtherParticipant(selectedChat)?.username}`, '_blank');
									}}
									className="ml-2 text-xs text-white hover:underline flex items-center"
								>
									<span className="hidden md:inline">View Profile</span>
								</a>
							)}
						</>
					) : (
						<h3 className="font-semibold">Messages</h3>
					)}
				</div>
				<button onClick={onClose} className="text-white hover:text-gray-200">
					<X size={18} />
				</button>
			</div>

			{/* Chat Content */}
			<div className="flex-1 overflow-y-auto max-h-96 p-3 bg-gray-50">
				{selectedChat ? (
					<>
						{/* Back button */}
						<button
							onClick={handleBackToList}
							className="text-primary hover:underline mb-3 flex items-center"
						>
							← Back to messages
						</button>

						{/* Messages */}
						<div className="space-y-3">
							{isLoadingMessages ? (
								<p className="text-center text-gray-500 py-4">Loading messages...</p>
							) : messages?.length > 0 ? (
								messages.map((msg) => (
									<div
										key={msg._id}
										className={`flex ${msg.sender._id === authUser._id ? "justify-end" : "justify-start"} relative`}
									>
										<div
											className={`max-w-[70%] rounded-lg p-3 ${msg.sender._id === authUser._id
													? "bg-primary text-white rounded-br-none"
													: "bg-gray-200 text-gray-800 rounded-bl-none"
												} ${selectedMessageId === msg._id ? "ring-2 ring-blue-400" : ""} cursor-pointer message-bubble`}
											onClick={() => setSelectedMessageId(selectedMessageId === msg._id ? null : msg._id)}
										>
											<div className="flex items-center mb-1">
												{msg.sender._id !== authUser._id && (
													<a
														href={`/profile/${msg.sender.username}`}
														onClick={(e) => e.stopPropagation()}
														className="font-medium hover:underline mr-2"
													>
														{msg.sender.name}
													</a>
												)}
											</div>
											<p className="break-words">{msg.content}</p>
											<div className="flex justify-between items-center mt-1">
												<p
													className={`text-xs ${msg.sender._id === authUser._id ? "text-gray-200" : "text-gray-500"
														}`}
												>
													{format(new Date(msg.createdAt), "h:mm a")}
												</p>
												{msg.sender._id !== authUser._id && (
													<a
														href={`/profile/${msg.sender.username}`}
														onClick={(e) => e.stopPropagation()}
														className={`text-xs ${msg.sender._id === authUser._id ? "text-gray-200" : "text-gray-500"} hover:underline`}
													>
														View Profile
													</a>
												)}
											</div>
										</div>
										{selectedMessageId === msg._id && msg.sender._id === authUser._id && (
											<button
												onClick={() => handleDeleteMessage(msg._id)}
												className={`absolute ${msg.sender._id === authUser._id ? "left-0" : "right-0"} top-0 -mt-2 ${msg.sender._id === authUser._id ? "-ml-8" : "-mr-8"} bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors message-bubble`}
												title="Delete message"
											>
												<Trash2 size={16} />
											</button>
										)}
									</div>
								))
							) : (
								<p className="text-center text-gray-500 py-4">No messages yet. Start the conversation!</p>
							)}
							{isTyping && (
								<div className="flex justify-start">
									<div className="bg-gray-200 text-gray-800 rounded-lg rounded-bl-none p-3">
										<p className="text-sm">Typing...</p>
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>
					</>
				) : (
					<>
						{/* Chat List */}
						{chats?.length > 0 ? (
							chats.map((chat) => {
								const otherUser = getOtherParticipant(chat);
								return (
									<div
										key={chat._id}
										className="flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer"
									>
										<a
											href={`/profile/${otherUser?.username}`}
											onClick={(e) => {
												e.stopPropagation();
												e.preventDefault();
												window.open(`/profile/${otherUser?.username}`, '_blank');
											}}
											className="relative group"
										>
											<img
												src={otherUser.profilePicture
													? `http://localhost:5000/uploads/${otherUser.profilePicture}`
													: "/avatar.png"}

												alt={otherUser?.name}
												className="w-10 h-10 rounded-full mr-3 object-cover group-hover:opacity-90 transition-opacity"
											/>
										</a>
										<div
											className="flex-1 min-w-0 cursor-pointer"
											onClick={() => setSelectedChat(chat)}
										>
											<div className="flex items-center">
												<h4 className="font-medium text-gray-900 truncate">{otherUser?.name}</h4>
												<a
													href={`/profile/${otherUser?.username}`}
													onClick={(e) => {
														e.stopPropagation();
														e.preventDefault();
														window.open(`/profile/${otherUser?.username}`, '_blank');
													}}
													className="ml-2 text-xs text-primary hover:underline"
												>
													View Profile
												</a>
											</div>
											<p className="text-sm text-gray-500 truncate">
												{chat.lastMessage
													? chat.lastMessage.content
													: "Start a conversation"}
											</p>
										</div>
										{chat.lastMessage && !chat.lastMessage.read && chat.lastMessage.sender !== authUser._id && (
											<span className="bg-blue-500 rounded-full w-3 h-3"></span>
										)}
									</div>
								);
							})
						) : (
							<p className="text-center text-gray-500 py-4">
								No conversations yet. Connect with users to start chatting!
							</p>
						)}
					</>
				)}
			</div>

			{/* Message Input */}
			{selectedChat && (
				<form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 flex">
					<input
						type="text"
						value={message}
						onChange={(e) => {
							setMessage(e.target.value);
							handleTyping();
						}}
						className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
						placeholder="Type a message..."
					/>
					<button
						type="submit"
						className="bg-primary text-white px-3 py-2 rounded-r-md hover:bg-primary-dark"
						disabled={!message.trim()}
					>
						<Send size={18} />
					</button>
				</form>
			)}
		</div>
	);
};

export default ChatWindow;