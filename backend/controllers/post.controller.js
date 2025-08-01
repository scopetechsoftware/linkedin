import { sendCommentNotificationEmail } from "../emails/emailHandlers.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";

export const getFeedPosts = async (req, res) => {
		try {
			const posts = await Post.find()
				.populate("author", "name username profilePicture headline role")
				.populate("comments.user", "name profilePicture")
				.sort({ createdAt: -1 });

			res.status(200).json(posts);
		} catch (error) {
		console.error("Error in getFeedPosts controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const createPost = async (req, res) => {
	try {
		const { content } = req.body;
		let newPost;

		if (req.file) {
			newPost = new Post({
				author: req.user._id,
				content,
				image: req.file.path.replace(/.*uploads[\\/]/, ''), // relative to uploads/
			});
		} else {
			newPost = new Post({
				author: req.user._id,
				content,
			});
		}

		await newPost.save();

		res.status(201).json(newPost);
	} catch (error) {
		console.error("Error in createPost controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const deletePost = async (req, res) => {
	try {
		const postId = req.params.id;
		const userId = req.user._id;

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}

		if (post.author.toString() !== userId.toString()) {
			return res.status(403).json({ message: "You are not authorized to delete this post" });
		}

		// Optionally, delete file from disk here if you want
		// (not implemented)

		await Post.findByIdAndDelete(postId);

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (error) {
		console.log("Error in delete post controller", error.message);
		res.status(500).json({ message: "Server error" });
	}
};

export const getPostById = async (req, res) => {
		try {
			const postId = req.params.id;
			const post = await Post.findById(postId)
				.populate("author", "name username profilePicture headline role")
				.populate("comments.user", "name profilePicture username headline role");

			res.status(200).json(post);
		} catch (error) {
		console.error("Error in getPostById controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const createComment = async (req, res) => {
	try {
		const postId = req.params.id;
		const { content } = req.body;

		const post = await Post.findByIdAndUpdate(
			postId,
			{
				$push: { comments: { user: req.user._id, content } },
			},
			{ new: true }
		).populate("author", "name email username headline profilePicture");

		if (post.author._id.toString() !== req.user._id.toString()) {
			const newNotification = new Notification({
				recipient: post.author,
				type: "comment",
				relatedUser: req.user._id,
				relatedPost: postId,
			});

			await newNotification.save();

			// send email
            try {
				const postUrl = process.env.CLIENT_URL + "/post/" + postId;
				await sendCommentNotificationEmail(
					post.author.email,
					post.author.name,
					req.user.name,
					postUrl,
					content
				);
			} catch (error) {
				console.log("Error in sending comment notification email:", error);
			}
		}

		res.status(200).json(post);
	} catch (error) {
		console.error("Error in createComment controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const likePost = async (req, res) => {
	try {
		const postId = req.params.id;
		const post = await Post.findById(postId);
		const userId = req.user._id;

		if (post.likes.includes(userId)) {
			// unlike the post
			post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
		} else {
			// like the post
			post.likes.push(userId);
			// create a notification if the post owner is not the user who liked
			if (post.author.toString() !== userId.toString()) {
				const newNotification = new Notification({
					recipient: post.author,
					type: "like",
					relatedUser: userId,
					relatedPost: postId,
				});

				await newNotification.save();
			}
		}

		await post.save();

		res.status(200).json(post);
	} catch (error) {
		console.error("Error in likePost controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const getPostsByUser = async (req, res) => {
	try {
		const { username } = req.params;
		
		// First get the user by username
		const User = await import("../models/user.model.js").then(module => module.default);
		const user = await User.findOne({ username }).select("_id");
		
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const posts = await Post.find({ author: user._id })
			.populate("author", "name username profilePicture headline role")
			.populate("comments.user", "name profilePicture role")
			.sort({ createdAt: -1 });

		res.status(200).json(posts);
	} catch (error) {
		console.error("Error in getPostsByUser controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};
