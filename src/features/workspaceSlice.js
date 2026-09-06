import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../utils/api";

// Async thunks
export const fetchWorkspaces = createAsyncThunk(
    "workspace/fetchWorkspaces",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/workspaces");
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch workspaces");
        }
    }
);

export const fetchWorkspaceProjects = createAsyncThunk(
    "workspace/fetchWorkspaceProjects",
    async (workspaceId, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/projects?workspace=${workspaceId}`);
            return { workspaceId, projects: data };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch projects");
        }
    }
);

export const createWorkspace = createAsyncThunk(
    "workspace/createWorkspace",
    async ({ name, description }, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/workspaces", { name, description });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to create workspace");
        }
    }
);

export const createProject = createAsyncThunk(
    "workspace/createProject",
    async (projectData, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/projects", projectData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to create project");
        }
    }
);

export const updateProject = createAsyncThunk(
    "workspace/updateProject",
    async ({ projectId, ...updateData }, { rejectWithValue }) => {
        try {
            const { data } = await api.put(`/projects/${projectId}`, updateData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update project");
        }
    }
);

export const createTask = createAsyncThunk(
    "workspace/createTask",
    async (taskData, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/tasks", taskData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to create task");
        }
    }
);

export const updateTask = createAsyncThunk(
    "workspace/updateTask",
    async ({ taskId, ...updateData }, { rejectWithValue }) => {
        try {
            const { data } = await api.put(`/tasks/${taskId}`, updateData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update task");
        }
    }
);

export const deleteTasks = createAsyncThunk(
    "workspace/deleteTasks",
    async (taskIds, { rejectWithValue }) => {
        try {
            await api.post("/tasks/bulk/delete", { taskIds });
            return taskIds;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to delete tasks");
        }
    }
);

export const inviteWorkspaceMember = createAsyncThunk(
    "workspace/inviteMember",
    async ({ workspaceId, email, role }, { rejectWithValue }) => {
        try {
            const { data } = await api.post(`/workspaces/${workspaceId}/members`, { email, role });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to invite member");
        }
    }
);

export const addProjectMember = createAsyncThunk(
    "workspace/addProjectMember",
    async ({ projectId, userId }, { rejectWithValue }) => {
        try {
            const { data } = await api.post(`/projects/${projectId}/members`, { userId });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to add member");
        }
    }
);

export const addMilestone = createAsyncThunk(
    "workspace/addMilestone",
    async ({ projectId, title, description, due_date }, { rejectWithValue }) => {
        try {
            const { data } = await api.post(`/projects/${projectId}/milestones`, { title, description, due_date });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to add milestone");
        }
    }
);

export const updateMilestone = createAsyncThunk(
    "workspace/updateMilestone",
    async ({ projectId, milestoneId, ...updateData }, { rejectWithValue }) => {
        try {
            const { data } = await api.put(`/projects/${projectId}/milestones/${milestoneId}`, updateData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update milestone");
        }
    }
);

const initialState = {
    workspaces: [],
    currentWorkspace: null,
    loading: false,
    error: null,
};

const workspaceSlice = createSlice({
    name: "workspace",
    initialState,
    reducers: {
        setCurrentWorkspace: (state, action) => {
            const ws = state.workspaces.find((w) => w._id === action.payload);
            if (ws) {
                state.currentWorkspace = ws;
                localStorage.setItem("currentWorkspaceId", action.payload);
            }
        },
        clearWorkspaceState: (state) => {
            state.workspaces = [];
            state.currentWorkspace = null;
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch workspaces
            .addCase(fetchWorkspaces.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchWorkspaces.fulfilled, (state, action) => {
                state.loading = false;
                const workspaces = (action.payload || []).map(w => ({
                    ...w,
                    members: (w.members || []).filter(m => m !== null && m !== undefined)
                }));
                state.workspaces = workspaces;
                // Restore last selected workspace or pick first
                const savedId = localStorage.getItem("currentWorkspaceId");
                const saved = workspaces.find((w) => w._id === savedId);
                state.currentWorkspace = saved || workspaces[0] || null;
            })
            .addCase(fetchWorkspaces.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch workspace projects
            .addCase(fetchWorkspaceProjects.fulfilled, (state, action) => {
                let { workspaceId, projects } = action.payload;
                // Filter out any null projects that might have been populated by Mongoose due to deleted references
                projects = (projects || []).filter(p => p !== null && p !== undefined);
                
                const ws = state.workspaces.find((w) => w._id === workspaceId);
                if (ws) ws.projects = projects;
                if (state.currentWorkspace?._id === workspaceId) {
                    state.currentWorkspace.projects = projects;
                }
            })

            // Create workspace
            .addCase(createWorkspace.fulfilled, (state, action) => {
                state.workspaces.push(action.payload);
                state.currentWorkspace = action.payload;
                localStorage.setItem("currentWorkspaceId", action.payload._id);
            })

            // Create project
            .addCase(createProject.fulfilled, (state, action) => {
                if (state.currentWorkspace) {
                    if (!state.currentWorkspace.projects) state.currentWorkspace.projects = [];
                    state.currentWorkspace.projects.push(action.payload);
                }
            })

            // Update project
            .addCase(updateProject.fulfilled, (state, action) => {
                if (state.currentWorkspace?.projects) {
                    const idx = state.currentWorkspace.projects.findIndex(
                        (p) => p._id === action.payload._id
                    );
                    if (idx !== -1) {
                        state.currentWorkspace.projects[idx] = action.payload;
                    }
                }
            })

            // Create task
            .addCase(createTask.fulfilled, (state, action) => {
                if (state.currentWorkspace?.projects) {
                    const project = state.currentWorkspace.projects.find(
                        (p) => p._id === action.payload.project
                    );
                    if (project) {
                        if (!project.tasks) project.tasks = [];
                        project.tasks.push(action.payload);
                    }
                }
            })

            // Update task
            .addCase(updateTask.fulfilled, (state, action) => {
                if (state.currentWorkspace?.projects) {
                    const project = state.currentWorkspace.projects.find(
                        (p) => p._id === action.payload.project
                    );
                    if (project?.tasks) {
                        const idx = project.tasks.findIndex((t) => t._id === action.payload._id);
                        if (idx !== -1) project.tasks[idx] = action.payload;
                    }
                }
            })

            // Delete tasks
            .addCase(deleteTasks.fulfilled, (state, action) => {
                const taskIds = action.payload;
                if (state.currentWorkspace?.projects) {
                    state.currentWorkspace.projects.forEach((p) => {
                        if (p.tasks) {
                            p.tasks = p.tasks.filter((t) => !taskIds.includes(t._id));
                        }
                    });
                }
            })

            // Invite workspace member
            .addCase(inviteWorkspaceMember.fulfilled, (state, action) => {
                const idx = state.workspaces.findIndex((w) => w._id === action.payload._id);
                if (idx !== -1) state.workspaces[idx] = { ...state.workspaces[idx], members: action.payload.members };
                if (state.currentWorkspace?._id === action.payload._id) {
                    state.currentWorkspace.members = action.payload.members;
                }
            })

            // Add project member / milestones — update project in place
            .addCase(addProjectMember.fulfilled, (state, action) => {
                if (state.currentWorkspace?.projects) {
                    const idx = state.currentWorkspace.projects.findIndex(
                        (p) => p._id === action.payload._id
                    );
                    if (idx !== -1) state.currentWorkspace.projects[idx] = action.payload;
                }
            })
            .addCase(addMilestone.fulfilled, (state, action) => {
                if (state.currentWorkspace?.projects) {
                    const idx = state.currentWorkspace.projects.findIndex(
                        (p) => p._id === action.payload._id
                    );
                    if (idx !== -1) state.currentWorkspace.projects[idx] = action.payload;
                }
            })
            .addCase(updateMilestone.fulfilled, (state, action) => {
                if (state.currentWorkspace?.projects) {
                    const idx = state.currentWorkspace.projects.findIndex(
                        (p) => p._id === action.payload._id
                    );
                    if (idx !== -1) state.currentWorkspace.projects[idx] = action.payload;
                }
            });
    },
});

export const { setCurrentWorkspace, clearWorkspaceState } = workspaceSlice.actions;
export default workspaceSlice.reducer;