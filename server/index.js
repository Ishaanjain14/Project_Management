import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import seed from "./seed.js";

// Route imports
import authRoutes from "./routes/auth.js";
import workspaceRoutes from "./routes/workspaces.js";
import projectRoutes from "./routes/projects.js";
import taskRoutes from "./routes/tasks.js";
import activityRoutes from "./routes/activities.js";

const app = express();
const httpServer = createServer(app);

// Allowed origins — includes deployed frontend via CLIENT_URL env var
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://rococo-taffy-d511ed.netlify.app",
    process.env.CLIENT_URL,
].filter(Boolean);

// Socket.IO setup
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
    },
});

// Make io available in routes
app.set("io", io);

// Middleware
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express.json());
app.use(morgan("dev"));

// Static files for uploads
app.use("/uploads", express.static("uploads"));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/activities", activityRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("join-workspace", (workspaceId) => {
        socket.join(`workspace:${workspaceId}`);
    });

    socket.on("join-project", (projectId) => {
        socket.join(`project:${projectId}`);
    });

    socket.on("join-task", (taskId) => {
        socket.join(`task:${taskId}`);
    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Connect to DB and start server
const PORT = process.env.PORT || 5001;

connectDB().then(async () => {
    // Check if db is empty, if so seed it
    const userCount = await User.countDocuments();
    if (userCount === 0) {
        console.log("Database is empty, running seed script...");
        await seed(false); // run without disconnecting
    }

    httpServer.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    });
});

export { io };
