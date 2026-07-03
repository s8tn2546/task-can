# TaskCan Backend Description

## Overview
The backend is an Express + MongoDB + Firebase Admin SDK API for TaskCan.
It handles authentication, workspaces, boards, tasks, and AI-assisted task generation.
The API is designed around Firebase ID token verification and workspace membership checks, so a valid login token alone is not enough to access board or task data.

## Tech Stack
- Node.js
- Express
- MongoDB with Mongoose
- Firebase Admin SDK for authentication verification
- Groq API for AI task breakdown generation
- CORS configured for the Vite frontend at `http://localhost:5173`

## Folder Structure

### `backend/src/config/`
- `db.js`  
  Handles the MongoDB connection using Mongoose. It reads `MONGODB_URI` from the environment and connects the app to the database.
- `firebase.js`  
  Initializes Firebase Admin SDK using `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`. It exposes Firebase auth access used by the auth middleware.

### `backend/src/models/`
- `User.js`  
  Stores a Firebase UID as the MongoDB `_id`, along with `email`, `displayName`, and `createdAt`.
- `Workspace.js`  
  Stores workspace name, owner, member list, and creation time.
- `Board.js`  
  Stores the board name, the workspace it belongs to, who created it, and its creation time.
- `Task.js`  
  Stores tasks, their status, ordering, parent-child relationships, AI-generated flag, due date, creator, and timestamps.

### `backend/src/routes/`
- `user.routes.js`  
  Defines user sync routes.
- `workspace.routes.js`  
  Defines workspace listing, creation, and workspace board creation routes.
- `board.routes.js`  
  Defines board read/delete/task-list routes.
- `task.routes.js`  
  Defines task create/update/delete routes.
- `ai.routes.js`  
  Defines the AI task generation route.

### `backend/src/controllers/`
- `user.controller.js`  
  Syncs the Firebase user into MongoDB after login.
- `workspace.controller.js`  
  Lists workspaces, creates workspaces, and returns a workspace with its boards.
- `board.controller.js`  
  Reads a board, deletes a board, and returns tasks for a board.
- `task.controller.js`  
  Creates tasks, updates tasks, deletes tasks, and recalculates ordering within status columns.
- `ai.controller.js`  
  Accepts a prompt, asks Groq to generate subtasks, and saves the returned tasks into MongoDB.

### `backend/src/middleware/`
- `auth.middleware.js`  
  Verifies the `Authorization: Bearer <token>` header with Firebase Admin SDK. It sets `req.userId` from the Firebase UID and rejects invalid or missing tokens with `401`.
- `error.middleware.js`  
  Central error handler that returns JSON errors in the form `{ "error": "message" }`.

### `backend/src/services/`
- `groq.service.js`  
  Isolates the Groq API call for AI task generation. It sends a prompt to the Llama model and expects a JSON array of `{ title, description }` objects.

### `backend/src/app.js`
- Creates the Express app.
- Adds JSON parsing and CORS.
- Exposes `/health` without auth.
- Applies Firebase auth middleware to all `/api` routes.
- Mounts route modules.
- Connects to MongoDB and initializes Firebase when the server starts.

## Data Model Summary

### User
- `_id`: Firebase UID string
- `email`: required
- `displayName`: optional
- `createdAt`: defaults to now

### Workspace
- `name`: required
- `ownerId`: string ref to `User`
- `members`: array of `{ userId, role }`
- `createdAt`: defaults to now

### Board
- `workspaceId`: required ObjectId ref to `Workspace`
- `name`: required
- `createdBy`: string ref to `User`
- `createdAt`: defaults to now

### Task
- `boardId`: required ObjectId ref to `Board`
- `title`: required
- `description`: optional
- `status`: `todo`, `ongoing`, or `completed`
- `order`: required numeric position within the column
- `parentTaskId`: nullable task parent reference
- `aiGenerated`: boolean flag
- `dueDate`: optional
- `createdBy`: string ref to `User`
- timestamps enabled

## Authentication Flow
1. The frontend sends a Firebase ID token in the `Authorization` header.
2. `auth.middleware.js` verifies the token using Firebase Admin.
3. The decoded UID is attached to `req.userId`.
4. `POST /api/users/sync` creates or updates the MongoDB user record for that UID.

## Authorization Rules
- Workspace membership is required for every board or task read/write.
- Board and task controllers resolve the owning workspace before allowing access.
- A valid Firebase token is not enough by itself to access arbitrary IDs.

