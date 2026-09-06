import { useEffect, useState } from "react";
import { GitCommit, MessageSquare, Clock, Bug, Zap, Square, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import api from "../utils/api";

const typeIcons = {
    BUG: { icon: Bug, color: "text-red-500 dark:text-red-400" },
    FEATURE: { icon: Zap, color: "text-blue-500 dark:text-blue-400" },
    TASK: { icon: Square, color: "text-green-500 dark:text-green-400" },
    IMPROVEMENT: { icon: MessageSquare, color: "text-amber-500 dark:text-amber-400" },
    OTHER: { icon: GitCommit, color: "text-purple-500 dark:text-purple-400" },
};

const statusColors = {
    TODO: "bg-zinc-200 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-200",
    IN_PROGRESS: "bg-amber-200 text-amber-800 dark:bg-amber-500 dark:text-amber-900",
    DONE: "bg-emerald-200 text-emerald-800 dark:bg-emerald-500 dark:text-emerald-900",
};

const actionIcons = {
    "PROJECT_CREATED": { icon: Zap, color: "text-blue-500" },
    "PROJECT_UPDATED": { icon: MessageSquare, color: "text-amber-500" },
    "TASK_CREATED": { icon: Square, color: "text-emerald-500" },
    "TASK_UPDATED": { icon: GitCommit, color: "text-purple-500" },
    "TASK_DELETED": { icon: Bug, color: "text-red-500" },
    "TASK_STATUS_CHANGED": { icon: CheckCircle, color: "text-emerald-600" }
};

const RecentActivity = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const { currentWorkspace } = useSelector((state) => state.workspace);

    const fetchActivities = async () => {
        if (!currentWorkspace) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/activities?workspace=${currentWorkspace._id}`);
            setActivities(data);
        } catch (error) {
            console.error("Failed to fetch activities", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [currentWorkspace]);

    return (
        <div className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-lg transition-all overflow-hidden">
            <div className="border-b border-zinc-200 dark:border-zinc-800 p-4">
                <h2 className="text-lg text-zinc-800 dark:text-zinc-200">Recent Activity</h2>
            </div>

            <div className="p-0">
                {loading ? (
                    <div className="p-12 text-center text-zinc-500">Loading activities...</div>
                ) : activities.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                            <Clock className="w-8 h-8 text-zinc-600 dark:text-zinc-500" />
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400">No recent activity</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-[500px] overflow-y-auto">
                        {activities.map((activity) => {
                            const TypeIcon = actionIcons[activity.action]?.icon || Clock;
                            const iconColor = actionIcons[activity.action]?.color || "text-gray-500";

                            return (
                                <div key={activity._id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg">
                                            <TypeIcon className={`w-4 h-4 ${iconColor}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-1">
                                                <h4 className="text-sm text-zinc-800 dark:text-zinc-200">
                                                    {activity.description}
                                                </h4>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                                                <span>
                                                    {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentActivity;
