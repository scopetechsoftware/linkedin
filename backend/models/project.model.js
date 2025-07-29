import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			default: "",
		},
		gitlink: {
			type: String,
			default: "",
		},
		projecturl: {
			type: String,
			default: "",
		},
		type: {
			type: String,
			enum: ["academic", "freelancing", "volunteer", "work"],
			default: "academic",
		},
		files: [
			{
				name: String,
				path: String,
				type: String,
				size: Number,
			},
		],
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		collaborators: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
	},
	{ timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;