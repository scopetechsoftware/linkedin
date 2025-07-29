import mongoose from "mongoose";

const projectRatingSchema = new mongoose.Schema(
	{
		project: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Project",
			required: true,
		},
		recipient: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		rating: {
			type: Number,
			min: 1,
			max: 5,
			required: true,
		},
		comment: {
			type: String,
			default: "",
		},
	},
	{ timestamps: true }
);

const ProjectRating = mongoose.model("ProjectRating", projectRatingSchema);

export default ProjectRating;