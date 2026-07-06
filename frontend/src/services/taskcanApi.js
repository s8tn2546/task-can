const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
const SESSION_KEY = 'taskcan-session';

function toBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function makeDemoSession({ email, displayName, uid }) {
  const sessionUser = {
    uid,
    email,
    displayName,
    photoURL: null,
  };

  return {
    user: sessionUser,
    token: `dev.${toBase64(JSON.stringify({ uid, email, displayName, name: displayName }))}`,
  };
}

export function readStoredSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.user || !parsed?.token) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredSession(session) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const parsed = await parseResponse(response);
  if (!response.ok) {
    const message = parsed?.error || parsed?.message || 'Request failed';
    throw new Error(message);
  }

  return parsed;
}

export function mapWorkspace(workspace) {
  return {
    id: workspace._id,
    name: workspace.name,
    boardCount: workspace.boardCount ?? 0,
    createdAt: workspace.createdAt,
  };
}

export function mapBoard(board) {
  return {
    id: board._id,
    name: board.name,
    workspaceId: String(board.workspaceId),
    createdAt: board.createdAt,
  };
}

export function mapTask(task) {
  return {
    id: task._id,
    title: task.title,
    description: task.description || '',
    column: task.status || 'todo',
    dueDate: task.dueDate ? new Date(task.dueDate).getTime() : null,
    isAiGenerated: Boolean(task.aiGenerated),
    parentId: task.parentTaskId ? String(task.parentTaskId) : null,
    createdAt: task.createdAt ? new Date(task.createdAt).getTime() : Date.now(),
  };
}