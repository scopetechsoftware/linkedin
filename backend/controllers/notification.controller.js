import Notification from "../models/notification.model.js";
import { io } from "../socket.js";

export const getUserNotifications = async (req, res) => {
	try {
		const notifications = await Notification.find({ recipient: req.user._id })
			.sort({ createdAt: -1 })
			.populate("relatedUser", "name username profilePicture")
			.populate("relatedPost", "content image")
			.populate("relatedProject", "name description gitlink projecturl collaborators");

		res.status(200).json(notifications);
	} catch (error) {
		console.error("Error in getUserNotifications controller:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const createProfileVisitNotification = async (visitorId, profileOwnerId) => {
	try {
		// Don't create notification if visitor is viewing their own profile
		if (visitorId.toString() === profileOwnerId.toString()) {
			return;
		}

		// Check if there's already a recent profile visit notification (within last 24 hours)
		const oneDayAgo = new Date();
		oneDayAgo.setDate(oneDayAgo.getDate() - 1);

		const existingNotification = await Notification.findOne({
			recipient: profileOwnerId,
			relatedUser: visitorId,
			type: "profileVisit",
			createdAt: { $gte: oneDayAgo }
		});

		// If no recent notification exists, create a new one
		if (!existingNotification) {
			const notification = new Notification({
				recipient: profileOwnerId,
				type: "profileVisit",
				relatedUser: visitorId,
				read: false
			});
			await notification.save();
			
			// Populate the notification with related user data
			await notification.populate("relatedUser", "name username profilePicture");
			
			// Emit socket event to the recipient
			io.to(profileOwnerId.toString()).emit("new_notification", notification);
		}
	} catch (error) {
		console.error("Error creating profile visit notification:", error);
	}
};

export const createAIProfileSearchNotification = async (searcherId, profileOwnerId) => {
	try {
		// Don't create notification if searcher is viewing their own profile
		if (searcherId.toString() === profileOwnerId.toString()) {
			return;
		}

		// Check if there's already a recent AI profile search notification (within last 24 hours)
		const oneDayAgo = new Date();
		oneDayAgo.setDate(oneDayAgo.getDate() - 1);

		const existingNotification = await Notification.findOne({
			recipient: profileOwnerId,
			relatedUser: searcherId,
			type: "profileVisit", // Using the same type as profile visit
			createdAt: { $gte: oneDayAgo }
		});

		// If no recent notification exists, create a new one
		if (!existingNotification) {
			const notification = new Notification({
				recipient: profileOwnerId,
				type: "profileVisit", // Using the same type as profile visit
				relatedUser: searcherId,
				read: false
			});
			await notification.save();
			
			// Populate the notification with related user data
			await notification.populate("relatedUser", "name username profilePicture");
			
			// Emit socket event to the recipient
			io.to(profileOwnerId.toString()).emit("new_notification", notification);
		}
	} catch (error) {
		console.error("Error creating AI profile search notification:", error);
	}
};

export const markNotificationAsRead = async (req, res) => {
	const notificationId = req.params.id;
	try {
		const notification = await Notification.findByIdAndUpdate(
			{ _id: notificationId, recipient: req.user._id },
			{ read: true },
			{ new: true }
		);

		res.json(notification);
	} catch (error) {
		console.error("Error in markNotificationAsRead controller:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const deleteNotification = async (req, res) => {
	const notificationId = req.params.id;

	try {
		await Notification.findOneAndDelete({
			_id: notificationId,
			recipient: req.user._id,
		});

		res.json({ message: "Notification deleted successfully" });
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
};
