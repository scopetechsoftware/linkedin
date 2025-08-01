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
			.select("name username profilePicture headline location privacySettings")
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

		// Check if the profile is private and the requester is not the profile owner
		if (user.privacySettings?.isProfilePrivate && req.user._id.toString() !== user._id.toString()) {
			// Return only basic information for private profiles
			const limitedProfile = {
				_id: user._id,
				name: user.name,
				username: user.username,
				profilePicture: user.profilePicture,
				location: user.location,
				privacySettings: { isProfilePrivate: true }
			};
			return res.json(limitedProfile);
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
			"role",
			"skills",
			"experience",
			"education",
			"privacySettings",
		];

		const updatedData = {};

		for (const field of allowedFields) {
			if (req.body[field] !== undefined) {
				// Parse JSON strings for array fields or objects
				if (field === 'skills' || field === 'experience' || field === 'education' || field === 'privacySettings') {
					try {
						// Special handling for privacySettings to ensure it's properly parsed
						if (field === 'privacySettings') {
							if (typeof req.body[field] === 'string') {
								// Check if it's the '[object Object]' string representation
								if (req.body[field] === '[object Object]') {
									// Default to an object with isProfilePrivate set to the value in the request or false
									updatedData[field] = { isProfilePrivate: req.body.isProfilePrivate === 'true' || false };
								} else {
									// Try to parse it as JSON
									try {
										updatedData[field] = JSON.parse(req.body[field]);
									} catch (e) {
										console.error(`Error parsing ${field}:`, e);
										// Default to an object with isProfilePrivate set to false
										updatedData[field] = { isProfilePrivate: false };
									}
								}
							} else {
								// It's already an object
								updatedData[field] = req.body[field];
							}
						} else {
							// For other fields, use the existing logic
							updatedData[field] = typeof req.body[field] === 'string' ? 
								JSON.parse(req.body[field]) : req.body[field];
						}
					} catch (e) {
						console.error(`Error parsing ${field}:`, e);
						updatedData[field] = req.body[field];
					}
				} else {
					updatedData[field] = req.body[field];
				}
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
