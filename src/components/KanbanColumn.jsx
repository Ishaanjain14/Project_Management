import React, { useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import KanbanTask from './KanbanTask';

export default function KanbanColumn({ column, tasks }) {
    const { setNodeRef } = useDroppable({
        id: column.id,
        data: {
            type: 'Column',
            column,
        },
    });

    const taskIds = useMemo(() => tasks.map(t => t._id || t.id), [tasks]);

    return (
        <div
            ref={setNodeRef}
            className="flex flex-col flex-1 min-w-[280px] max-w-[350px] bg-gray-50 dark:bg-zinc-800/40 rounded-lg p-3 border border-gray-200 dark:border-zinc-800 h-full min-h-[500px]"
        >
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-semibold text-gray-700 dark:text-zinc-200">{column.title}</h3>
                <span className="bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 text-xs px-2 py-1 rounded-full font-medium">
                    {tasks.length}
                </span>
            </div>

            <div className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-[100px]">
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <KanbanTask key={task._id || task.id} task={task} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}
