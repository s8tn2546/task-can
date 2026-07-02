import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './contexts/AppContext';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import WorkspaceView from './screens/WorkspaceView';
import BoardCreationChoice from './screens/BoardCreationChoice';
import BoardView from './screens/BoardView';

function ProtectedRoute({ children }) {
  const { state } = useApp();
  if (!state.user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { state } = useApp();

  return (
    <Routes>
      <Route
        path="/login"
        element={state.user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspace/:workspaceId"
        element={
          <ProtectedRoute>
            <WorkspaceView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspace/:workspaceId/boards/new"
        element={
          <ProtectedRoute>
            <BoardCreationChoice />
          </ProtectedRoute>
        }
      />
      <Route
        path="/board/:boardId"
        element={
          <ProtectedRoute>
            <BoardView />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
