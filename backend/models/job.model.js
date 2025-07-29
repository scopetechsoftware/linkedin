import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    package: { type: String, required: true },
    type: { type: String, enum: ["freelancer", "fulltime", "partime"], required: true },
    description: { type: String, required: true },
    skill: { type: String, required: true },
    technology: { type: String, required: true },
    location: { type: String, required: true },
    outDate: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", jobSchema);
export default Job; 