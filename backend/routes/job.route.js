import express from "express";
import { createJob, getJobs, getJobById, getJobsByUser } from "../controllers/job.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create a job posting (protected)
router.post("/", protectRoute, createJob);

// Get all job postings
router.get("/", getJobs);

// Get jobs by user
router.get("/user/:username", getJobsByUser);

// Get a single job posting by ID
router.get("/:id", getJobById);

export default router; 