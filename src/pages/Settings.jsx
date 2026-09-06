import { useSelector } from "react-redux";
import { SettingsIcon } from "lucide-react";

const Settings = () => {
    const { user } = useSelector((state) => state.auth);
    const { currentWorkspace } = useSelector((state) => state.workspace);

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <SettingsIcon className="size-5" /> Settings
            </h1>

            <div className="space-y-6">
                {/* Profile */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
                    <h2 className="text-base font-medium text-gray-900 dark:text-zinc-100 mb-4">Profile</h2>
                    <div className="flex items-center gap-4 mb-4">
                        <img
                            src={user?.image || `https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=random`}
                            alt={user?.name}
                            className="size-14 rounded-full border-2 border-gray-200 dark:border-zinc-700"
                        />
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{user?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">{user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Workspace */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
                    <h2 className="text-base font-medium text-gray-900 dark:text-zinc-100 mb-4">Workspace</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500 dark:text-zinc-400">Name</p>
                            <p className="text-gray-900 dark:text-zinc-100 font-medium">{currentWorkspace?.name || "—"}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-zinc-400">Members</p>
                            <p className="text-gray-900 dark:text-zinc-100 font-medium">{currentWorkspace?.members?.length || 0}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-zinc-400">Projects</p>
                            <p className="text-gray-900 dark:text-zinc-100 font-medium">{currentWorkspace?.projects?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
