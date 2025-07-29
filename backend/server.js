import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import postRoutes from './routes/post.route.js';
import notificationRoutes from './routes/notification.route.js';
import connectionRoutes from './routes/connection.route.js';
import chatRoutes from './routes/chat.route.js';
import projectRoutes from './routes/project.route.js';
import affiliationRoutes from './routes/affiliation.route.js';
import jobRoutes from './routes/job.route.js';
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import User from "./models/user.model.js";
import { Chat, Message } from "./models/chat.model.js";

const __dirname = path.resolve();
dotenv.config({ path: path.resolve(__dirname, './backend/.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: process.env.NODE_ENV !== "production" ? "http://localhost:5173" : undefined,
		credentials: true,
	},
});


if (process.env.NODE_ENV !== "production") {
	app.use(
		cors({
			origin: "http://localhost:5173",
			credentials: true,
		})
	);
}

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/connections", connectionRoutes);
app.use("/api/v1/affiliations", affiliationRoutes);
app.use("/api/v1/chats", chatRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/jobs", jobRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
	try {
		const token = socket.handshake.auth.token;
		if (!token) {
			return next(new Error("Authentication error: Token not provided"));
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		if (!decoded) {
			return next(new Error("Authentication error: Invalid token"));
		}

		const user = await User.findById(decoded.userId).select("-password");
		if (!user) {
			return next(new Error("Authentication error: User not found"));
		}

		socket.user = user;
		next();
	} catch (error) {
		console.error("Socket authentication error:", error.message);
		next(new Error("Authentication error"));
	}
});

// Socket.IO connection handling
io.on("connection", (socket) => {
	console.log(`User connected: ${socket.user.name} (${socket.user._id})`);

	// Join a room for the user's ID to receive direct messages
	socket.join(socket.user._id.toString());

	// Join chat rooms
	socket.on("join_chat", (chatId) => {
		socket.join(chatId);
		console.log(`${socket.user.name} joined chat: ${chatId}`);
	});

	// Leave chat room
	socket.on("leave_chat", (chatId) => {
		socket.leave(chatId);
		console.log(`${socket.user.name} left chat: ${chatId}`);
	});

	// Handle new message
	socket.on("send_message", async (messageData) => {
		try {
			const { chatId, content } = messageData;
			const senderId = socket.user._id;

			// Verify the chat exists and user is a participant
			const chat = await Chat.findById(chatId);
			if (!chat) {
				socket.emit("error", { message: "Chat not found" });
				return;
			}

			if (!chat.participants.includes(senderId)) {
				socket.emit("error", { message: "You are not a participant in this chat" });
				return;
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

			// Populate sender info before sending
			await newMessage.populate("sender", "name username profilePicture");

			// Emit the message to all users in the chat room
			io.to(chatId).emit("receive_message", newMessage);

			// Also emit a chat update to all participants
			for (const participantId of chat.participants) {
				if (participantId.toString() !== senderId.toString()) {
					io.to(participantId.toString()).emit("chat_updated", {
						chatId,
						lastMessage: newMessage,
					});
				}
			}
		} catch (error) {
			console.error("Error handling send_message:", error);
			socket.emit("error", { message: "Failed to send message" });
		}
	});

	// Handle typing indicator
	socket.on("typing", (data) => {
		const { chatId } = data;
		socket.to(chatId).emit("user_typing", {
			chatId,
			user: {
				_id: socket.user._id,
				name: socket.user.name,
			},
		});
	});

	// Handle stop typing indicator
	socket.on("stop_typing", (data) => {
		const { chatId } = data;
		socket.to(chatId).emit("user_stop_typing", {
			chatId,
			userId: socket.user._id,
		});
	});

	// Handle read messages
	socket.on("mark_read", async (data) => {
		try {
			const { chatId } = data;
			const userId = socket.user._id;

			// Mark messages as read
			await Message.updateMany(
				{ chatId, sender: { $ne: userId }, read: false },
				{ read: true }
			);

			// Notify the other participant that messages have been read
			const chat = await Chat.findById(chatId);
			if (chat) {
				for (const participantId of chat.participants) {
					if (participantId.toString() !== userId.toString()) {
						io.to(participantId.toString()).emit("messages_read", { chatId, readBy: userId });
					}
				}
			}
		} catch (error) {
			console.error("Error marking messages as read:", error);
		}
	});

	// Handle message deletion
	socket.on("delete_message", async (data) => {
		try {
			const { messageId } = data;
			const userId = socket.user._id;

			// Check if message exists
			const message = await Message.findById(messageId);
			if (!message) {
				socket.emit("error", { message: "Message not found" });
				return;
			}

			// Check if user is the sender of the message
			if (message.sender.toString() !== userId.toString()) {
				socket.emit("error", { message: "You can only delete your own messages" });
				return;
			}

			const chatId = message.chatId;

			// Get the chat to check if it needs lastMessage update
			const chat = await Chat.findById(chatId);
			if (!chat) {
				socket.emit("error", { message: "Chat not found" });
				return;
			}

			// Check if this message is the lastMessage in the chat
			const isLastMessage = chat.lastMessage && 
				chat.lastMessage.toString() === messageId.toString();

			// Delete the message
			await Message.findByIdAndDelete(messageId);

			// If this was the last message, update the chat's lastMessage to the new last message
			if (isLastMessage) {
				// Find the new last message
				const newLastMessage = await Message.findOne({ chatId })
					.sort({ createdAt: -1 });

				// Update the chat's lastMessage
				chat.lastMessage = newLastMessage ? newLastMessage._id : null;
				await chat.save();
			}

			// Notify all users in the chat room about the deleted message
			io.to(chatId.toString()).emit("message_deleted", { messageId, chatId });

			// If this was the last message, also notify about the chat update
			if (isLastMessage) {
				const updatedChat = await Chat.findById(chatId)
					.populate({
						path: "lastMessage",
						select: "content createdAt read sender",
					});

				for (const participantId of chat.participants) {
					io.to(participantId.toString()).emit("chat_updated", {
						chatId,
						lastMessage: updatedChat.lastMessage,
					});
				}
			}
		} catch (error) {
			console.error("Error deleting message:", error);
			socket.emit("error", { message: "Failed to delete message" });
		}
	});

	// Handle disconnection
	socket.on("disconnect", () => {
		console.log(`User disconnected: ${socket.user.name} (${socket.user._id})`);
	});
});

httpServer.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}....`);
    connectDB();
});
