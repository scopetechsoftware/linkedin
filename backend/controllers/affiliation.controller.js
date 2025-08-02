import Affiliation from "../models/affiliation.model.js";
import User from "../models/user.model.js";

// Create a new affiliation
export const createAffiliation = async (req, res) => {
    try {
        const { affiliatedId, role, startDate, endDate } = req.body;
        const affiliatorId = req.user._id;

        // Validate required fields
        if (!affiliatedId || !role || !startDate) {
            return res.status(400).json({ message: "Affiliated user, role, and start date are required" });
        }

        // Check if the affiliator is a company or university
        if (req.user.role !== "company" && req.user.role !== "university") {
            return res.status(403).json({ message: "Only companies and universities can create affiliations" });
        }

        // Validate role based on affiliator type
        if (req.user.role === "company" && (role !== "employee" && role !== "employer")) {
            return res.status(400).json({ message: "Companies can only affiliate employees or employers" });
        }

        if (req.user.role === "university" && (role !== "student" && role !== "professor")) {
            return res.status(400).json({ message: "Universities can only affiliate students or professors" });
        }

        // Check if the affiliated user exists
        const affiliatedUser = await User.findById(affiliatedId);
        if (!affiliatedUser) {
            return res.status(404).json({ message: "Affiliated user not found" });
        }

        // Create the affiliation
        const newAffiliation = new Affiliation({
            affiliator: affiliatorId,
            affiliated: affiliatedId,
            role,
            startDate,
            endDate: endDate || null,
            isActive: true
        });

        await newAffiliation.save();

        res.status(201).json({ 
            message: "Affiliation created successfully",
            affiliation: newAffiliation
        });
    } catch (error) {
        console.error("Error in createAffiliation:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all affiliations for the logged-in user (as affiliator)
export const getAffiliations = async (req, res) => {
    try {
        const affiliations = await Affiliation.find({ affiliator: req.user._id })
            .populate("affiliated", "name email username profilePicture headline")
            .sort({ startDate: -1 }); // Sort by startDate descending

        res.json(affiliations.map(affiliation => {
            const affiliationObj = affiliation.toObject();
            return {
                ...affiliationObj,
                isActive: affiliation.isActive
            };
        }));
    } catch (error) {
        console.error("Error in getAffiliations:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all affiliations where the logged-in user is affiliated
export const getMyAffiliations = async (req, res) => {
    try {
        const affiliations = await Affiliation.find({ affiliated: req.user._id })
            .populate("affiliator", "name email username profilePicture headline")
            .sort({ startDate: -1 }); // Sort by startDate descending

        res.json(affiliations.map(affiliation => {
            const affiliationObj = affiliation.toObject();
            return {
                ...affiliationObj,
                isActive: affiliation.isActive
            };
        }));
    } catch (error) {
        console.error("Error in getMyAffiliations:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update an affiliation
export const updateAffiliation = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, startDate, endDate, isActive } = req.body;

        // Find the affiliation
        const affiliation = await Affiliation.findById(id);
        if (!affiliation) {
            return res.status(404).json({ message: "Affiliation not found" });
        }

        // Check if the user is the affiliator
        if (affiliation.affiliator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this affiliation" });
        }

        // Update fields
        if (role) affiliation.role = role;
        if (startDate) affiliation.startDate = startDate;
        if (endDate !== undefined) affiliation.endDate = endDate;
        if (isActive !== undefined) affiliation.isActive = isActive;

        await affiliation.save();

        res.json({ message: "Affiliation updated successfully", affiliation });
    } catch (error) {
        console.error("Error in updateAffiliation:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete an affiliation
export const deleteAffiliation = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the affiliation
        const affiliation = await Affiliation.findById(id);
        if (!affiliation) {
            return res.status(404).json({ message: "Affiliation not found" });
        }

        // Check if the user is the affiliator
        if (affiliation.affiliator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this affiliation" });
        }

        await Affiliation.findByIdAndDelete(id);

        res.json({ message: "Affiliation deleted successfully" });
    } catch (error) {
        console.error("Error in deleteAffiliation:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Search users for affiliation
export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { username: { $regex: query, $options: 'i' } }
            ],
            _id: { $ne: req.user._id }, // Exclude the current user
            privacySettings: { $ne: { isProfilePrivate: true } } // Exclude private profiles
        }).select('name email username profilePicture headline location privacySettings').limit(10);

        res.json(users);
    } catch (error) {
        console.error("Error in searchUsers:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get affiliations for a user by username
export const getAffiliationsByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Check if the profile is private and the requester is not the profile owner
        if (user.privacySettings?.isProfilePrivate && req.user._id.toString() !== user._id.toString()) {
            return res.json([]);
        }
        
        // Show all affiliations regardless of active status
        const query = { affiliated: user._id };
        
        const affiliations = await Affiliation.find(query)
            .populate("affiliator", "name email username profilePicture headline")
            .sort({ startDate: -1 });
        res.json(affiliations);
    } catch (error) {
        console.error("Error in getAffiliationsByUsername:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get affiliators for a user by username (organizations that the user is affiliated with)
export const getAffiliatorsByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Check if the profile is private and the requester is not the profile owner
        if (user.privacySettings?.isProfilePrivate && req.user._id.toString() !== user._id.toString()) {
            return res.json([]);
        }
        
        // Show all affiliations regardless of active status
        const query = { affiliated: user._id };
        
        const affiliations = await Affiliation.find(query)
            .populate("affiliator", "name email username profilePicture headline")
            .sort({ startDate: -1 });
        res.json(affiliations);
    } catch (error) {
        console.error("Error in getAffiliatorsByUsername:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get users affiliated with a specific organization by username
export const getAffiliatedUsersByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Check if the profile is private and the requester is not the profile owner
        if (user.privacySettings?.isProfilePrivate && req.user._id.toString() !== user._id.toString()) {
            return res.json([]);
        }
        
        // Show all affiliations regardless of active status
        const query = { affiliator: user._id };
        
        const affiliations = await Affiliation.find(query)
            .populate("affiliated", "name email username profilePicture headline")
            .sort({ startDate: -1 });
        res.json(affiliations);
    } catch (error) {
        console.error("Error in getAffiliatedUsersByUsername:", error);
        res.status(500).json({ message: "Server error" });
    }
};