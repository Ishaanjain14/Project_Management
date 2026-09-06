import { format } from "date-fns";
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarIcon, MessageCircle, PenIcon, ShieldCheckIcon, Paperclip, Download, Loader2 } from "lucide-react";
import api from "../utils/api";
import socket from "../utils/socket";
import { updateTask } from "../features/workspaceSlice";

const TaskDetails = () => {

    const { projectId, taskId } = useParams();
    const dispatch = useDispatch();

    const { user } = useSelector(state => state.auth);
    const { currentWorkspace } = useSelector((state) => state.workspace);

    const [task, setTask] = useState(null);
    const [project, setProject] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploadingFile, setUploadingFile] = useState(false);

    const fetchComments = async () => {
        if (!taskId) return;
        try {
            const { data } = await api.get(`/tasks/${taskId}/comments`);
            setComments(data);
        } catch (error) {
            console.error("Failed to fetch comments:", error);
        }
    };

    const fetchTaskDetails = async () => {
        setLoading(true);
        if (!projectId || !taskId) return;

        const proj = currentWorkspace.projects.find((p) => p.id === projectId || p._id === projectId);
        if (!proj) return;

        const tsk = proj.tasks.find((t) => t.id === taskId || t._id === taskId);
        if (!tsk) return;

        setTask(tsk);
        setProject(proj);
        setLoading(false);
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            toast.loading("Adding comment...");
            const { data } = await api.post(`/tasks/${taskId}/comments`, {
                content: newComment
            });
            
            setComments((prev) => [...prev, data]);
            setNewComment("");
            toast.dismiss();
            toast.success("Comment added.");
        } catch (error) {
            toast.dismiss();
            toast.error(error?.response?.data?.message || "Failed to add comment");
            console.error(error);
        }
    };

    const handleApprovalAction = async (newStatus) => {
        try {
            toast.loading("Updating approval status...");
            await dispatch(updateTask({
                taskId: task._id || task.id,
                project: project._id || project.id,
                approval_status: newStatus
            })).unwrap();
            
            // Re-fetch to get updated state
            await fetchTaskDetails();
            toast.dismiss();
            toast.success(`Task ${newStatus.toLowerCase().replace("_", " ")}`);
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to update approval status");
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFile(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            toast.loading("Uploading file...");
            await api.post(`/tasks/${taskId}/attachments`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            await fetchTaskDetails(); // re-fetch task to get the new attachment
            toast.dismiss();
            toast.success("File uploaded successfully.");
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to upload file");
            console.error(error);
        } finally {
            setUploadingFile(false);
            e.target.value = ""; // reset input
        }
    };

    useEffect(() => { fetchTaskDetails(); }, [taskId]);

    useEffect(() => {
        if (taskId && task) {
            fetchComments();
            
            // Connect to socket and join room
            if (!socket.connected) {
                socket.connect();
            }
            socket.emit("join-task", taskId);

            const handleNewComment = (comment) => {
                setComments((prev) => {
                    // Check if comment already exists to avoid duplicates
                    if (prev.find(c => c._id === comment._id)) return prev;
                    return [...prev, comment];
                });
            };

            socket.on("new-comment", handleNewComment);

            return () => {
                socket.off("new-comment", handleNewComment);
            };
        }
    }, [taskId, task]);

    if (loading) return (
        <div className="flex flex-col-reverse lg:flex-row gap-6 sm:p-4 max-w-6xl mx-auto w-full animate-pulse">
            <div className="w-full lg:w-2/3">
                <div className="h-[80vh] bg-gray-200 dark:bg-zinc-800 rounded-md w-full"></div>
            </div>
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
                <div className="h-64 bg-gray-200 dark:bg-zinc-800 rounded-md w-full"></div>
                <div className="h-32 bg-gray-200 dark:bg-zinc-800 rounded-md w-full"></div>
            </div>
        </div>
    );
    if (!task) return <div className="text-red-500 px-4 py-6">Task not found.</div>;

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-6 sm:p-4 text-gray-900 dark:text-zinc-100 max-w-6xl mx-auto">
            {/* Left: Comments / Chatbox */}
            <div className="w-full lg:w-2/3">
                <div className="p-5 rounded-md  border border-gray-300 dark:border-zinc-800  flex flex-col lg:h-[80vh]">
                    <h2 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                        <MessageCircle className="size-5" /> Task Discussion ({comments.length})
                    </h2>

                    <div className="flex-1 md:overflow-y-scroll no-scrollbar">
                        {comments.length > 0 ? (
                            <div className="flex flex-col gap-4 mb-6 mr-2">
                                {comments.map((comment) => (
                                    <div key={comment._id} className={`sm:max-w-4/5 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-900 border border-gray-300 dark:border-zinc-700 p-3 rounded-md ${comment.user._id === user?._id ? "ml-auto" : "mr-auto"}`} >
                                        <div className="flex items-center gap-2 mb-1 text-sm text-gray-500 dark:text-zinc-400">
                                            <img src={comment.user.image || `https://ui-avatars.com/api/?name=${comment.user.name}`} alt="avatar" className="size-5 rounded-full" />
                                            <span className="font-medium text-gray-900 dark:text-white">{comment.user.name}</span>
                                            <span className="text-xs text-gray-400 dark:text-zinc-600">
                                                • {format(new Date(comment.createdAt), "dd MMM yyyy, HH:mm")}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-900 dark:text-zinc-200">{comment.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600 dark:text-zinc-500 mb-4 text-sm">No comments yet. Be the first!</p>
                        )}
                    </div>

                    {/* Add Comment */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md p-2 text-sm text-gray-900 dark:text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600"
                            rows={3}
                        />
                        <button onClick={handleAddComment} className="bg-gradient-to-l from-blue-500 to-blue-600 transition-colors text-white text-sm px-5 py-2 rounded " >
                            Post
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Task + Project Info */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
                {/* Task Info */}
                <div className="p-5 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 ">
                    <div className="mb-3">
                        <h1 className="text-lg font-medium text-gray-900 dark:text-zinc-100">{task.title}</h1>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-300 text-xs">
                                {task.status}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-300 text-xs">
                                {task.type}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-green-200 dark:bg-emerald-900 text-green-900 dark:text-emerald-300 text-xs">
                                {task.priority}
                            </span>
                        </div>
                    </div>

                    {task.description && (
                        <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">{task.description}</p>
                    )}

                    <hr className="border-zinc-200 dark:border-zinc-700 my-4" />

                    {/* Approval Workflow */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-md p-4 mb-4 border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShieldCheckIcon className={`size-5 ${
                                    task.approval_status === 'APPROVED' ? 'text-emerald-500' :
                                    task.approval_status === 'REJECTED' ? 'text-red-500' :
                                    task.approval_status === 'PENDING_APPROVAL' ? 'text-amber-500' :
                                    'text-gray-400'
                                }`} />
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-zinc-100">Approval Status</h4>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400 capitalize">
                                        {task.approval_status === "NONE" ? "Not requested" : task.approval_status.replace("_", " ").toLowerCase()}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {task.approval_status === "NONE" || task.approval_status === "REJECTED" ? (
                                    <button onClick={() => handleApprovalAction("PENDING_APPROVAL")} className="px-3 py-1.5 text-xs font-medium rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition">
                                        Request Approval
                                    </button>
                                ) : task.approval_status === "PENDING_APPROVAL" ? (
                                    <>
                                        <button onClick={() => handleApprovalAction("REJECTED")} className="px-3 py-1.5 text-xs font-medium rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition">
                                            Reject
                                        </button>
                                        <button onClick={() => handleApprovalAction("APPROVED")} className="px-3 py-1.5 text-xs font-medium rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition">
                                            Approve
                                        </button>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-zinc-300">
                        <div className="flex items-center gap-2">
                            <img src={task.assignee?.image || `https://ui-avatars.com/api/?name=${task.assignee?.name || 'U'}`} className="size-5 rounded-full" alt="avatar" />
                            {task.assignee?.name || "Unassigned"}
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="size-4 text-gray-500 dark:text-zinc-500" />
                            Due : {format(new Date(task.due_date), "dd MMM yyyy")}
                        </div>
                    </div>

                    <hr className="border-zinc-200 dark:border-zinc-700 my-4" />

                    {/* Attachments */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                                <Paperclip className="size-4 text-gray-500" /> Attachments ({task.attachments?.length || 0})
                            </h3>
                            <div>
                                <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                                <label htmlFor="file-upload" className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition flex items-center gap-2 ${uploadingFile ? "opacity-50 cursor-not-allowed" : ""}`}>
                                    {uploadingFile ? <Loader2 className="size-3 animate-spin" /> : <Paperclip className="size-3" />}
                                    Upload File
                                </label>
                            </div>
                        </div>

                        {task.attachments?.length > 0 ? (
                            <div className="space-y-2">
                                {task.attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2.5 rounded bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Paperclip className="size-3 text-gray-400 shrink-0" />
                                            <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{file.name}</span>
                                            <span className="text-xs text-gray-500 shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <a href={`${(import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, "")}${file.url}`} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400 transition" title="Download">
                                            <Download className="size-4" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 dark:text-zinc-500 italic">No attachments added yet.</p>
                        )}
                    </div>
                </div>

                {/* Project Info */}
                {project && (
                    <div className="p-4 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-gray-300 dark:border-zinc-800 ">
                        <p className="text-xl font-medium mb-4">Project Details</p>
                        <h2 className="text-gray-900 dark:text-zinc-100 flex items-center gap-2"> <PenIcon className="size-4" /> {project.name}</h2>
                        <p className="text-xs mt-3">Project Start Date: {format(new Date(project.start_date), "dd MMM yyyy")}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-zinc-400 mt-3">
                            <span>Status: {project.status}</span>
                            <span>Priority: {project.priority}</span>
                            <span>Progress: {project.progress}%</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskDetails;
