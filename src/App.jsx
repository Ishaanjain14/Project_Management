import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Layout from "./pages/Layout";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Team from "./pages/Team";
import ProjectDetails from "./pages/ProjectDetails";
import TaskDetails from "./pages/TaskDetails";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Settings from "./pages/Settings";
import { fetchCurrentUser } from "./features/authSlice";
import { fetchWorkspaces, fetchWorkspaceProjects } from "./features/workspaceSlice";

const NotFound = () => (
    <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center px-4">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-zinc-100 mb-2">404</h1>
        <p className="text-gray-600 dark:text-zinc-400 mb-6">Oops! The page you are looking for does not exist.</p>
        <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Go back home</a>
    </div>
);

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useSelector((state) => state.auth);
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};

const App = () => {
    const dispatch = useDispatch();
    const { isAuthenticated, token } = useSelector((state) => state.auth);

    useEffect(() => {
        if (token) {
            dispatch(fetchCurrentUser());
        }
    }, [dispatch, token]);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchWorkspaces());
        }
    }, [dispatch, isAuthenticated]);

    const { currentWorkspace } = useSelector((state) => state.workspace);
    useEffect(() => {
        if (currentWorkspace?._id) {
            dispatch(fetchWorkspaceProjects(currentWorkspace._id));
        }
    }, [dispatch, currentWorkspace?._id]);

    return (
        <>
            <Toaster />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<Dashboard />} />
                    <Route path="team" element={<Team />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="projects/:projectId" element={<ProjectDetails />} />
                    <Route path="projects/:projectId/tasks/:taskId" element={<TaskDetails />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </>
    );
};

export default App;