## API Endpoints

### Public
- `GET /health`  
  Health check, no auth required.

### Users
- `POST /api/users/sync`  
  Sync the Firebase user into MongoDB.

### Workspaces
- `GET /api/workspaces`  
  List workspaces where the current user is owner or member.
- `POST /api/workspaces`  
  Create a workspace and assign the current user as owner.
- `GET /api/workspaces/:id`  
  Get a workspace and its boards if the user is a member.
- `POST /api/workspaces/:id/boards`  
  Create a board in a workspace if the user is a member.

### Boards
- `GET /api/boards/:id`  
  Get a board and its tasks if the user is a member of the parent workspace.
- `DELETE /api/boards/:id`  
  Delete a board and its tasks.
- `GET /api/boards/:id/tasks`  
  Get tasks for a board.
- `POST /api/boards/:id/ai-generate`  
  Generate tasks from a prompt using Groq.

### Tasks
- `POST /api/boards/:id/tasks`  
  Create a task in a board.
- `PATCH /api/tasks/:id`  
  Update a task, including drag-and-drop status/order changes.
- `DELETE /api/tasks/:id`  
  Delete a task.

## Task Ordering Behavior
When a task moves between columns or changes order, the backend:
- refetches the affected column tasks,
- sorts them by existing order,
- reassigns sequential values starting from `0`,
- saves the reordered tasks.

This keeps each status column ordered consistently without gap-based ordering.

## AI Task Generation
The AI endpoint uses Groq with a Llama model.
It instructs the model to return only valid JSON in this shape:
```json
[
  { "title": "Task title", "description": "Task description" }
]
```
Those tasks are then stored with `aiGenerated: true`.

## Environment Variables
Required values are documented in `backend/.env.example`:
- `MONGODB_URI`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `GROQ_API_KEY`
- `PORT=5000`

## How to Check If the Backend Is Working
These are the main API calls you can use after starting the server.

### 1. Health Check
```bash
curl http://localhost:5000/health
```
Expected response:
```json
{ "ok": true }
```

### 2. Sync User
Replace `YOUR_FIREBASE_ID_TOKEN` with a real Firebase ID token.
```bash
curl -X POST http://localhost:5000/api/users/sync \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json"
```
Expected response: the synced user document.

### 3. List Workspaces
```bash
curl http://localhost:5000/api/workspaces \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```
Expected response: array of workspaces the user belongs to.

### 4. Create Workspace
```bash
curl -X POST http://localhost:5000/api/workspaces \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Workspace"}'
```
Expected response: created workspace document.

### 5. Get Workspace With Boards
```bash
curl http://localhost:5000/api/workspaces/YOUR_WORKSPACE_ID \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```
Expected response: workspace object with a `boards` array.

### 6. Create Board
```bash
curl -X POST http://localhost:5000/api/workspaces/YOUR_WORKSPACE_ID/boards \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sprint Board"}'
```
Expected response: created board document.

### 7. Get Board With Tasks
```bash
curl http://localhost:5000/api/boards/YOUR_BOARD_ID \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```
Expected response: board object with a `tasks` array.

### 8. Get Board Tasks
```bash
curl http://localhost:5000/api/boards/YOUR_BOARD_ID/tasks \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```
Expected response: array of tasks.

### 9. Create Task
```bash
curl -X POST http://localhost:5000/api/boards/YOUR_BOARD_ID/tasks \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"First task","description":"Check backend is alive","status":"todo"}'
```
Expected response: created task document.

### 10. Update Task
```bash
curl -X PATCH http://localhost:5000/api/tasks/YOUR_TASK_ID \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"ongoing","order":0}'
```
Expected response: updated task document.

### 11. Delete Task
```bash
curl -X DELETE http://localhost:5000/api/tasks/YOUR_TASK_ID \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```
Expected response: `204 No Content`.

### 12. AI Task Generation
```bash
curl -X POST http://localhost:5000/api/boards/YOUR_BOARD_ID/ai-generate \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Plan a website redesign project"}'
```
Expected response: array of created AI-generated tasks.

## Notes
- If any protected endpoint returns `401`, the Firebase token is missing or invalid.
- If access to a board/task returns `403`, the user is not a member of the owning workspace.
- If Groq is misconfigured or returns invalid JSON, the AI endpoint should return a clean error response instead of crashing the server.
