import { useState, useRef, useEffect, useMemo } from 'react'
import { SearchIcon, PanelLeft, MoonIcon, SunIcon, LogOut, User } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../features/themeSlice'
import { logout } from '../features/authSlice'
import { clearWorkspaceState } from '../features/workspaceSlice'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { FolderIcon, FileStackIcon } from 'lucide-react'
import NotificationPopover from './NotificationPopover'

const Navbar = ({ setIsSidebarOpen }) => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { theme } = useSelector(state => state.theme);
    const { user } = useSelector(state => state.auth);
    
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    
    const profileRef = useRef(null);
    const searchRef = useRef(null);
    
    const { currentWorkspace } = useSelector(state => state.workspace);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchResults = useMemo(() => {
        const projects = currentWorkspace?.projects || [];
        if (!searchQuery.trim() || projects.length === 0) return { projects: [], tasks: [] };
        
        const q = searchQuery.toLowerCase();
        const matchedProjects = projects.filter(p => (p.name || "").toLowerCase().includes(q));
        
        let tasks = [];
        projects.forEach(p => {
            if (p.tasks) {
                const matchedTasks = p.tasks.filter(t => t && t.title && t.title.toLowerCase().includes(q)).map(t => ({...t, projectName: p.name, projectId: p._id || p.id}));
                tasks = [...tasks, ...matchedTasks];
            }
        });
        
        return { projects: matchedProjects.slice(0, 3), tasks: tasks.slice(0, 5) };
    }, [searchQuery, currentWorkspace]);

    const handleLogout = () => {
        dispatch(logout());
        dispatch(clearWorkspaceState());
        navigate('/login');
    };

    return (
        <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 xl:px-16 py-3 flex-shrink-0">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
                {/* Left section */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Sidebar Trigger */}
                    <button onClick={() => setIsSidebarOpen((prev) => !prev)} className="sm:hidden p-2 rounded-lg transition-colors text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800" >
                        <PanelLeft size={20} />
                    </button>

                    {/* Search Input */}
                    <div className="relative flex-1 max-w-sm" ref={searchRef}>
                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400 size-3.5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setIsSearchOpen(true);
                            }}
                            onFocus={() => setIsSearchOpen(true)}
                            placeholder="Search projects, tasks..."
                            className="pl-8 pr-4 py-2 w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                        
                        {/* Search Dropdown */}
                        {isSearchOpen && searchQuery.trim() && (
                            <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-md shadow-lg z-50 py-2 max-h-96 overflow-y-auto">
                                {searchResults.projects.length === 0 && searchResults.tasks.length === 0 ? (
                                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-zinc-400 text-center">No results found</div>
                                ) : (
                                    <>
                                        {searchResults.projects.length > 0 && (
                                            <div className="mb-2">
                                                <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Projects</div>
                                                {searchResults.projects.map(p => (
                                                    <button 
                                                        key={p._id || p.id} 
                                                        onClick={() => { navigate(`/projects/${p._id || p.id}`); setIsSearchOpen(false); }}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                                                    >
                                                        <FolderIcon className="size-4 text-blue-500" />
                                                        <span className="truncate">{p.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {searchResults.tasks.length > 0 && (
                                            <div>
                                                <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Tasks</div>
                                                {searchResults.tasks.map(t => (
                                                    <button 
                                                        key={t._id || t.id} 
                                                        onClick={() => { navigate(`/projects/${t.projectId}/tasks/${t._id || t.id}`); setIsSearchOpen(false); }}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 flex flex-col"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <FileStackIcon className="size-4 text-emerald-500 flex-shrink-0" />
                                                            <span className="font-medium truncate">{t.title}</span>
                                                        </div>
                                                        <span className="text-xs text-gray-500 dark:text-zinc-500 ml-6 truncate">in {t.projectName}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-3 relative" ref={profileRef}>
                    <NotificationPopover />

                    {/* Theme Toggle */}
                    <button onClick={() => dispatch(toggleTheme())} className="size-8 flex items-center justify-center bg-white dark:bg-zinc-800 shadow rounded-lg transition hover:scale-105 active:scale-95">
                        {
                            theme === "light"
                                ? (<MoonIcon className="size-4 text-gray-800 dark:text-gray-200" />)
                                : (<SunIcon className="size-4 text-yellow-400" />)
                        }
                    </button>

                    {/* User Button */}
                    <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center focus:outline-none">
                        <img 
                            src={user?.image || assets.profile_img_a} 
                            alt={user?.name || "User Avatar"} 
                            className="size-7 rounded-full border border-gray-200 dark:border-zinc-700 hover:opacity-80 transition" 
                        />
                    </button>

                    {/* Profile Dropdown */}
                    {isProfileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-md shadow-lg z-50 py-1">
                            <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-800">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{user?.email}</p>
                            </div>
                            <div className="py-1">
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2">
                                    <User className="size-4" /> Profile
                                </button>
                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2">
                                    <LogOut className="size-4" /> Sign out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Navbar
