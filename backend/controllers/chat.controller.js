import { Chat, Message } from "../models/chat.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

// Get all chats for the current user
export const getUserChats = async (req, res) => {
	try {
		const userId = req.user._id;

		// Find all chats where the current user is a participant
		const chats = await Chat.find({ participants: userId })
			.populate({
				path: "participants",
				select: "name username profilePicture",
				match: { _id: { $ne: userId } }, // Only populate the other participant
			})
			.populate({
				path: "lastMessage",
				select: "content createdAt read sender",
			})
			.sort({ updatedAt: -1 }); // Sort by most recent activity

		res.status(200).json(chats);
	} catch (error) {
		console.error("Error in getUserChats controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Get or create a chat between two users
export const getChatWithUser = async (req, res) => {
	try {
		const currentUserId = req.user._id;
		const { userId } = req.params;

		// Check if users are connected
		const currentUser = await User.findById(currentUserId);
		if (!currentUser.connections.includes(userId)) {
			return res.status(403).json({ message: "You can only chat with your connections" });
		}

		// Find existing chat or create a new one
		let chat = await Chat.findOne({
			participants: { $all: [currentUserId, userId] },
		});

		if (!chat) {
			// Create a new chat
			chat = new Chat({
				participants: [currentUserId, userId],
			});
			await chat.save();
		}

		// Populate the chat with participant info
		await chat.populate({
			path: "participants",
			select: "name username profilePicture",
		});

		res.status(200).json(chat);
	} catch (error) {
		console.error("Error in getChatWithUser controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Get messages for a specific chat
export const getChatMessages = async (req, res) => {
	try {
		const { chatId } = req.params;
		const userId = req.user._id;

		// Verify the user is a participant in this chat
		const chat = await Chat.findById(chatId);
		if (!chat) {
			return res.status(404).json({ message: "Chat not found" });
		}

		if (!chat.participants.includes(userId)) {
			return res.status(403).json({ message: "You are not a participant in this chat" });
		}

		// Get messages for this chat
		const messages = await Message.find({ chatId })
			.populate("sender", "name username profilePicture")
			.sort({ createdAt: 1 });

		// Mark unread messages as read
		await Message.updateMany(
			{ chatId, sender: { $ne: userId }, read: false },
			{ read: true }
		);

		res.status(200).json(messages);
	} catch (error) {
		console.error("Error in getChatMessages controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Send a message in a chat
export const sendMessage = async (req, res) => {
	try {
		const { chatId } = req.params;
		const { content } = req.body;
		const senderId = req.user._id;

		if (!content || content.trim() === "") {
			return res.status(400).json({ message: "Message content cannot be empty" });
		}

		// Verify the chat exists and user is a participant
		const chat = await Chat.findById(chatId);
		if (!chat) {
			return res.status(404).json({ message: "Chat not found" });
		}

		if (!chat.participants.includes(senderId)) {
			return res.status(403).json({ message: "You are not a participant in this chat" });
		}

		// Create and save the message
		const newMessage = new Message({
			sender: senderId,
			content,
			chatId,
		});

		await newMessage.save();

		// Update the chat's lastMessage
		chat.lastMessage = newMessage._id;
		await chat.save();

		// Populate sender info before returning
		await newMessage.populate("sender", "name username profilePicture");

		res.status(201).json(newMessage);
	} catch (error) {
		console.error("Error in sendMessage controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Get unread message count for the current user
export const getUnreadMessageCount = async (req, res) => {
	try {
		const userId = req.user._id;

		// Find all chats where the user is a participant
		const chats = await Chat.find({ participants: userId });
		const chatIds = chats.map((chat) => chat._id);

		// Count unread messages in these chats
		const unreadCount = await Message.countDocuments({
			chatId: { $in: chatIds },
			sender: { $ne: userId },
			read: false,
		});

		res.status(200).json({ unreadCount });
	} catch (error) {
		console.error("Error in getUnreadMessageCount controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Delete a message
export const deleteMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		const userId = req.user._id;

		// Check if message exists
		const message = await Message.findById(messageId);
		if (!message) {
			return res.status(404).json({ message: "Message not found" });
		}

		// Check if user is the sender of the message
		if (message.sender.toString() !== userId.toString()) {
			return res.status(403).json({ message: "You can only delete your own messages" });
		}

		// Get the chat to check if it needs lastMessage update
		const chat = await Chat.findById(message.chatId);
		if (!chat) {
			return res.status(404).json({ message: "Chat not found" });
		}

		// Check if this message is the lastMessage in the chat
		const isLastMessage = chat.lastMessage && 
			chat.lastMessage.toString() === messageId.toString();

		// Delete the message
		await Message.findByIdAndDelete(messageId);

		// If this was the last message, update the chat's lastMessage to the new last message
		if (isLastMessage) {
			// Find the new last message
			const newLastMessage = await Message.findOne({ chatId: chat._id })
				.sort({ createdAt: -1 });

			// Update the chat's lastMessage
			chat.lastMessage = newLastMessage ? newLastMessage._id : null;
			await chat.save();
		}

		res.status(200).json({ message: "Message deleted successfully", messageId });
	} catch (error) {
		console.error("Error in deleteMessage controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};