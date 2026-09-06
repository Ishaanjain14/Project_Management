import { io } from "socket.io-client";

// Derive socket URL from API URL (strip /api suffix) or fall back to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

const socket = io(SOCKET_URL, {
    autoConnect: false, // Don't connect until logged in
    withCredentials: true,
});

export default socket;
