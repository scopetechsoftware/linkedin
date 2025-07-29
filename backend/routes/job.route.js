import express from "express";
import { createJob, getJobs, getJobById } from "../controllers/job.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create a job posting (unprotected)
router.post("/", createJob);

// Get all job postings
router.get("/", getJobs);

// Get a single job posting by ID
router.get("/:id", getJobById);

export default router; 