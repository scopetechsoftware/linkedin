import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
	getChatMessages,
	getChatWithUser,
	getUnreadMessageCount,
	getUserChats,
	sendMessage,
	deleteMessage,
} from "../controllers/chat.controller.js";

const router = express.Router();

// Get all chats for the current user
router.get("/", protectRoute, getUserChats);

// Get or create a chat with a specific user
router.get("/user/:userId", protectRoute, getChatWithUser);

// Get messages for a specific chat
router.get("/:chatId/messages", protectRoute, getChatMessages);

// Send a message in a chat
router.post("/:chatId/messages", protectRoute, sendMessage);

// Get unread message count
router.get("/unread/count", protectRoute, getUnreadMessageCount);

// Delete a message
router.delete("/messages/:messageId", protectRoute, deleteMessage);

export default router;