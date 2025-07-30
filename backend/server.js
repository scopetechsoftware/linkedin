import dotenv from "dotenv";
dotenv.config();

import express from "express";
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
import searchRoutes from './routes/search.route.js';
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
        credentials: true,
        methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
});

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
    try {
        const userId = socket.handshake.auth.userId;
        if (!userId) {
            return next(new Error("Authentication failed - No user ID provided"));
        }

        const User = await import("./models/user.model.js").then(module => module.default);
        const user = await User.findById(userId).select("-password");
        
        if (!user) {
            return next(new Error("Authentication failed - User not found"));
        }

        socket.user = user;
        next();
    } catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Authentication failed - Server error"));
    }
});

// CORS configuration
if (process.env.NODE_ENV !== "production") {
    app.use(
        cors({
            origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
            credentials: true,
        })
    );
}

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/connections", connectionRoutes);
app.use("/api/v1/affiliations", affiliationRoutes);
app.use("/api/v1/chats", chatRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/search", searchRoutes);

// Socket connection handler
io.on("connection", (socket) => {
    console.log("A socket connected!", socket.user?._id);

    // Join user's own room for private messages
    if (socket.user?._id) {
        socket.join(socket.user._id.toString());
    }

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("A socket disconnected!", socket.user?._id);
    });

    // Register the share_project handler FIRST
    socket.on("share_project", async (data) => {
        try {
            console.log("Received share_project event:", data, "User:", socket.user);
            const { projectId, toUserId } = data;
            if (!projectId || !toUserId) {
                console.log("Missing projectId or toUserId");
                socket.emit("error", { message: "Missing projectId or toUserId" });
                return;
            }

            // Import models using ES modules syntax
            const Project = await import("./models/project.model.js").then(module => module.default);
            const User = await import("./models/user.model.js").then(module => module.default);
            const Notification = await import("./models/notification.model.js").then(module => module.default);

            // Fetch project details
            const project = await Project.findById(projectId)
                .populate("collaborators", "_id name profilePicture")
                .lean();
            if (!project) {
                console.log("Project not found:", projectId);
                socket.emit("error", { message: "Project not found" });
                return;
            }

            // Fetch sender info
            const sender = await User.findById(socket.user._id).select("_id name profilePicture").lean();

            // Create notification for the recipient
            const notification = new Notification({
                recipient: toUserId,
                type: "projectShared",
                relatedUser: socket.user._id,
                relatedProject: projectId
            });
            await notification.save();
            console.log("Created notification:", notification);

            // Check if recipient is connected
            const recipientSocketId = Object.keys(io.sockets.adapter.rooms.get(toUserId.toString()) || {});
            console.log("Recipient socket status:", {
                toUserId,
                recipientRoom: toUserId.toString(),
                recipientConnected: recipientSocketId.length > 0,
                recipientSocketIds: recipientSocketId
            });

            // Emit to the recipient's room
            io.to(toUserId.toString()).emit("project_shared", {
                project,
                sender,
            });
            console.log("Emitted project_shared event to recipient:", toUserId.toString());

            // Send confirmation back to sender
            socket.emit("project_share_success", {
                projectId,
                toUserId
            });
            console.log("Emitted project_share_success event to sender");
        } catch (err) {
            console.error("Error in share_project handler:", err);
            socket.emit("error", { message: "Failed to share project" });
        }
    });

    // Register the onAny handler AFTER
    socket.onAny((event, ...args) => {
        console.log("Socket received event:", event, args);
    });

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

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
