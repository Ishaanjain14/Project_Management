import express from "express";
import Activity from "../models/Activity.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/activities?workspace=:workspaceId — Get activities for a workspace
router.get("/", protect, async (req, res) => {
    try {
        const { workspace, project, limit = 20 } = req.query;

        const filter = {};
        if (workspace) filter.workspace = workspace;
        if (project) filter.project = project;

        const activities = await Activity.find(filter)
            .populate("user", "name email image")
            .populate("project", "name")
            .populate("task", "title")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
