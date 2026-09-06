import express from "express";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import Comment from "../models/Comment.js";
import Activity from "../models/Activity.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// POST /api/tasks — Create a task
router.post("/", protect, async (req, res) => {
    try {
        const {
            project: projectId, title, description,
            type, status, priority, assignee, due_date,
        } = req.body;

        if (!title || !projectId) {
            return res.status(400).json({ message: "Title and project are required" });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const task = await Task.create({
            project: projectId,
            title,
            description: description || "",
            type: type || "TASK",
            status: status || "TODO",
            priority: priority || "MEDIUM",
            assignee: assignee || null,
            due_date: due_date || null,
        });

        await Activity.create({
            workspace: project.workspace,
            project: projectId,
            task: task._id,
            user: req.user._id,
            action: "TASK_CREATED",
            description: `${req.user.name} created task "${title}"`,
        });

        const populated = await Task.findById(task._id)
            .populate("assignee", "name email image");

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/tasks/:id — Update a task
router.put("/:id", protect, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const project = await Project.findById(task.project);
        const oldStatus = task.status;
        const oldApproval = task.approval_status;

        const allowedFields = [
            "title", "description", "type", "status",
            "priority", "assignee", "due_date",
            "approval_status", "approved_by",
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                task[field] = req.body[field];
            }
        });

        await task.save();

        // Log status change
        if (req.body.status && req.body.status !== oldStatus) {
            await Activity.create({
                workspace: project.workspace,
                project: task.project,
                task: task._id,
                user: req.user._id,
                action: "TASK_STATUS_CHANGED",
                description: `${req.user.name} changed task "${task.title}" from ${oldStatus} to ${req.body.status}`,
                metadata: { oldStatus, newStatus: req.body.status },
            });
        } else if (req.body.approval_status && req.body.approval_status !== oldApproval) {
            await Activity.create({
                workspace: project.workspace,
                project: task.project,
                task: task._id,
                user: req.user._id,
                action: "TASK_APPROVAL_CHANGED",
                description: `${req.user.name} changed task "${task.title}" approval to ${req.body.approval_status}`,
                metadata: { oldApproval, newApproval: req.body.approval_status },
            });
        } else {
            await Activity.create({
                workspace: project.workspace,
                project: task.project,
                task: task._id,
                user: req.user._id,
                action: "TASK_UPDATED",
                description: `${req.user.name} updated task "${task.title}"`,
            });
        }

        const populated = await Task.findById(task._id)
            .populate("assignee", "name email image");

        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/tasks/:id — Delete a task
router.delete("/:id", protect, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const project = await Project.findById(task.project);

        await Activity.create({
            workspace: project.workspace,
            project: task.project,
            task: task._id,
            user: req.user._id,
            action: "TASK_DELETED",
            description: `${req.user.name} deleted task "${task.title}"`,
        });

        // Delete associated comments
        await Comment.deleteMany({ task: task._id });
        await Task.findByIdAndDelete(req.params.id);

        res.json({ message: "Task deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/tasks/bulk/delete — Bulk delete tasks
router.post("/bulk/delete", protect, async (req, res) => {
    try {
        const { taskIds } = req.body;
        if (!taskIds || !Array.isArray(taskIds)) {
            return res.status(400).json({ message: "Task IDs array is required" });
        }

        await Comment.deleteMany({ task: { $in: taskIds } });
        await Task.deleteMany({ _id: { $in: taskIds } });

        res.json({ message: `${taskIds.length} tasks deleted` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/tasks/:id/comments — Get comments for a task
router.get("/:id/comments", protect, async (req, res) => {
    try {
        const comments = await Comment.find({ task: req.params.id })
            .populate("user", "name email image")
            .sort({ createdAt: 1 });

        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/tasks/:id/comments — Add comment to a task
router.post("/:id/comments", protect, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ message: "Comment content is required" });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const project = await Project.findById(task.project);

        const comment = await Comment.create({
            task: req.params.id,
            user: req.user._id,
            content,
        });

        await Activity.create({
            workspace: project.workspace,
            project: task.project,
            task: task._id,
            user: req.user._id,
            action: "COMMENT_ADDED",
            description: `${req.user.name} commented on task "${task.title}"`,
        });

        const populated = await Comment.findById(comment._id)
            .populate("user", "name email image");

        // Broadcast to clients in this task room
        const io = req.app.get("io");
        if (io) {
            io.to(`task:${task._id}`).emit("new-comment", populated);
        }

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/tasks/:id/attachments — Add attachment to a task
router.post("/:id/attachments", protect, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const project = await Project.findById(task.project);

        const attachment = {
            name: req.file.originalname,
            url: `/uploads/${req.file.filename}`,
            size: req.file.size,
            uploaded_by: req.user._id,
        };

        task.attachments.push(attachment);
        await task.save();

        await Activity.create({
            workspace: project.workspace,
            project: task.project,
            task: task._id,
            user: req.user._id,
            action: "FILE_UPLOADED",
            description: `${req.user.name} uploaded a file to task "${task.title}"`,
        });

        const populated = await Task.findById(task._id).populate("assignee", "name email image");
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
