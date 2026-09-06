import mongoose from "mongoose";

const projectMemberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
});

const milestoneSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: { type: String, default: "" },
    due_date: { type: Date },
    status: {
        type: String,
        enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
        default: "PENDING",
    },
    completed_at: { type: Date },
}, { timestamps: true });

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Project name is required"],
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        priority: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "MEDIUM",
        },
        status: {
            type: String,
            enum: ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"],
            default: "PLANNING",
        },
        start_date: { type: Date },
        end_date: { type: Date },
        team_lead: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        members: [projectMemberSchema],
        milestones: [milestoneSchema],
    },
    { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;
