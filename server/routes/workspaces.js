import express from "express";
import Workspace from "../models/Workspace.js";
import User from "../models/User.js";
import Activity from "../models/Activity.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/workspaces — Get all workspaces for current user
router.get("/", protect, async (req, res) => {
    try {
        const workspaces = await Workspace.find({
            "members.user": req.user._id,
        })
            .populate("owner", "name email image")
            .populate("members.user", "name email image");

        res.json(workspaces);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/workspaces — Create a workspace
router.post("/", protect, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Workspace name is required" });
        }

        const workspace = await Workspace.create({
            name,
            description: description || "",
            owner: req.user._id,
            members: [{ user: req.user._id, role: "ADMIN" }],
        });

        const populated = await Workspace.findById(workspace._id)
            .populate("owner", "name email image")
            .populate("members.user", "name email image");

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/workspaces/:id — Get a single workspace
router.get("/:id", protect, async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id)
            .populate("owner", "name email image")
            .populate("members.user", "name email image");

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const isMember = workspace.members.some(
            (m) => m.user._id.toString() === req.user._id.toString()
        );
        if (!isMember) {
            return res.status(403).json({ message: "Not a member of this workspace" });
        }

        res.json(workspace);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/workspaces/:id — Update workspace
router.put("/:id", protect, async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const member = workspace.members.find(
            (m) => m.user.toString() === req.user._id.toString()
        );
        if (!member || member.role !== "ADMIN") {
            return res.status(403).json({ message: "Admin access required" });
        }

        const { name, description } = req.body;
        if (name) workspace.name = name;
        if (description !== undefined) workspace.description = description;

        await workspace.save();

        const populated = await Workspace.findById(workspace._id)
            .populate("owner", "name email image")
            .populate("members.user", "name email image");

        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/workspaces/:id — Delete workspace (admin only)
router.delete("/:id", protect, async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        if (workspace.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only workspace owner can delete" });
        }

        await Workspace.findByIdAndDelete(req.params.id);
        res.json({ message: "Workspace deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/workspaces/:id/members — Invite member to workspace
router.post("/:id/members", protect, async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const member = workspace.members.find(
            (m) => m.user.toString() === req.user._id.toString()
        );
        if (!member || member.role !== "ADMIN") {
            return res.status(403).json({ message: "Admin access required" });
        }

        const { email, role } = req.body;
        const invitedUser = await User.findOne({ email });
        if (!invitedUser) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        const alreadyMember = workspace.members.some(
            (m) => m.user.toString() === invitedUser._id.toString()
        );
        if (alreadyMember) {
            return res.status(400).json({ message: "User is already a member" });
        }

        workspace.members.push({
            user: invitedUser._id,
            role: role === "ADMIN" ? "ADMIN" : "MEMBER",
        });
        await workspace.save();

        // Log activity
        await Activity.create({
            workspace: workspace._id,
            user: req.user._id,
            action: "MEMBER_ADDED",
            description: `${req.user.name} added ${invitedUser.name} to workspace`,
            metadata: { addedUserId: invitedUser._id, role: role || "MEMBER" },
        });

        const populated = await Workspace.findById(workspace._id)
            .populate("owner", "name email image")
            .populate("members.user", "name email image");

        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
