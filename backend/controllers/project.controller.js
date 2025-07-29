import Project from "../models/project.model.js";

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
		if (req.files && req.files.length > 0) {
			const uploadedFiles = [];
			for (const file of req.files) {
				uploadedFiles.push({
					name: file.originalname,
					path: file.path.replace(/.*uploads[\\/]/, ''), // relative to uploads/
					type: file.mimetype,
					size: file.size,
				});
			}
			newProject.files = uploadedFiles;
		}

		// Save the project
		await newProject.save();
		
		res.status(201).json(newProject);
	} catch (error) {
		console.error("Error creating project:", error);
		res.status(500).json({ message: "Server error" });
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
		.sort({ createdAt: -1 });
		
		res.json(projects);
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
				uploadedFiles.push({
					name: file.originalname,
					path: file.path.replace(/.*uploads[\\/]/, ''), // relative to uploads/
					type: file.mimetype,
					size: file.size,
				});
			}
			project.files = [...(project.files || []), ...uploadedFiles];
		}
		
		// Save the updated project
		await project.save();
		
		res.json(project);
	} catch (error) {
		console.error("Error updating project:", error);
		res.status(500).json({ message: "Server error" });
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