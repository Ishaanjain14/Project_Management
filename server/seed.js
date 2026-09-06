import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Workspace from "./models/Workspace.js";
import Project from "./models/Project.js";
import Task from "./models/Task.js";
import Activity from "./models/Activity.js";
import Comment from "./models/Comment.js";

const seed = async (disconnect = true) => {
    // Only connect if mongoose is not connected
    if (mongoose.connection.readyState !== 1) {
        await connectDB();
    }

    // Clear existing data
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Activity.deleteMany({});
    await Comment.deleteMany({});

    console.log("Cleared existing data");

    // Create users
    const users = await User.create([
        { name: "Alex Smith", email: "alex@projecthub.com", password: "password123", image: "" },
        { name: "John Warrel", email: "john@projecthub.com", password: "password123", image: "" },
        { name: "Oliver Watts", email: "oliver@projecthub.com", password: "password123", image: "" },
    ]);

    console.log(`Created ${users.length} users`);

    // Create workspaces
    const ws1 = await Workspace.create({
        name: "Corp Workspace",
        description: "Main corporate workspace for product development",
        owner: users[2]._id,
        members: [
            { user: users[0]._id, role: "ADMIN" },
            { user: users[1]._id, role: "MEMBER" },
            { user: users[2]._id, role: "ADMIN" },
        ],
    });

    const ws2 = await Workspace.create({
        name: "Cloud Ops Hub",
        description: "Infrastructure and DevOps workspace",
        owner: users[2]._id,
        members: [
            { user: users[2]._id, role: "ADMIN" },
            { user: users[0]._id, role: "ADMIN" },
            { user: users[1]._id, role: "MEMBER" },
        ],
    });

    console.log("Created 2 workspaces");

    // Create projects for Workspace 1
    const project1 = await Project.create({
        name: "LaunchPad CRM",
        description: "A next-gen CRM for startups to manage customer pipelines, analytics, and automation.",
        priority: "HIGH",
        status: "ACTIVE",
        start_date: new Date("2025-10-10"),
        end_date: new Date("2026-02-28"),
        team_lead: users[2]._id,
        workspace: ws1._id,
        progress: 65,
        members: [
            { user: users[0]._id },
            { user: users[1]._id },
            { user: users[2]._id },
        ],
        milestones: [
            { title: "Design Phase Complete", description: "All UI/UX designs approved", due_date: new Date("2025-11-15"), status: "COMPLETED", completed_at: new Date("2025-11-12") },
            { title: "MVP Release", description: "Core features ready for testing", due_date: new Date("2026-01-15"), status: "IN_PROGRESS" },
            { title: "Production Launch", description: "Full production deployment", due_date: new Date("2026-02-28"), status: "PENDING" },
        ],
    });

    const project2 = await Project.create({
        name: "Brand Identity Overhaul",
        description: "Rebranding client products with cohesive color palettes and typography systems.",
        priority: "MEDIUM",
        status: "PLANNING",
        start_date: new Date("2025-10-18"),
        end_date: new Date("2026-03-10"),
        team_lead: users[2]._id,
        workspace: ws1._id,
        progress: 25,
        members: [
            { user: users[0]._id },
            { user: users[1]._id },
            { user: users[2]._id },
        ],
        milestones: [
            { title: "Research & Discovery", description: "Market analysis and brand audit", due_date: new Date("2025-11-30"), status: "IN_PROGRESS" },
            { title: "Design Deliverables", description: "Final brand guidelines document", due_date: new Date("2026-02-15"), status: "PENDING" },
        ],
    });

    // Create projects for Workspace 2
    const project3 = await Project.create({
        name: "Kubernetes Migration",
        description: "Migrate the monolithic app infrastructure to Kubernetes for scalability.",
        priority: "HIGH",
        status: "ACTIVE",
        start_date: new Date("2025-10-15"),
        end_date: new Date("2026-01-20"),
        team_lead: users[2]._id,
        workspace: ws2._id,
        progress: 0,
        members: [
            { user: users[2]._id },
            { user: users[0]._id },
            { user: users[1]._id },
        ],
        milestones: [
            { title: "Infrastructure Setup", description: "EKS cluster provisioned and configured", due_date: new Date("2025-11-30"), status: "PENDING" },
            { title: "Migration Complete", description: "All services running on K8s", due_date: new Date("2026-01-15"), status: "PENDING" },
        ],
    });

    const project4 = await Project.create({
        name: "Automated Regression Suite",
        description: "Selenium + Playwright hybrid test framework for regression testing.",
        priority: "MEDIUM",
        status: "ACTIVE",
        start_date: new Date("2025-10-03"),
        end_date: new Date("2025-10-15"),
        team_lead: users[2]._id,
        workspace: ws2._id,
        progress: 0,
        members: [
            { user: users[2]._id },
            { user: users[0]._id },
            { user: users[1]._id },
        ],
    });

    console.log("Created 4 projects");

    // Create tasks
    const tasks = await Task.create([
        // Project 1 tasks
        { project: project1._id, title: "Design Dashboard UI", description: "Create a modern, responsive CRM dashboard layout.", status: "IN_PROGRESS", type: "FEATURE", priority: "HIGH", assignee: users[0]._id, due_date: new Date("2025-10-31") },
        { project: project1._id, title: "Integrate Email API", description: "Set up SendGrid integration for email campaigns.", status: "TODO", type: "TASK", priority: "MEDIUM", assignee: users[1]._id, due_date: new Date("2025-11-30") },
        { project: project1._id, title: "Fix Duplicate Contact Bug", description: "Duplicate records appear when importing CSV files.", status: "TODO", type: "BUG", priority: "HIGH", assignee: users[0]._id, due_date: new Date("2025-12-05") },
        { project: project1._id, title: "Add Role-Based Access Control", description: "Define user roles and permissions for the dashboard.", status: "IN_PROGRESS", type: "IMPROVEMENT", priority: "MEDIUM", assignee: users[1]._id, due_date: new Date("2025-12-20") },

        // Project 2 tasks
        { project: project2._id, title: "Create New Logo Concepts", description: "Sketch and finalize 3 logo concepts for client review.", status: "IN_PROGRESS", type: "FEATURE", priority: "MEDIUM", assignee: users[1]._id, due_date: new Date("2025-10-31") },
        { project: project2._id, title: "Update Typography System", description: "Introduce new font hierarchy with responsive scaling.", status: "TODO", type: "IMPROVEMENT", priority: "MEDIUM", assignee: users[0]._id, due_date: new Date("2025-11-15") },
        { project: project2._id, title: "Client Feedback Integration", description: "Implement client-requested adjustments to the brand guide.", status: "TODO", type: "TASK", priority: "LOW", assignee: users[1]._id, due_date: new Date("2025-10-31") },

        // Project 3 tasks
        { project: project3._id, title: "Security Audit", description: "Run container vulnerability scans and review IAM roles.", status: "TODO", type: "OTHER", priority: "MEDIUM", assignee: users[2]._id, due_date: new Date("2025-12-10") },
        { project: project3._id, title: "Set Up EKS Cluster", description: "Provision EKS cluster on AWS and configure nodes.", status: "TODO", type: "TASK", priority: "HIGH", assignee: users[0]._id, due_date: new Date("2025-12-15") },
        { project: project3._id, title: "Implement CI/CD with GitHub Actions", description: "Add build, test, and deploy steps using GitHub Actions.", status: "TODO", type: "TASK", priority: "MEDIUM", assignee: users[1]._id, due_date: new Date("2025-10-31") },

        // Project 4 tasks
        { project: project4._id, title: "Migrate to Playwright 1.48", description: "Update scripts to use latest Playwright features.", status: "IN_PROGRESS", type: "IMPROVEMENT", priority: "HIGH", assignee: users[0]._id, due_date: new Date("2025-10-31") },
        { project: project4._id, title: "Parallel Test Execution", description: "Enable concurrent test runs across CI pipelines.", status: "TODO", type: "TASK", priority: "MEDIUM", assignee: users[1]._id, due_date: new Date("2025-11-28") },
        { project: project4._id, title: "Visual Snapshot Comparison", description: "Implement screenshot diffing for UI regression detection.", status: "TODO", type: "FEATURE", priority: "LOW", assignee: users[0]._id, due_date: new Date("2025-11-20") },
    ]);

    console.log(`Created ${tasks.length} tasks`);

    // Create some sample comments
    await Comment.create([
        { task: tasks[0]._id, user: users[0]._id, content: "Started working on the dashboard wireframes. Will share designs by end of week." },
        { task: tasks[0]._id, user: users[2]._id, content: "Great, looking forward to seeing the designs. Make sure to include mobile responsive views." },
        { task: tasks[0]._id, user: users[1]._id, content: "Can we also add a dark mode toggle to the dashboard?" },
        { task: tasks[2]._id, user: users[0]._id, content: "Found the root cause — the CSV parser doesn't handle duplicate email fields. Working on a fix." },
    ]);

    console.log("Created sample comments");

    // Create some activity records
    await Activity.create([
        { workspace: ws1._id, project: project1._id, user: users[2]._id, action: "PROJECT_CREATED", description: 'Oliver Watts created project "LaunchPad CRM"' },
        { workspace: ws1._id, project: project1._id, task: tasks[0]._id, user: users[0]._id, action: "TASK_CREATED", description: 'Alex Smith created task "Design Dashboard UI"' },
        { workspace: ws1._id, project: project1._id, task: tasks[0]._id, user: users[0]._id, action: "TASK_STATUS_CHANGED", description: 'Alex Smith changed task "Design Dashboard UI" from TODO to IN_PROGRESS', metadata: { oldStatus: "TODO", newStatus: "IN_PROGRESS" } },
        { workspace: ws1._id, project: project2._id, user: users[2]._id, action: "PROJECT_CREATED", description: 'Oliver Watts created project "Brand Identity Overhaul"' },
        { workspace: ws2._id, project: project3._id, user: users[2]._id, action: "PROJECT_CREATED", description: 'Oliver Watts created project "Kubernetes Migration"' },
    ]);

    console.log("Created sample activity records");

    console.log("\n✅ Seed complete!");
    console.log("\nLogin credentials:");
    console.log("  alex@projecthub.com / password123");
    console.log("  john@projecthub.com / password123");
    console.log("  oliver@projecthub.com / password123");

    if (disconnect) {
        await mongoose.disconnect();
        process.exit(0);
    }
};

if (process.argv[1] === new URL(import.meta.url).pathname || process.argv[1].endsWith('seed.js')) {
    seed().catch((err) => {
        console.error("Seed error:", err);
        process.exit(1);
    });
}

export default seed;
