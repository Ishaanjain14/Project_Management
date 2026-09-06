import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        title: {
            type: String,
            required: [true, "Task title is required"],
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
            default: "TODO",
        },
        type: {
            type: String,
            enum: ["TASK", "BUG", "FEATURE", "IMPROVEMENT", "OTHER"],
            default: "TASK",
        },
        priority: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "MEDIUM",
        },
        assignee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        due_date: { type: Date },
        approval_status: {
            type: String,
            enum: ["NONE", "PENDING_APPROVAL", "APPROVED", "REJECTED"],
            default: "NONE",
        },
        approved_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        attachments: [
            {
                filename: String,
                originalname: String,
                mimetype: String,
                size: Number,
                path: String,
                uploaded_by: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                uploaded_at: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);
export default Task;
