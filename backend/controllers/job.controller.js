import Job from "../models/job.model.js";

// Create a new job posting
export const createJob = async (req, res) => {
  try {
    const { title, package: pkg, type, description, skill, technology, location, outDate } = req.body;
    if (!title || !pkg || !type || !description || !skill || !technology || !location || !outDate) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (isNaN(Date.parse(outDate))) {
        return res.status(400).json({ message: "Invalid out date" });
      }
    const job = new Job({
        title,
        package: pkg,
        type,
        description,
        skill,
        technology,
        location,
        outDate,
      });
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all job postings
export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate("createdBy", "name username profilePicture").sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single job posting by ID
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("createdBy", "name username profilePicture");
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ message: "Server error" });
  }
}; 