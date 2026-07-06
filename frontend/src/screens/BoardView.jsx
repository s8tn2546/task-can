import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import NotificationPrompt from '../components/NotificationPrompt';

const COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
];

function formatDate(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  const now = new Date();
  const diff = d - now;
  const days = Math.round(diff / 86400000);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(ts) {
  return ts && new Date(ts) < new Date();
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    function check() { setMobile(window.innerWidth < 768); }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

export default function BoardView() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { state, moveTask, addTask, loadBoard } = useApp();
  const isMobile = useIsMobile();

  const [mobileCol, setMobileCol] = useState(0);
  const [dragItem, setDragItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCol, setAddCol] = useState('todo');
  const [addTitle, setAddTitle] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [showTransfer, setShowTransfer] = useState(null);
  const [longPressProgress, setLongPressProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const longPressTimer = useRef(null);

  useEffect(() => {
    let active = true;

    async function fetchBoard() {
      try {
        if (boardId) {
          await loadBoard(boardId);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchBoard();

    return () => {
      active = false;
    };
  }, [boardId, loadBoard]);

  const boardTasks = useMemo(() => state.tasks[boardId] || [], [state.tasks, boardId]);
  const generating = state.generatingTasks;

  let boardName = 'Board';
  let workspaceId = null;
  for (const ws of state.workspaces) {
    const boards = state.boards[ws.id] || [];
    const found = boards.find((b) => b.id === boardId);
    if (found) {
      boardName = found.name;
      workspaceId = found.workspaceId || ws.id;
      break;
    }
  }

  if (!workspaceId) {
    for (const [key, boards] of Object.entries(state.boards)) {
      const found = boards.find((board) => board.id === boardId);
      if (found) {
        boardName = found.name;
        workspaceId = found.workspaceId || key;
        break;
      }
    }
  }

  const getColumnTasks = useCallback(
    (colId) => boardTasks.filter((t) => t.column === colId && !t.parentId),
    [boardTasks]
  );
  const getSubtasks = useCallback(
    (parentId) => boardTasks.filter((t) => t.parentId === parentId),
    [boardTasks]
  );

  function handleDragStart(task) {
    setDragItem(task.id);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e, colId) {
    e.preventDefault();
    if (dragItem) {
      void moveTask(boardId, dragItem, colId);
    }
    setDragItem(null);
  }

  function handleAddTask(columnId) {
    setAddCol(columnId);
    setAddTitle('');
    setAddDescription('');
    setShowAddModal(true);
  }

  async function confirmAddTask() {
    if (!addTitle.trim()) return;
    const task = {
      id: `t-${Date.now()}`,
      title: addTitle.trim(),
      description: addDescription.trim(),
      column: addCol,
      dueDate: null,
      isAiGenerated: false,
      parentId: null,
      createdAt: Date.now(),
    };
    await addTask(boardId, task);
    setShowAddModal(false);
  }

  function handleTransfer(taskId, toColumn) {
    void moveTask(boardId, taskId, toColumn);
    setShowTransfer(null);
  }

  function startLongPress(e, task) {
    e.preventDefault();
    setLongPressProgress(task.id);
    longPressTimer.current = setTimeout(() => {
      setShowTransfer(task);
      setLongPressProgress(null);
    }, 600);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setLongPressProgress(null);
  }

  return (
    <div style={styles.page}>
      <NotificationPrompt />

      {loading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingCard}>Loading board...</div>
        </div>
      )}

      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate(workspaceId ? `/workspace/${workspaceId}` : '/')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div>
            <span style={styles.breadcrumb}>
              <span style={styles.breadcrumbLink} onClick={() => navigate(workspaceId ? `/workspace/${workspaceId}` : '/')}>Workspace</span>
              <span style={styles.breadcrumbSep}>/</span>
              {boardName}
            </span>
            <h1 style={styles.title}>{boardName}</h1>
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.taskCount}>{boardTasks.length} task{boardTasks.length !== 1 ? 's' : ''}</span>
        </div>
      </header>

      {isMobile ? (
        <MobileBoardView
          columns={COLUMNS}
          mobileCol={mobileCol}
          setMobileCol={setMobileCol}
          getColumnTasks={getColumnTasks}
          getSubtasks={getSubtasks}
          handleAddTask={handleAddTask}
          generating={generating}
          longPressProgress={longPressProgress}
          startLongPress={startLongPress}
          cancelLongPress={cancelLongPress}
        />
      ) : (
        <DesktopBoardView
          columns={COLUMNS}
          getColumnTasks={getColumnTasks}
          getSubtasks={getSubtasks}
          handleAddTask={handleAddTask}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          dragItem={dragItem}
          generating={generating}
        />
      )}

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.overlay}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              style={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={styles.modalTitle}>Add Task</h2>
              <p style={styles.modalSub}>
                to <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{(COLUMNS.find((c) => c.id === addCol) || {}).label}</span>
              </p>
              <div style={styles.modalForm}>
                <input
                  style={styles.modalInput}
                  placeholder="Task title"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && confirmAddTask()}
                />
                <textarea
                  style={{ ...styles.modalInput, ...styles.modalTextarea, resize: 'vertical' }}
                  placeholder="Description (optional)"
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div style={styles.modalActions}>
                <button style={styles.cancelBtn} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    ...styles.createBtn,
                    opacity: addTitle.trim() ? 1 : 0.5,
                  }}
                  onClick={confirmAddTask}
                  disabled={!addTitle.trim()}
                >
                  Add Task
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTransfer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.overlay}
            onClick={() => setShowTransfer(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={styles.bottomSheet}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.sheetHandle} />
              <h3 style={styles.sheetTitle}>Move task</h3>
              <p style={styles.sheetSub}>{showTransfer ? showTransfer.title : ''}</p>
              <div style={styles.sheetOptions}>
                {COLUMNS.filter((c) => !showTransfer || c.id !== showTransfer.column).map((col) => (
                  <motion.button
                    key={col.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={styles.sheetOption}
                    onClick={() => handleTransfer(showTransfer.id, col.id)}
                  >
                    <div style={{
                      ...styles.sheetDot,
                      background: col.id === 'todo' ? 'var(--accent-secondary)' : col.id === 'ongoing' ? 'var(--warning)' : 'var(--success)',
                    }} />
                    <span>{col.label}</span>
                  </motion.button>
                ))}
              </div>
              <button style={styles.sheetCancel} onClick={() => setShowTransfer(null)}>
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskCard({
  task,
  isSubtask,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  onLongPress,
  onLongPressEnd,
  isLongPressing,
  isMobile,
}) {
  const due = task.dueDate ? formatDate(task.dueDate) : null;
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isLongPressing ? 1.05 : 1,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      draggable={!isMobile}
      onDragStart={onDragStart ? () => onDragStart(task) : undefined}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseDown={(e) => isMobile && onLongPress && onLongPress(e, task)}
      onMouseUp={onLongPressEnd}
      onMouseLeave={onLongPressEnd}
      onTouchStart={(e) => isMobile && onLongPress && onLongPress(e, task)}
      onTouchEnd={onLongPressEnd}
      onTouchMove={onLongPressEnd}
      style={{
        ...styles.taskCard,
        ...(isSubtask ? styles.subtaskCard : {}),
        ...(isDragging ? styles.taskCardDragging : {}),
        ...(isLongPressing ? styles.taskCardLongPress : {}),
      }}
    >
      {isLongPressing && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.6, ease: 'linear' }}
          style={styles.longPressProgress}
        />
      )}
      <div style={styles.taskHeader}>
        <span style={styles.taskTitle}>{task.title}</span>
        {task.isAiGenerated && (
          <span style={styles.aiBadge} title="AI-generated">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
          </span>
        )}
      </div>
      {task.description && (
        <p style={styles.taskDesc}>{task.description}</p>
      )}
      {due && (
        <span style={{
          ...styles.taskDue,
          ...(overdue ? styles.taskDueOverdue : {}),
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {due}
        </span>
      )}
    </motion.div>
  );
}

