import { createContext, useContext, useReducer, useCallback } from 'react';

const AppContext = createContext(null);

const initialState = {
  user: null,
  workspaces: [
    { id: 'ws-1', name: 'Personal', boardCount: 2, createdAt: Date.now() - 86400000 },
    { id: 'ws-2', name: 'Work', boardCount: 1, createdAt: Date.now() - 172800000 },
  ],
  boards: {
    'ws-1': [
      {
        id: 'b-1',
        name: 'Weekly Goals',
        workspaceId: 'ws-1',
        createdAt: Date.now() - 43200000,
      },
      {
        id: 'b-2',
        name: 'Project Alpha',
        workspaceId: 'ws-1',
        createdAt: Date.now() - 21600000,
      },
    ],
    'ws-2': [
      {
        id: 'b-3',
        name: 'Sprint 12',
        workspaceId: 'ws-2',
        createdAt: Date.now() - 10800000,
      },
    ],
  },
  tasks: {
    'b-1': [
      {
        id: 't-1',
        title: 'Review PR #42',
        description: 'Check the new authentication flow implementation',
        column: 'todo',
        dueDate: null,
        isAiGenerated: false,
        parentId: null,
        createdAt: Date.now() - 3600000,
      },
      {
        id: 't-2',
        title: 'Write unit tests for API module',
        description: 'Cover edge cases for rate limiting',
        column: 'ongoing',
        dueDate: Date.now() + 86400000,
        isAiGenerated: false,
        parentId: null,
        createdAt: Date.now() - 7200000,
      },
      {
        id: 't-3',
        title: 'Update dependencies',
        description: 'Bump react-router-dom to v7',
        column: 'todo',
        dueDate: Date.now() + 172800000,
        isAiGenerated: true,
        parentId: null,
        createdAt: Date.now() - 14400000,
      },
      {
        id: 't-4',
        title: 'Set up CI/CD pipeline',
        description: 'GitHub Actions for staging deploy',
        column: 'completed',
        dueDate: null,
        isAiGenerated: false,
        parentId: null,
        createdAt: Date.now() - 86400000,
      },
      {
        id: 't-5',
        title: 'Research caching strategies',
        description: 'Redis vs CDN for static assets',
        column: 'todo',
        dueDate: Date.now() + 259200000,
        isAiGenerated: false,
        parentId: null,
        createdAt: Date.now() - 3600000,
      },
      {
        id: 't-6',
        title: 'Update API docs',
        description: 'Document new /v2/events endpoint',
        column: 'todo',
        dueDate: null,
        isAiGenerated: true,
        parentId: 't-1',
        createdAt: Date.now() - 1800000,
      },
      {
        id: 't-7',
        title: 'Add pagination to user list',
        description: 'Cursor-based pagination for /users',
        column: 'ongoing',
        dueDate: Date.now() + 43200000,
        isAiGenerated: true,
        parentId: null,
        createdAt: Date.now() - 900000,
      },
    ],
    'b-2': [],
    'b-3': [],
  },
  generatingTasks: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'CREATE_WORKSPACE':
      return {
        ...state,
        workspaces: [...state.workspaces, action.payload],
        boards: { ...state.boards, [action.payload.id]: [] },
      };

    case 'CREATE_BOARD': {
      const { workspaceId, board } = action.payload;
      return {
        ...state,
        boards: {
          ...state.boards,
          [workspaceId]: [...(state.boards[workspaceId] || []), board],
        },
        tasks: { ...state.tasks, [board.id]: [] },
      };
    }

    case 'MOVE_TASK': {
      const { boardId, taskId, toColumn } = action.payload;
      const boardTasks = state.tasks[boardId];
      if (!boardTasks) return state;
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [boardId]: boardTasks.map((t) =>
            t.id === taskId ? { ...t, column: toColumn } : t
          ),
        },
      };
    }

    case 'ADD_TASK': {
      const { boardId, task } = action.payload;
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [boardId]: [...(state.tasks[boardId] || []), task],
        },
      };
    }

    case 'SET_GENERATING':
      return { ...state, generatingTasks: action.payload };

    case 'ADD_AI_TASKS': {
      const { boardId, tasks } = action.payload;
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [boardId]: [...(state.tasks[boardId] || []), ...tasks],
        },
        generatingTasks: false,
      };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const login = useCallback((user) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'SET_USER', payload: null });
  }, []);

  const createWorkspace = useCallback((name) => {
    const ws = {
      id: `ws-${Date.now()}`,
      name,
      boardCount: 0,
      createdAt: Date.now(),
    };
    dispatch({ type: 'CREATE_WORKSPACE', payload: ws });
    return ws;
  }, []);

  const createBoard = useCallback((workspaceId, name) => {
    const board = {
      id: `b-${Date.now()}`,
      name,
      workspaceId,
      createdAt: Date.now(),
    };
    dispatch({ type: 'CREATE_BOARD', payload: { workspaceId, board } });
    return board;
  }, []);

  const moveTask = useCallback((boardId, taskId, toColumn) => {
    dispatch({ type: 'MOVE_TASK', payload: { boardId, taskId, toColumn } });
  }, []);

  const addTask = useCallback((boardId, task) => {
    dispatch({ type: 'ADD_TASK', payload: { boardId, task } });
  }, []);

  const generateTasks = useCallback((boardId, prompt) => {
    dispatch({ type: 'SET_GENERATING', payload: true });
    const sampleTasks = [
      {
        id: `t-${Date.now()}-1`,
        title: `Plan ${prompt.split(' ').slice(0, 3).join(' ')}…`,
        description: 'Outline key milestones and deliverables',
        column: 'todo',
        dueDate: Date.now() + 604800000,
        isAiGenerated: true,
        parentId: null,
        createdAt: Date.now(),
      },
      {
        id: `t-${Date.now()}-2`,
        title: 'Gather required resources',
        description: 'Identify team, tools, and budget needed',
        column: 'todo',
        dueDate: Date.now() + 345600000,
        isAiGenerated: true,
        parentId: null,
        createdAt: Date.now(),
      },
      {
        id: `t-${Date.now()}-3`,
        title: 'Set up timeline and deadlines',
        description: 'Break down phases with target dates',
        column: 'todo',
        dueDate: null,
        isAiGenerated: true,
        parentId: null,
        createdAt: Date.now(),
      },
      {
        id: `t-${Date.now()}-4`,
        title: 'Assign responsibilities',
        description: 'Match tasks to team members based on skills',
        column: 'todo',
        dueDate: Date.now() + 172800000,
        isAiGenerated: true,
        parentId: null,
        createdAt: Date.now(),
      },
      {
        id: `t-${Date.now()}-5`,
        title: 'Review and adjust plan',
        description: 'Weekly check-ins to track progress',
        column: 'todo',
        dueDate: Date.now() + 1209600000,
        isAiGenerated: true,
        parentId: null,
        createdAt: Date.now(),
      },
    ];
    setTimeout(() => {
      dispatch({ type: 'ADD_AI_TASKS', payload: { boardId, tasks: sampleTasks } });
    }, 2200);
  }, []);

  const value = {
    state,
    login,
    logout,
    createWorkspace,
    createBoard,
    moveTask,
    addTask,
    generateTasks,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
