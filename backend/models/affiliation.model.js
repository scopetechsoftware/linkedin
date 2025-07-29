import mongoose from "mongoose";

const affiliationSchema = new mongoose.Schema(
	{
		affiliator: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		affiliated: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		role: {
			type: String,
			enum: ["student", "professor", "employee", "employer"],
			required: true,
		},
		startDate: {
			type: Date,
			required: true,
		},
		endDate: {
			type: Date,
			required: false,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

const Affiliation = mongoose.model("Affiliation", affiliationSchema);

export default Affiliation;