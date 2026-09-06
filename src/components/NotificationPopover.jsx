import { useState, useEffect, useRef } from "react";
import { Bell, Clock, Zap, MessageSquare, Square, GitCommit, Bug, CheckCircle } from "lucide-react";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import api from "../utils/api";
import socket from "../utils/socket";

const actionIcons = {
    "PROJECT_CREATED": { icon: Zap, color: "text-blue-500" },
    "PROJECT_UPDATED": { icon: MessageSquare, color: "text-amber-500" },
    "TASK_CREATED": { icon: Square, color: "text-emerald-500" },
    "TASK_UPDATED": { icon: GitCommit, color: "text-purple-500" },
    "TASK_DELETED": { icon: Bug, color: "text-red-500" },
    "TASK_STATUS_CHANGED": { icon: CheckCircle, color: "text-emerald-600" },
    "COMMENT_ADDED": { icon: MessageSquare, color: "text-blue-400" },
    "TASK_APPROVAL_CHANGED": { icon: CheckCircle, color: "text-orange-500" },
};

export default function NotificationPopover() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const popoverRef = useRef(null);
    const { currentWorkspace } = useSelector(state => state.workspace);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        if (!currentWorkspace) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/activities?workspace=${currentWorkspace._id}`);
            // We use activities as notifications
            setNotifications(data.slice(0, 10)); // Just top 10
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentWorkspace) {
            fetchNotifications();
            // Optional: Listen for real-time notifications via socket here
        }
    }, [currentWorkspace]);

    const togglePopover = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setUnreadCount(0); // Mark as read when opened
            fetchNotifications();
        }
    };

    return (
        <div className="relative" ref={popoverRef}>
            <button 
                onClick={togglePopover}
                className="size-8 flex items-center justify-center bg-white dark:bg-zinc-800 shadow rounded-lg transition hover:scale-105 active:scale-95 relative"
            >
                <Bell className="size-4 text-gray-800 dark:text-gray-200" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white dark:border-zinc-900"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-md shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-500">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-500">No recent notifications.</div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                                {notifications.map((notif) => {
                                    const TypeIcon = actionIcons[notif.action]?.icon || Clock;
                                    const iconColor = actionIcons[notif.action]?.color || "text-gray-500";
                                    
                                    return (
                                        <div key={notif._id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 p-1.5 bg-gray-100 dark:bg-zinc-800 rounded-md shrink-0">
                                                    <TypeIcon className={`size-3.5 ${iconColor}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-800 dark:text-zinc-200 text-left">
                                                        {notif.description}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                                                        {format(new Date(notif.createdAt), "MMM d, h:mm a")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    
                    <div className="px-4 py-2 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                        <button className="w-full text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            View all activity
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