function Column({
  column,
  tasks,
  subtasksMap,
  onAddTask,
  onDragStart,
  onDragOver,
  onDrop,
  dragItem,
  generating,
  isMobile,
  onLongPress,
  onLongPressEnd,
  longPressProgress,
}) {
  return (
    <div
      style={styles.column}
      onDragOver={onDragOver ? (e) => onDragOver(e, column.id) : undefined}
      onDrop={onDrop ? (e) => onDrop(e, column.id) : undefined}
    >
      <div style={styles.columnHeader}>
        <div style={styles.columnHeaderLeft}>
          <h2 style={styles.columnLabel}>{column.label}</h2>
          <span style={styles.columnCount}>{tasks.length}</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={styles.addTaskBtn}
          onClick={onAddTask ? () => onAddTask(column.id) : undefined}
          title="Add task"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.button>
      </div>

      <div style={styles.columnBody}>
        {generating && column.id === 'todo' && tasks.length === 0 && (
          <div style={styles.generatingIndicator}>
            <div style={styles.generatingDots}>
              <span style={{ ...styles.genDot, animationDelay: '0s' }} />
              <span style={{ ...styles.genDot, animationDelay: '0.2s' }} />
              <span style={{ ...styles.genDot, animationDelay: '0.4s' }} />
            </div>
            <span style={styles.genText}>Generating tasks…</span>
          </div>
        )}

        {tasks.length === 0 && !generating ? (
          <div style={styles.emptyState}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <p style={styles.emptyText}>No tasks yet</p>
            <p style={styles.emptyHint}>Add one or ask AI to help</p>
          </div>
        ) : (
          <div style={styles.taskList}>
            {tasks.map((task) => (
              <div key={task.id}>
                <TaskCard
                  task={task}
                  isSubtask={false}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver ? (e) => onDragOver(e, column.id) : undefined}
                  onDrop={onDrop ? (e) => onDrop(e, column.id) : undefined}
                  isDragging={dragItem === task.id}
                  isMobile={isMobile}
                  onLongPress={onLongPress}
                  onLongPressEnd={onLongPressEnd}
                  isLongPressing={longPressProgress === task.id}
                />
                {(subtasksMap[task.id] || []).map((sub) => (
                  <TaskCard
                    key={sub.id}
                    task={sub}
                    isSubtask={true}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver ? (e) => onDragOver(e, column.id) : undefined}
                    onDrop={onDrop ? (e) => onDrop(e, column.id) : undefined}
                    isDragging={dragItem === sub.id}
                    isMobile={isMobile}
                    onLongPress={onLongPress}
                    onLongPressEnd={onLongPressEnd}
                    isLongPressing={longPressProgress === sub.id}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DesktopBoardView({
  columns,
  getColumnTasks,
  getSubtasks,
  handleAddTask,
  handleDragStart,
  handleDragOver,
  handleDrop,
  dragItem,
  generating,
}) {
  return (
    <main style={styles.boardDesktop}>
      <div style={styles.columnsContainer}>
        {columns.map((col) => {
          const tasks = getColumnTasks(col.id);
          const subtasksMap = {};
          tasks.forEach((t) => {
            subtasksMap[t.id] = getSubtasks(t.id);
          });
          return (
            <Column
              key={col.id}
              column={col}
              tasks={tasks}
              subtasksMap={subtasksMap}
              onAddTask={handleAddTask}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              dragItem={dragItem}
              generating={generating && col.id === 'todo'}
              isMobile={false}
            />
          );
        })}
      </div>
    </main>
  );
}

function MobileBoardView({
  columns,
  mobileCol,
  setMobileCol,
  getColumnTasks,
  getSubtasks,
  handleAddTask,
  generating,
  longPressProgress,
  startLongPress,
  cancelLongPress,
}) {
  const scrollRef = useRef(null);

  function handleScroll() {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const colWidth = scrollRef.current.clientWidth;
    const idx = Math.round(scrollLeft / colWidth);
    if (idx !== mobileCol && idx >= 0 && idx < columns.length) {
      setMobileCol(idx);
    }
  }

  return (
    <main style={styles.boardMobile}>
      <div style={styles.mobileDots}>
        {columns.map((col) => {
          const activeColumn = columns[mobileCol];
          const isActive = activeColumn && activeColumn.id === col.id;

          return (
          <button
            key={col.id}
            style={{
              ...styles.dotNav,
              background: isActive ? 'var(--accent)' : 'var(--border-subtle)',
              width: isActive ? '20px' : '8px',
            }}
            onClick={() => {
              const columnIndex = columns.findIndex((item) => item.id === col.id);
              setMobileCol(columnIndex);
              if (scrollRef.current && scrollRef.current.children[columnIndex]) {
                scrollRef.current.children[columnIndex].scrollIntoView({ behavior: 'smooth', inline: 'start' });
              }
            }}
          />
          );
        })}
      </div>

      <div ref={scrollRef} style={styles.mobileScroll} onScroll={handleScroll}>
        {columns.map((col) => {
          const tasks = getColumnTasks(col.id);
          const subtasksMap = {};
          tasks.forEach((task) => {
            subtasksMap[task.id] = getSubtasks(task.id);
          });

          return (
            <div key={col.id} style={styles.mobileColWrap}>
              <Column
                column={col}
                tasks={tasks}
                subtasksMap={subtasksMap}
                onAddTask={handleAddTask}
                isMobile={true}
                onLongPress={startLongPress}
                onLongPressEnd={cancelLongPress}
                longPressProgress={longPressProgress}
                generating={generating && col.id === 'todo'}
              />
            </div>
          );
        })}
      </div>
    </main>
  );
}

const styles = {
  page: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-primary)',
    overflow: 'hidden',
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    inset: '64px 0 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 5,
  },
  loadingCard: {
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-surface-raised)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-md)',
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  headerRight: {},
  taskCount: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  backBtn: {
    padding: '8px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
  },
  breadcrumb: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '1px',
  },
  breadcrumbLink: {
    cursor: 'pointer',
    color: 'var(--accent)',
  },
  breadcrumbSep: {
    color: 'var(--text-tertiary)',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
  },

  boardDesktop: {
    flex: 1,
    overflow: 'hidden',
    padding: '20px',
  },
  columnsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    height: '100%',
  },

  column: {
    background: 'var(--bg-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    maxHeight: '100%',
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0,
  },
  columnHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  columnLabel: {
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--text-secondary)',
  },
  columnCount: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-tertiary)',
    background: 'var(--bg-surface-raised)',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  addTaskBtn: {
    width: '30px',
    height: '30px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background var(--transition), color var(--transition)',
  },
  columnBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 12px',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  taskCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    cursor: 'grab',
    transition: 'box-shadow var(--transition), border-color var(--transition)',
    position: 'relative',
    overflow: 'hidden',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  subtaskCard: {
    marginLeft: '20px',
    borderLeft: '2px solid var(--accent)',
    background: 'rgba(124, 92, 252, 0.04)',
  },
  taskCardDragging: {
    opacity: 0.6,
    boxShadow: 'var(--shadow-lg)',
    transform: 'rotate(2deg) scale(1.02)',
    borderColor: 'var(--accent)',
  },
  taskCardLongPress: {
    boxShadow: '0 0 0 2px var(--accent)',
    borderColor: 'var(--accent)',
    cursor: 'pointer',
  },
  longPressProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '2px',
    background: 'var(--accent)',
    borderRadius: '1px',
  },
  taskHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
  },
  taskTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    lineHeight: '1.4',
    flex: 1,
  },
  aiBadge: {
    width: '22px',
    height: '22px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--ai-badge-bg)',
    color: 'var(--ai-badge-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '1px',
  },
  taskDesc: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '6px',
    lineHeight: '1.5',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  taskDue: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    marginTop: '8px',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-surface-raised)',
  },
  taskDueOverdue: {
    color: 'var(--danger)',
    background: 'rgba(229, 85, 75, 0.1)',
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    gap: '6px',
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--text-tertiary)',
    fontWeight: '500',
    marginTop: '8px',
  },
  emptyHint: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
  },

  generatingIndicator: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '32px 20px',
  },
  generatingDots: {
    display: 'flex',
    gap: '6px',
  },
  genDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--accent)',
    animation: 'pulse 1.4s ease-in-out infinite',
  },
  genText: {
    fontSize: '13px',
    color: 'var(--ai-badge-text)',
  },

  boardMobile: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  mobileDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 16px',
    flexShrink: 0,
  },
  dotNav: {
    height: '8px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: 0,
  },
  mobileScroll: {
    flex: 1,
    display: 'flex',
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch',
    scrollBehavior: 'smooth',
    padding: '0 12px 12px',
    gap: '12px',
  },
  mobileColWrap: {
    minWidth: 'calc(100vw - 24px)',
    scrollSnapAlign: 'start',
    display: 'flex',
    flexDirection: 'column',
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    zIndex: 100,
  },
  modal: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)',
    padding: '28px',
    width: '100%',
    maxWidth: '400px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  modalSub: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '20px',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  modalInput: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-input)',
    fontSize: '15px',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  modalTextarea: {
    minHeight: '70px',
    lineHeight: '1.5',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '10px 18px',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
  },
  createBtn: {
    padding: '10px 22px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
  },

  bottomSheet: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'var(--bg-surface)',
    borderTopLeftRadius: 'var(--radius-xl)',
    borderTopRightRadius: 'var(--radius-xl)',
    padding: '20px 24px 32px',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
    zIndex: 101,
    maxWidth: '480px',
    margin: '0 auto',
  },
  sheetHandle: {
    width: '36px',
    height: '4px',
    borderRadius: '2px',
    background: 'var(--border-subtle)',
    margin: '0 auto 16px',
  },
  sheetTitle: {
    fontSize: '17px',
    fontWeight: '600',
    marginBottom: '2px',
  },
  sheetSub: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '20px',
  },
  sheetOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  sheetOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface-raised)',
    fontSize: '15px',
    fontWeight: '500',
    textAlign: 'left',
  },
  sheetDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  sheetCancel: {
    width: '100%',
    padding: '13px',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    border: '1px solid var(--border-subtle)',
  },
};
