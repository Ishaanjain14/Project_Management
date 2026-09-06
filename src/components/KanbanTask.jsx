import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarIcon, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';

export default function KanbanTask({ task }) {
    const navigate = useNavigate();
    const { projectId } = useParams();
    
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task._id || task.id,
        data: {
            type: 'Task',
            task,
        },
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-white dark:bg-zinc-900 border-2 border-blue-500 rounded-lg p-3 opacity-30 h-28"
            />
        );
    }

    const priorityColors = {
        LOW: "bg-gray-100 text-gray-800 dark:bg-zinc-700 dark:text-gray-300",
        MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
        URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => navigate(`/projects/${projectId}/tasks/${task._id || task.id}`)}
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 shadow-sm hover:border-gray-300 dark:hover:border-zinc-500 cursor-grab active:cursor-grabbing group relative flex flex-col gap-2"
        >
            <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${priorityColors[task.priority] || priorityColors.MEDIUM}`}>
                    {task.priority}
                </span>
                {task.type && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 font-medium">
                        {task.type}
                    </span>
                )}
            </div>
            
            <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-snug">
                {task.title}
            </h4>
            
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-400">
                    {task.due_date && (
                        <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>{format(new Date(task.due_date), "MMM d")}</span>
                        </div>
                    )}
                </div>
                
                <img 
                    src={task.assignee?.image || `https://ui-avatars.com/api/?name=${task.assignee?.name || 'U'}&background=random`} 
                    alt={task.assignee?.name || 'Assignee'}
                    className="w-6 h-6 rounded-full border border-white dark:border-zinc-800"
                    title={task.assignee?.name}
                />
            </div>
        </div>
    );
}
