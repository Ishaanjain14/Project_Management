import express from "express";
import Project from "../models/Project.js";
import Workspace from "../models/Workspace.js";
import Task from "../models/Task.js";
import Activity from "../models/Activity.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/projects?workspace=:workspaceId — Get all projects in a workspace
router.get("/", protect, async (req, res) => {
    try {
        const { workspace } = req.query;
        if (!workspace) {
            return res.status(400).json({ message: "Workspace ID is required" });
        }

        const projects = await Project.find({ workspace })
            .populate("team_lead", "name email image")
            .populate("members.user", "name email image")
            .sort({ createdAt: -1 });

        // Attach task counts to each project
        const projectsWithTasks = await Promise.all(
            projects.map(async (project) => {
                const tasks = await Task.find({ project: project._id })
                    .populate("assignee", "name email image");
                return { ...project.toObject(), tasks };
            })
        );

        res.json(projectsWithTasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/projects — Create a project
router.post("/", protect, async (req, res) => {
    try {
        const {
            name, description, priority, status,
            start_date, end_date, workspace, team_members,
        } = req.body;

        if (!name || !workspace) {
            return res.status(400).json({ message: "Project name and workspace are required" });
        }

        // Verify workspace membership
        const ws = await Workspace.findById(workspace);
        if (!ws) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const isMember = ws.members.some(
            (m) => m.user.toString() === req.user._id.toString()
        );
        if (!isMember) {
            return res.status(403).json({ message: "Not a member of this workspace" });
        }

        // Build members array
        const members = [{ user: req.user._id }];
        if (team_members && Array.isArray(team_members)) {
            team_members.forEach((userId) => {
                if (userId !== req.user._id.toString()) {
                    members.push({ user: userId });
                }
            });
        }

        const project = await Project.create({
            name,
            description: description || "",
            priority: priority || "MEDIUM",
            status: status || "PLANNING",
            start_date: start_date || null,
            end_date: end_date || null,
            team_lead: req.user._id,
            workspace,
            members,
        });

        // Log activity
        await Activity.create({
            workspace,
            project: project._id,
            user: req.user._id,
            action: "PROJECT_CREATED",
            description: `${req.user.name} created project "${name}"`,
        });

        const populated = await Project.findById(project._id)
            .populate("team_lead", "name email image")
            .populate("members.user", "name email image");

        res.status(201).json({ ...populated.toObject(), tasks: [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/projects/:id — Get a single project with tasks
router.get("/:id", protect, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate("team_lead", "name email image")
            .populate("members.user", "name email image");

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const tasks = await Task.find({ project: project._id })
            .populate("assignee", "name email image")
            .sort({ createdAt: -1 });

        res.json({ ...project.toObject(), tasks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/projects/:id — Update a project
router.put("/:id", protect, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const allowedFields = [
            "name", "description", "priority", "status",
            "start_date", "end_date", "progress",
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                project[field] = req.body[field];
            }
        });

        await project.save();

        // Log activity
        await Activity.create({
            workspace: project.workspace,
            project: project._id,
            user: req.user._id,
            action: "PROJECT_UPDATED",
            description: `${req.user.name} updated project "${project.name}"`,
        });

        const populated = await Project.findById(project._id)
            .populate("team_lead", "name email image")
            .populate("members.user", "name email image");

        const tasks = await Task.find({ project: project._id })
            .populate("assignee", "name email image");

        res.json({ ...populated.toObject(), tasks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/projects/:id/members — Add member to project
router.post("/:id/members", protect, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const alreadyMember = project.members.some(
            (m) => m.user.toString() === userId
        );
        if (alreadyMember) {
            return res.status(400).json({ message: "User is already a project member" });
        }

        project.members.push({ user: userId });
        await project.save();

        await Activity.create({
            workspace: project.workspace,
            project: project._id,
            user: req.user._id,
            action: "MEMBER_ADDED",
            description: `${req.user.name} added a member to project "${project.name}"`,
        });

        const populated = await Project.findById(project._id)
            .populate("team_lead", "name email image")
            .populate("members.user", "name email image");

        const tasks = await Task.find({ project: project._id })
            .populate("assignee", "name email image");

        res.json({ ...populated.toObject(), tasks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/projects/:id/milestones — Add milestone
router.post("/:id/milestones", protect, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const { title, description, due_date } = req.body;
        if (!title) {
            return res.status(400).json({ message: "Milestone title is required" });
        }

        project.milestones.push({ title, description, due_date });
        await project.save();

        await Activity.create({
            workspace: project.workspace,
            project: project._id,
            user: req.user._id,
            action: "MILESTONE_CREATED",
            description: `${req.user.name} added milestone "${title}" to project "${project.name}"`,
        });

        const populated = await Project.findById(project._id)
            .populate("team_lead", "name email image")
            .populate("members.user", "name email image");

        const tasks = await Task.find({ project: project._id })
            .populate("assignee", "name email image");

        res.json({ ...populated.toObject(), tasks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/projects/:id/milestones/:milestoneId — Update milestone
router.put("/:id/milestones/:milestoneId", protect, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const milestone = project.milestones.id(req.params.milestoneId);
        if (!milestone) {
            return res.status(404).json({ message: "Milestone not found" });
        }

        const { title, description, due_date, status } = req.body;
        if (title) milestone.title = title;
        if (description !== undefined) milestone.description = description;
        if (due_date) milestone.due_date = due_date;
        if (status) {
            milestone.status = status;
            if (status === "COMPLETED") milestone.completed_at = new Date();
        }

        await project.save();

        if (status === "COMPLETED") {
            await Activity.create({
                workspace: project.workspace,
                project: project._id,
                user: req.user._id,
                action: "MILESTONE_COMPLETED",
                description: `${req.user.name} completed milestone "${milestone.title}"`,
            });
        }

        const populated = await Project.findById(project._id)
            .populate("team_lead", "name email image")
            .populate("members.user", "name email image");

        const tasks = await Task.find({ project: project._id })
            .populate("assignee", "name email image");

        res.json({ ...populated.toObject(), tasks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
