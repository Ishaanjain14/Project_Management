import { useState } from "react";
import { useDispatch } from "react-redux";
import { format } from "date-fns";
import { PlusIcon, CheckCircleIcon, CircleIcon, FlagIcon } from "lucide-react";
import { addMilestone, updateMilestone } from "../features/workspaceSlice";
import toast from "react-hot-toast";

export default function ProjectMilestones({ project }) {
    const dispatch = useDispatch();
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");

    const milestones = project?.milestones || [];

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await dispatch(addMilestone({
                projectId: project._id,
                title,
                description,
                due_date: dueDate
            })).unwrap();
            setShowForm(false);
            setTitle("");
            setDescription("");
            setDueDate("");
            toast.success("Milestone created successfully");
        } catch (err) {
            console.error("Failed to add milestone", err);
            toast.error(err || "Failed to add milestone");
        }
    };

    const handleToggleStatus = async (milestone) => {
        const newStatus = milestone.status === "COMPLETED" ? "PENDING" : "COMPLETED";
        try {
            await dispatch(updateMilestone({
                projectId: project._id,
                milestoneId: milestone._id,
                status: newStatus
            })).unwrap();
            toast.success("Milestone updated successfully");
        } catch (err) {
            console.error("Failed to update milestone", err);
            toast.error(err || "Failed to update milestone");
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <FlagIcon className="w-5 h-5 text-blue-500" />
                    Milestones
                </h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 transition"
                >
                    <PlusIcon className="w-4 h-4" />
                    New Milestone
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-4">
                    <div>
                        <input
                            type="text"
                            required
                            placeholder="Milestone Title"
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <textarea
                            placeholder="Description"
                            rows={2}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <input
                            type="date"
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Save
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {milestones.length === 0 ? (
                    <p className="text-center text-zinc-500 py-8">No milestones created yet.</p>
                ) : (
                    milestones.map(m => (
                        <div key={m._id} className="flex items-start gap-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition">
                            <button onClick={() => handleToggleStatus(m)} className="mt-0.5">
                                {m.status === "COMPLETED" ? (
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <CircleIcon className="w-5 h-5 text-zinc-400 hover:text-blue-500 transition" />
                                )}
                            </button>
                            <div className="flex-1">
                                <h4 className={`text-sm font-medium ${m.status === "COMPLETED" ? "text-zinc-500 line-through" : "text-zinc-900 dark:text-zinc-100"}`}>
                                    {m.title}
                                </h4>
                                {m.description && (
                                    <p className="text-xs text-zinc-500 mt-1">{m.description}</p>
                                )}
                                {m.due_date && (
                                    <p className="text-xs text-zinc-400 mt-2">
                                        Due: {format(new Date(m.due_date), "MMM d, yyyy")}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
