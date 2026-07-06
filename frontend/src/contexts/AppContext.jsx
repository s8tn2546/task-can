/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useReducer } from 'react';
import {
  apiRequest,
  clearStoredSession,
  makeDemoSession,
  mapBoard,
  mapTask,
  mapWorkspace,
  readStoredSession,
  saveStoredSession,
} from '../services/taskcanApi';

const AppContext = createContext(null);

const storedSession = readStoredSession();

const initialState = {
  user: storedSession?.user || null,
  token: storedSession?.token || null,
  workspaces: [],
  boards: {},
  tasks: {},
  generatingTasks: false,
};

function sortByCreatedAt(left, right) {
  return new Date(right.createdAt) - new Date(left.createdAt);
}

function upsertWorkspace(workspaces, workspace, boardCount) {
  const nextWorkspace = { ...workspace, boardCount };
  return [
    nextWorkspace,
    ...workspaces.filter((item) => item.id !== nextWorkspace.id),
  ].sort(sortByCreatedAt);
}

function upsertBoardList(boards, board) {
  return [board, ...boards.filter((item) => item.id !== board.id)].sort(sortByCreatedAt);
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SESSION':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
      };

    case 'CLEAR_SESSION':
      return {
        user: null,
        token: null,
        workspaces: [],
        boards: {},
        tasks: {},
        generatingTasks: false,
      };

    case 'SET_WORKSPACES':
      return {
        ...state,
        workspaces: action.payload.map((workspace) => ({
          ...workspace,
          boardCount: state.boards[workspace.id]?.length ?? workspace.boardCount ?? 0,
        })),
      };

    case 'UPSERT_WORKSPACE':
      return {
        ...state,
        workspaces: upsertWorkspace(
          state.workspaces,
          action.payload,
          state.boards[action.payload.id]?.length ?? action.payload.boardCount ?? 0
        ),
      };

    case 'SET_WORKSPACE_DETAIL': {
      const workspace = mapWorkspace(action.payload.workspace);
      const boards = action.payload.boards.map(mapBoard);
      const nextTasks = { ...state.tasks };

      boards.forEach((board) => {
        if (!nextTasks[board.id]) {
          nextTasks[board.id] = [];
        }
      });

      return {
        ...state,
        workspaces: upsertWorkspace(state.workspaces, workspace, boards.length),
        boards: {
          ...state.boards,
          [workspace.id]: boards,
        },
        tasks: nextTasks,
      };
    }

    case 'UPSERT_BOARD': {
      const { workspaceId, board } = action.payload;
      const nextBoards = upsertBoardList(state.boards[workspaceId] || [], board);

      return {
        ...state,
        boards: {
          ...state.boards,
          [workspaceId]: nextBoards,
        },
        tasks: {
          ...state.tasks,
          [board.id]: state.tasks[board.id] || [],
        },
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === workspaceId ? { ...workspace, boardCount: nextBoards.length } : workspace
        ),
      };
    }

    case 'SET_BOARD_DETAIL': {
      const { workspaceId, board, tasks } = action.payload;
      const mappedBoard = mapBoard(board);
      const nextBoards = upsertBoardList(state.boards[workspaceId] || [], mappedBoard);

      return {
        ...state,
        boards: {
          ...state.boards,
          [workspaceId]: nextBoards,
        },
        tasks: {
          ...state.tasks,
          [mappedBoard.id]: tasks.map(mapTask),
        },
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === workspaceId ? { ...workspace, boardCount: nextBoards.length } : workspace
        ),
      };
    }

    case 'SET_GENERATING':
      return { ...state, generatingTasks: action.payload };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadWorkspaces = useCallback(async () => {
    if (!state.token) {
      return [];
    }

    const workspaces = await apiRequest('/workspaces', { token: state.token });
    const mappedWorkspaces = workspaces.map(mapWorkspace);
    dispatch({ type: 'SET_WORKSPACES', payload: mappedWorkspaces });
    return mappedWorkspaces;
  }, [state.token]);

  const loadWorkspace = useCallback(async (workspaceId) => {
    if (!state.token) {
      return null;
    }

    const workspace = await apiRequest(`/workspaces/${workspaceId}`, { token: state.token });
    dispatch({
      type: 'SET_WORKSPACE_DETAIL',
      payload: {
        workspace,
        boards: workspace.boards || [],
      },
    });
    return workspace;
  }, [state.token]);

  const loadBoard = useCallback(async (boardId) => {
    if (!state.token) {
      return null;
    }

    const board = await apiRequest(`/boards/${boardId}`, { token: state.token });
    dispatch({
      type: 'SET_BOARD_DETAIL',
      payload: {
        workspaceId: String(board.workspaceId),
        board,
        tasks: board.tasks || [],
      },
    });
    return board;
  }, [state.token]);

  const login = useCallback(async (user) => {
    const normalizedUser = {
      uid: user.uid || `demo-${String(user.email || 'user').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      email: user.email,
      displayName: user.displayName || user.name || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || null,
    };
    const session = makeDemoSession({
      email: normalizedUser.email,
      displayName: normalizedUser.displayName,
      uid: normalizedUser.uid,
    });

    dispatch({ type: 'SET_SESSION', payload: { user: normalizedUser, token: session.token } });
    saveStoredSession({ user: normalizedUser, token: session.token });

    await apiRequest('/users/sync', {
      method: 'POST',
      token: session.token,
    });

    return normalizedUser;
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    dispatch({ type: 'CLEAR_SESSION' });
  }, []);

  const createWorkspace = useCallback(async (name) => {
    const workspace = await apiRequest('/workspaces', {
      method: 'POST',
      token: state.token,
      body: { name },
    });
    const mappedWorkspace = mapWorkspace(workspace);
    dispatch({ type: 'UPSERT_WORKSPACE', payload: mappedWorkspace });
    return mappedWorkspace;
  }, [state.token]);

  const createBoard = useCallback(async (workspaceId, name) => {
    const board = await apiRequest(`/workspaces/${workspaceId}/boards`, {
      method: 'POST',
      token: state.token,
      body: { name },
    });
    const mappedBoard = mapBoard(board);
    dispatch({
      type: 'UPSERT_BOARD',
      payload: { workspaceId, board: mappedBoard },
    });
    return mappedBoard;
  }, [state.token]);

  const moveTask = useCallback(async (boardId, taskId, toColumn) => {
    await apiRequest(`/tasks/${taskId}`, {
      method: 'PATCH',
      token: state.token,
      body: { status: toColumn },
    });
    await loadBoard(boardId);
  }, [loadBoard, state.token]);

  const addTask = useCallback(async (boardId, task) => {
    await apiRequest(`/boards/${boardId}/tasks`, {
      method: 'POST',
      token: state.token,
      body: {
        title: task.title,
        description: task.description,
        status: task.column,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
        parentTaskId: task.parentId || null,
      },
    });
    await loadBoard(boardId);
  }, [loadBoard, state.token]);

  const generateTasks = useCallback(async (boardId, prompt) => {
    dispatch({ type: 'SET_GENERATING', payload: true });
    try {
      await apiRequest(`/boards/${boardId}/ai-generate`, {
        method: 'POST',
        token: state.token,
        body: { prompt },
      });
      await loadBoard(boardId);
    } finally {
      dispatch({ type: 'SET_GENERATING', payload: false });
    }
  }, [loadBoard, state.token]);

  const value = {
    state,
    login,
    logout,
    createWorkspace,
    createBoard,
    moveTask,
    addTask,
    generateTasks,
    loadWorkspaces,
    loadWorkspace,
    loadBoard,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}