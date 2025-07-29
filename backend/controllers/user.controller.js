import User from "../models/user.model.js"

export const getSuggestedConnections = async (req, res) => {
	try {
		const currentUser = await User.findById(req.user._id).select("connections");

		const search = req.query.search || "";
		const suggestedUser = await User.find({
			_id: { $ne: req.user._id },
			$or: [
				{ name: { $regex: search, $options: "i" } },
				{ email: { $regex: search, $options: "i" } }
			]
		})
			.select("name username profilePicture headline")
			.limit(10);

		res.json(suggestedUser);
	} catch (error) {
		console.error("Error in getSuggestedConnections controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const getPublicProfile = async (req, res) => {
	try {
		const user = await User.findOne({ username: req.params.username }).select("-password");

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.json(user);
	} catch (error) {
		console.error("Error in getPublicProfile controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const updateProfile = async (req, res) => {
	try {
		const allowedFields = [
			"name",
			"username",
			"headline",
			"about",
			"location",
			"skills",
			"experience",
			"education",
		];

		const updatedData = {};

		for (const field of allowedFields) {
			if (req.body[field]) {
				updatedData[field] = req.body[field];
			}
		}

		// Handle file uploads using multer
		if (req.files) {
			// Handle profile picture upload
			if (req.files.profilePicture && req.files.profilePicture.length > 0) {
				const profilePicture = req.files.profilePicture[0];
				updatedData.profilePicture = profilePicture.path.replace(/.*uploads[\\/]/, '');
			}

			// Handle banner image upload
			if (req.files.bannerImg && req.files.bannerImg.length > 0) {
				const bannerImg = req.files.bannerImg[0];
				updatedData.bannerImg = bannerImg.path.replace(/.*uploads[\\/]/, '');
			}
		}

		const user = await User.findByIdAndUpdate(req.user._id, { $set: updatedData }, { new: true }).select(
			"-password"
		);

		res.json(user);
	} catch (error) {
		console.error("Error in updateProfile controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};
