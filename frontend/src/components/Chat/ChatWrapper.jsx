import { useState } from "react";
import ChatWindow from "./ChatWindow";

const ChatWrapper = () => {
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [selectedChat, setSelectedChat] = useState(null);

	return (
		<ChatWindow
			isOpen={isChatOpen}
			onClose={() => {
				setIsChatOpen(false);
				setSelectedChat(null);
			}}
			selectedChat={selectedChat}
			setSelectedChat={setSelectedChat}
		/>
	);
};

export default ChatWrapper;