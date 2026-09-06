import React from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import workspaceReducer from './src/features/workspaceSlice';
import authReducer from './src/features/authSlice';
import themeReducer from './src/features/themeSlice';
import Team from './src/pages/Team';
import Dashboard from './src/pages/Dashboard';
import { BrowserRouter } from 'react-router-dom';

const store = configureStore({
    reducer: {
        workspace: workspaceReducer,
        auth: authReducer,
        theme: themeReducer
    },
    preloadedState: {
        workspace: {
            currentWorkspace: {
                _id: '123',
                name: 'Test Workspace',
                projects: [],
                members: []
            },
            workspaces: [],
            loading: false,
            error: null
        },
        auth: {
            user: { id: 'u1', name: 'Test User' },
            isAuthenticated: true,
            token: 'test'
        }
    }
});

try {
    console.log("Rendering Team...");
    renderToString(
        <Provider store={store}>
            <BrowserRouter>
                <Team />
            </BrowserRouter>
        </Provider>
    );
    console.log("Team rendered successfully!");
    
    console.log("Rendering Dashboard...");
    renderToString(
        <Provider store={store}>
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        </Provider>
    );
    console.log("Dashboard rendered successfully!");
} catch (error) {
    console.error("CRASH DURING RENDER:", error);
}
