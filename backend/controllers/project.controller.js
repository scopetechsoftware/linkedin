import Project from "../models/project.model.js";
import ProjectRating from "../models/projectRating.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

// Create a new project
export const createProject = async (req, res) => {
	try {
		const { name, description, gitlink, projecturl, type, collaborators } = req.body;
		
		// Create a new project
		const newProject = new Project({
			name,
			description,
			gitlink,
			projecturl,
			type,
			owner: req.user._id,
			collaborators: collaborators ? JSON.parse(collaborators) : [],
		});

		// Handle file uploads if any (using multer)
		// If req.body.files is a stringified array, parse it safely
if (req.body.files) {
  try {
    const parsedFiles = JSON.parse(req.body.files);
    if (Array.isArray(parsedFiles)) {
      newProject.files = parsedFiles;
    }
  } catch (err) {
    console.error("Error parsing files:", err);
  }
}


		// Save the project
		await newProject.save();
		
		res.status(201).json(newProject);
	} catch (error) {
		console.error("Error creating project:", error);
		res.status(500).json({ message: error.message || "Server error" });
	}
};

// Get all projects for the current user
export const getUserProjects = async (req, res) => {
	try {
		const projects = await Project.find({
			$or: [
				{ owner: req.user._id },
				{ collaborators: req.user._id },
			],
		})
		.populate("owner", "name username profilePicture")
		.populate("collaborators", "name username profilePicture")
		.sort({ createdAt: -1 })
		.lean();

		// For each project, calculate average rating
		const projectsWithRatings = await Promise.all(projects.map(async (project) => {
			const ratings = await ProjectRating.find({ project: project._id });
			const avg = ratings.length
				? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
				: 0;
			return { ...project, averageRating: avg };
		}));

		res.json(projectsWithRatings);
	} catch (error) {
		console.error("Error getting user projects:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Get a specific project by ID
export const getProjectById = async (req, res) => {
	try {
		const project = await Project.findById(req.params.id)
			.populate("owner", "name username profilePicture")
			.populate("collaborators", "name username profilePicture");
		
		if (!project) {
			return res.status(404).json({ message: "Project not found" });
		}
		
		// Check if user is owner or collaborator
		const isAuthorized = 
			project.owner._id.toString() === req.user._id.toString() ||
			project.collaborators.some(collab => collab._id.toString() === req.user._id.toString());
		
		if (!isAuthorized) {
			return res.status(403).json({ message: "Not authorized to view this project" });
		}
		
		res.json(project);
	} catch (error) {
		console.error("Error getting project:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Update a project
export const updateProject = async (req, res) => {
	try {
		const project = await Project.findById(req.params.id);
		
		if (!project) {
			return res.status(404).json({ message: "Project not found" });
		}
		
		// Check if user is the owner
		if (project.owner.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Not authorized to update this project" });
		}
		
		const { name, description, gitlink, projecturl, type, collaborators } = req.body;
		
		// Update project fields
		if (name) project.name = name;
		if (description) project.description = description;
		if (gitlink) project.gitlink = gitlink;
		if (projecturl) project.projecturl = projecturl;
		if (type) project.type = type;
		if (collaborators) project.collaborators = collaborators ? JSON.parse(collaborators) : project.collaborators;
		
		// Handle file uploads if any (using multer)
		if (req.files && req.files.length > 0) {
			const uploadedFiles = [];
			for (const file of req.files) {
				try {
					uploadedFiles.push({
						name: file.originalname,
						path: file.path.replace(/.*uploads[\\/]/, ''), // relative to uploads/
						type: file.mimetype,
						size: file.size,
					});
				} catch (fileError) {
					console.error("Error processing file:", fileError, file);
					// Continue with other files even if one fails
				}
			}
			project.files = [...(project.files || []), ...uploadedFiles];
		}
		
		// Save the updated project
		await project.save();
		
		res.json(project);
	} catch (error) {
		console.error("Error updating project:", error);
		res.status(500).json({ message: error.message || "Server error" });
	}
};

// Delete a project
export const deleteProject = async (req, res) => {
	try {
		const project = await Project.findById(req.params.id);
		
		if (!project) {
			return res.status(404).json({ message: "Project not found" });
		}
		
		// Check if user is the owner
		if (project.owner.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Not authorized to delete this project" });
		}
		
		// Optionally, delete files from disk here if you want
		// (not implemented)
		
		// Delete the project
		await Project.findByIdAndDelete(req.params.id);
		
		res.json({ message: "Project deleted successfully" });
	} catch (error) {
		console.error("Error deleting project:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Rate a project
export const rateProject = async (req, res) => {
	try {
		const { rating, comment } = req.body;
		const projectId = req.params.id;
		const userId = req.user._id;

		// Validate rating
		if (!rating || rating < 1 || rating > 5) {
			return res.status(400).json({ message: "Rating must be between 1 and 5" });
		}

		// Find the project
		const project = await Project.findById(projectId);
		if (!project) {
			return res.status(404).json({ message: "Project not found" });
		}

		// Check if user is not the owner (can't rate your own project)
		if (project.owner.toString() === userId.toString()) {
			return res.status(400).json({ message: "You cannot rate your own project" });
		}

		// Check if user has already rated this project
		const existingRating = await ProjectRating.findOne({
			project: projectId,
			recipient: project.owner,
			sender: userId
		});

		if (existingRating) {
			// Update existing rating
			existingRating.rating = rating;
			existingRating.comment = comment || existingRating.comment;
			await existingRating.save();

			// Create notification for updated rating
			const notification = new Notification({
				recipient: project.owner,
				type: "projectRated",
				relatedUser: userId,
				relatedProject: projectId,
				rating,
				comment
			});
			await notification.save();

			return res.status(200).json(existingRating);
		}

		// Create new rating
		const newRating = new ProjectRating({
			project: projectId,
			recipient: project.owner,
			sender: userId,
			rating,
			comment: comment || ""
		});

		await newRating.save();

		// Create notification
		const notification = new Notification({
			recipient: project.owner,
			type: "projectRated",
			relatedUser: userId,
			relatedProject: projectId,
			rating,
			comment
		});
		await notification.save();

		res.status(201).json(newRating);
	} catch (error) {
		console.error("Error rating project:", error);
		res.status(500).json({ message: "Server error" });
	}
};



// Get overall average rating for current user's projects
export const getOverallProjectRating = async (req, res) => {
	try {
		const projects = await Project.find({ owner: req.user._id });

		const allRatings = await ProjectRating.find({
			project: { $in: projects.map(p => p._id) }
		});

		const totalRatings = allRatings.length;
		const avgRating = totalRatings
			? allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
			: 0;

			res.json({ average: Number(avgRating.toFixed(2)) });

	} catch (error) {
		console.error("Error calculating overall rating:", error);
		res.status(500).json({ message: "Server error" });
	}
};


// Get project ratings
export const getProjectRatings = async (req, res) => {
	try {
		const ratings = await ProjectRating.find({ project: req.params.id })
			.populate('sender', 'name profilePicture username');
		res.json(ratings);
	} catch (err) {
		res.status(500).json({ message: 'Failed to fetch ratings' });
	}
};

// Get projects by username
export const getProjectsByUsername = async (req, res) => {
	try {
		// Find the user by username
		const user = await User.findOne({ username: req.params.username });
		
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		
		// Check if the profile is private and the requester is not the profile owner
		if (user.privacySettings?.isProfilePrivate && 
			(!req.user || req.user._id.toString() !== user._id.toString())) {
			return res.json([]);
		}
		
		// Find projects where the user is the owner
		const projects = await Project.find({ owner: user._id })
			.populate("owner", "name username profilePicture")
			.populate("collaborators", "name username profilePicture")
			.sort({ createdAt: -1 })
			.lean();

		// For each project, calculate average rating
		const projectsWithRatings = await Promise.all(projects.map(async (project) => {
			const ratings = await ProjectRating.find({ project: project._id });
			const avg = ratings.length
				? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
				: 0;
			return { ...project, averageRating: avg };
		}));

		res.json(projectsWithRatings);
	} catch (error) {
		console.error("Error getting projects by username:", error);
		res.status(500).json({ message: "Server error" });
	}
};