import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
        },
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                "PROJECT_CREATED",
                "PROJECT_UPDATED",
                "PROJECT_DELETED",
                "TASK_CREATED",
                "TASK_UPDATED",
                "TASK_STATUS_CHANGED",
                "TASK_ASSIGNED",
                "TASK_DELETED",
                "COMMENT_ADDED",
                "MEMBER_ADDED",
                "MEMBER_REMOVED",
                "MILESTONE_CREATED",
                "MILESTONE_COMPLETED",
                "FILE_UPLOADED",
                "APPROVAL_REQUESTED",
                "APPROVAL_GRANTED",
                "APPROVAL_REJECTED",
            ],
        },
        description: {
            type: String,
            required: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

// Index for efficient querying
activitySchema.index({ workspace: 1, createdAt: -1 });
activitySchema.index({ project: 1, createdAt: -1 });

const Activity = mongoose.model("Activity", activitySchema);
export default Activity;
