import React, { useMemo } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useDispatch } from 'react-redux';
import { updateTask } from '../features/workspaceSlice';
import KanbanColumn from './KanbanColumn';
import KanbanTask from './KanbanTask';
import toast from 'react-hot-toast';

const COLUMNS = [
    { id: 'TODO', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'DONE', title: 'Done' }
];

export default function KanbanBoard({ tasks, projectId }) {
    const dispatch = useDispatch();
    const [activeId, setActiveId] = React.useState(null);
    
    // We maintain local state for smooth drag and drop before syncing with Redux/Backend
    const [localTasks, setLocalTasks] = React.useState(tasks);

    React.useEffect(() => {
        setLocalTasks(tasks);
    }, [tasks]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const columnsWithTasks = useMemo(() => {
        return COLUMNS.map(col => ({
            ...col,
            tasks: localTasks.filter(task => task.status === col.id)
        }));
    }, [localTasks]);

    const activeTask = useMemo(() => {
        return localTasks.find(t => t._id === activeId || t.id === activeId);
    }, [activeId, localTasks]);

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;
        
        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === 'Task';
        const isOverTask = over.data.current?.type === 'Task';
        const isOverColumn = over.data.current?.type === 'Column';

        if (!isActiveTask) return;

        // Dropping a task over another task
        if (isActiveTask && isOverTask) {
            setLocalTasks(prev => {
                const activeIndex = prev.findIndex(t => (t._id || t.id) === activeId);
                const overIndex = prev.findIndex(t => (t._id || t.id) === overId);
                
                if (prev[activeIndex].status !== prev[overIndex].status) {
                    const newTasks = [...prev];
                    newTasks[activeIndex].status = prev[overIndex].status;
                    return arrayMove(newTasks, activeIndex, overIndex);
                }
                
                return arrayMove(prev, activeIndex, overIndex);
            });
        }

        // Dropping a task over an empty column area
        if (isActiveTask && isOverColumn) {
            setLocalTasks(prev => {
                const activeIndex = prev.findIndex(t => (t._id || t.id) === activeId);
                const newTasks = [...prev];
                newTasks[activeIndex].status = overId;
                return arrayMove(newTasks, activeIndex, activeIndex);
            });
        }
    };

    const handleDragEnd = async (event) => {
        setActiveId(null);
        
        const { active, over } = event;
        if (!over) return;
        
        const taskId = active.id;
        const task = localTasks.find(t => (t._id || t.id) === taskId);
        const originalTask = tasks.find(t => (t._id || t.id) === taskId);
        
        if (task && originalTask && task.status !== originalTask.status) {
            // Optimistically saved locally, now sync to backend
            try {
                await dispatch(updateTask({
                    taskId: taskId,
                    project: projectId,
                    status: task.status
                })).unwrap();
                toast.success("Task status updated");
            } catch (error) {
                console.error("Failed to update task status:", error);
                toast.error(error || "Failed to update task status");
                // Revert on failure
                setLocalTasks(tasks);
            }
        }
    };

    return (
        <div className="w-full flex gap-6 overflow-x-auto pb-4 pt-2">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                {columnsWithTasks.map(col => (
                    <KanbanColumn key={col.id} column={col} tasks={col.tasks} />
                ))}

                <DragOverlay>
                    {activeTask ? <KanbanTask task={activeTask} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
