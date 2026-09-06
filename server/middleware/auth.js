import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protect routes — require valid JWT
export const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization?.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Not authorized, invalid token" });
    }
};

// Generate JWT token
export const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
};

// Check workspace role
export const requireWorkspaceRole = (...roles) => {
    return (req, res, next) => {
        const { workspace } = req;
        if (!workspace) {
            return res.status(400).json({ message: "Workspace not found in request" });
        }

        const member = workspace.members.find(
            (m) => m.user.toString() === req.user._id.toString()
        );

        if (!member) {
            return res.status(403).json({ message: "You are not a member of this workspace" });
        }

        if (roles.length > 0 && !roles.includes(member.role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        req.workspaceRole = member.role;
        next();
    };
};
