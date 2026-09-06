# ProjectHub - Project Management Portal

ProjectHub is a project management platform for teams to collaborate, assign tasks, and track project progress. It provides secure user authentication, team-based workspaces, Kanban boards, and real-time activity tracking.

## Features
- Secure user authentication and JWT authorization
- Team-based workspaces and project collaboration
- Kanban board for task management
- Activity tracking and audit logs
- Role-Based Access Control (RBAC)
- Real-time updates with Socket.IO
- File attachments for tasks

## Tech Stack
- Frontend: React 19, Vite, Tailwind CSS, Redux Toolkit, @dnd-kit
- Backend: Node.js, Express.js, MongoDB, Mongoose, Socket.IO, Multer

## Setup Instructions

1. Install dependencies for frontend and backend:
```bash
npm install
cd server
npm install
```

2. Set up environment variables in `server/.env`:
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/projecthub
JWT_SECRET=supersecret
```

3. Seed the database with demo data:
```bash
cd server
node seed.js
```

4. Start the development servers:
\`\`\`bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
npm run dev
\`\`\`

## Demo Credentials
- Email: alex@projecthub.com
- Password: password123
