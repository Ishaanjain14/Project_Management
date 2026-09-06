import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { format, isBefore, addDays } from 'date-fns';
import { FlagIcon, CalendarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const UpcomingMilestones = () => {
    const projects = useSelector((state) => state?.workspace?.currentWorkspace?.projects || []);

    const upcomingMilestones = useMemo(() => {
        let allMilestones = [];
        
        projects.forEach(project => {
            if (project.milestones) {
                const projectMilestones = project.milestones.filter(m => m).map(m => ({
                    ...m,
                    projectName: project.name,
                    projectId: project._id || project.id
                }));
                allMilestones = [...allMilestones, ...projectMilestones];
            }
        });

        // Sort by date (closest first) and filter out completed
        return allMilestones
            .filter(m => m && m.status !== 'COMPLETED' && new Date(m.due_date) >= new Date())
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
            .slice(0, 5);
    }, [projects]);

    return (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm dark:shadow-none mt-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <FlagIcon className="size-5 text-blue-500" />
                    Upcoming Milestones
                </h2>
            </div>

            {upcomingMilestones.length > 0 ? (
                <div className="space-y-4">
                    {upcomingMilestones.map((milestone) => {
                        const isOverdue = isBefore(new Date(milestone.target_date), new Date());
                        const isDueSoon = isBefore(new Date(milestone.target_date), addDays(new Date(), 7));
                        
                        let dateColor = "text-zinc-600 dark:text-zinc-400";
                        if (isOverdue) dateColor = "text-red-600 dark:text-red-400 font-medium";
                        else if (isDueSoon) dateColor = "text-amber-600 dark:text-amber-400 font-medium";

                        return (
                            <div key={milestone._id || milestone.id} className="flex items-start justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition">
                                <div className="flex-1 min-w-0 pr-4">
                                    <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-200 truncate">
                                        {milestone.title}
                                    </h4>
                                    <Link to={`/projects/${milestone.projectId}?tab=milestones`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block">
                                        {milestone.projectName}
                                    </Link>
                                </div>
                                <div className={`flex items-center gap-1.5 text-xs whitespace-nowrap ${dateColor}`}>
                                    <CalendarIcon className="size-3.5" />
                                    {format(new Date(milestone.target_date), "MMM d")}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
                    <FlagIcon className="size-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No pending milestones in your active projects.</p>
                </div>
            )}
        </div>
    );
};

export default UpcomingMilestones;
