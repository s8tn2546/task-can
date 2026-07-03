# TaskCan Frontend Description

## Overview
The frontend is a Vite + React application that presents the TaskCan UI.
It currently focuses on the user interface layer, navigation, workspace and board screens, and a mock in-memory application state through `AppContext.jsx`.
It is styled with custom CSS variables and inline component styles, with motion effects powered by Framer Motion.

## Frontend Folder Structure

### `frontend/src/main.jsx`
- Application entry point.
- Renders the app into the root DOM node.
- Wraps the app in `BrowserRouter` for routing and `AppProvider` for global state.
- Imports the global stylesheet from `index.css`.

### `frontend/src/App.jsx`
- Defines the app routes.
- Protects private screens using a simple `ProtectedRoute` wrapper.
- Routes:
  - `/login`
  - `/`
  - `/workspace/:workspaceId`
  - `/workspace/:workspaceId/boards/new`
  - `/board/:boardId`
- Redirects unknown routes back to the dashboard.

### `frontend/src/contexts/AppContext.jsx`
- Central state store for the frontend.
- Contains mock/demo workspace, board, and task data.
- Provides actions such as:
  - `login`
  - `logout`
  - `createWorkspace`
  - `createBoard`
  - `moveTask`
  - `addTask`
  - `generateTasks`
- This is currently mocked client-side state, not yet wired to the backend API.

### `frontend/src/screens/Login.jsx`
- Login and signup-style landing page.
- Handles demo sign-in and Google-style sign-in buttons.
- Calls `login()` from context and routes to the dashboard.
- Presents the app branding and onboarding UI.

### `frontend/src/screens/Dashboard.jsx`
- Home/dashboard view after login.
- Shows the list of workspaces.
- Supports creating a new workspace.
- Supports logout.
- Uses `NotificationPrompt` for the notification permission prompt.

### `frontend/src/screens/WorkspaceView.jsx`
- Displays a single workspace.
- Shows the boards inside that workspace.
- Lets the user create a new board.
- Navigates to board detail views.
- Also routes into the board creation flow.

### `frontend/src/screens/BoardCreationChoice.jsx`
- Lets the user choose how to start a new board.
- Offers:
  - AI-assisted task generation
  - Blank board creation
- If AI is chosen, it collects a prompt and triggers mock task generation in the current frontend state.

### `frontend/src/screens/BoardView.jsx`
- Main board screen.
- Shows tasks grouped by status columns.
- Supports desktop drag-and-drop behavior.
- Supports mobile transfer modal behavior.
- Handles task creation, task movement, subtasks display, and AI badge presentation.
- Includes the notification prompt banner.

### `frontend/src/components/NotificationPrompt.jsx`
- Small banner that asks the user to allow browser notifications.
- Calls the browser Notification API if permission is requested.
- Can be dismissed.

### `frontend/src/App.css`
- Component/theme styling helpers for the main app UI.
- Contains styling support for the landing page and layout elements.
- The project primarily uses inline style objects in the React screens, so this file is part of the visual styling layer rather than the routing or state logic.

### `frontend/src/index.css`
- Global styles and CSS variables.
- Defines base look-and-feel for the app.
- Sets the overall color palette, typography baseline, borders, shadows, and layout defaults.

## What the Frontend Currently Does
- Provides a complete visual flow for login, dashboard, workspace, board creation, and board detail views.
- Uses animated transitions through Framer Motion.
- Uses a local context store for demo state and UI interactions.
- Does not yet call the backend API directly for workspace/board/task persistence.
- Is therefore best described as the UI layer that is ready to be wired to the backend.

## File-by-File Purpose Summary
- `src/main.jsx`: bootstraps the React app.
- `src/App.jsx`: route definitions and protected route handling.
- `src/contexts/AppContext.jsx`: shared app state and actions.
- `src/screens/Login.jsx`: authentication UI.
- `src/screens/Dashboard.jsx`: workspace list and dashboard actions.
- `src/screens/WorkspaceView.jsx`: workspace-level board list.
- `src/screens/BoardCreationChoice.jsx`: AI vs blank-board setup step.
- `src/screens/BoardView.jsx`: kanban board UI and task interaction screen.
- `src/components/NotificationPrompt.jsx`: notification permission banner.
- `src/App.css`: additional styling support for UI components.
- `src/index.css`: global theme and CSS variable foundation.

## Frontend Notes
- The current app uses demo data in the context instead of a live backend data layer.
- Login is currently simulated in the UI.
- The visual design is already split into distinct screens and can later be connected to real API calls without changing the route structure.
