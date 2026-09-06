import mongoose from "mongoose";

const workspaceMemberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    role: {
        type: String,
        enum: ["ADMIN", "MEMBER"],
        default: "MEMBER",
    },
});

const workspaceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Workspace name is required"],
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        image_url: {
            type: String,
            default: "",
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [workspaceMemberSchema],
    },
    { timestamps: true }
);

// Auto-generate slug from name before save
workspaceSchema.pre("save", function (next) {
    if (this.isModified("name") || !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }
    next();
});

const Workspace = mongoose.model("Workspace", workspaceSchema);
export default Workspace;
