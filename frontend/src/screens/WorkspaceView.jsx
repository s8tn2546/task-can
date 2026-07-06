import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';

export default function WorkspaceView() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { state, createBoard, loadWorkspace } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchWorkspace() {
      try {
        if (workspaceId) {
          await loadWorkspace(workspaceId);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchWorkspace();

    return () => {
      active = false;
    };
  }, [loadWorkspace, workspaceId]);

  const workspace = state.workspaces.find((w) => w.id === workspaceId);
  const boards = state.boards[workspaceId] || [];

  async function handleCreateAi() {
    if (!boardName.trim()) return;
    const board = await createBoard(workspaceId, boardName.trim());
    setBoardName('');
    setShowCreate(false);
    navigate(`/workspace/${workspaceId}/boards/new?boardId=${board.id}&name=${encodeURIComponent(board.name)}`);
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.notFound}>
          <h2>Loading workspace...</h2>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div style={styles.page}>
        <div style={styles.notFound}>
          <h2>Workspace not found</h2>
          <button style={styles.backLink} onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div style={styles.headerInfo}>
          <span style={styles.breadcrumb}>
            <button style={styles.breadcrumbLink} onClick={() => navigate('/')}>Workspaces</button>
            <span style={styles.breadcrumbSep}>/</span>
            <span>{workspace.name}</span>
          </span>
          <h1 style={styles.title}>{workspace.name}</h1>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Boards</h2>
          <p style={styles.sectionCount}>{boards.length} board{boards.length !== 1 ? 's' : ''}</p>
        </div>

        <div style={styles.grid}>
          <AnimatePresence mode="popLayout">
            {boards.map((board, i) => (
              <motion.div
                key={board.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                style={styles.boardCard}
                onClick={() => navigate(`/board/${board.id}`)}
                whileHover={{ y: -3, borderColor: 'var(--border-hover)' }}
              >
                <div style={styles.boardCardTop}>
                  <div style={styles.boardIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                  </div>
                </div>
                <div style={styles.boardCardInfo}>
                  <h3 style={styles.boardCardTitle}>{board.name}</h3>
                  <p style={styles.boardCardMeta}>
                    {(state.tasks[board.id]?.length || 0)} task{(state.tasks[board.id]?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.button
            whileHover={{ y: -3, borderColor: 'var(--accent)' }}
            whileTap={{ scale: 0.98 }}
            style={styles.addCard}
            onClick={() => setShowCreate(true)}
          >
            <div style={styles.addIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span style={styles.addText}>Add Board</span>
          </motion.button>
        </div>
      </main>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.overlay}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              style={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={styles.modalTitle}>New Board</h2>
              <p style={styles.modalSub}>Name your board</p>
              <input
                style={styles.modalInput}
                placeholder="e.g. Sprint 13, Design Review"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && boardName.trim()) handleCreateAi();
                }}
              />
              <div style={styles.choiceGroup}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    ...styles.choiceBtn,
                    ...styles.choiceBtnAccent,
                    opacity: boardName.trim() ? 1 : 0.5,
                  }}
                  onClick={handleCreateAi}
                  disabled={!boardName.trim()}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 3 21 3 21 8" />
                    <line x1="4" y1="20" x2="21" y2="3" />
                    <polyline points="21 16 21 21 16 21" />
                    <line x1="15" y1="15" x2="21" y2="21" />
                    <line x1="4" y1="4" x2="9" y2="9" />
                  </svg>
                  Create New Board
                </motion.button>
              </div>
              <div style={styles.modalActions}>
                <button style={styles.cancelBtn} onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
  },
  notFound: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    gap: '16px',
  },
  backLink: {
    color: 'var(--accent)',
    fontSize: '15px',
    fontWeight: '500',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 32px',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface)',
  },
  backBtn: {
    padding: '8px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    transition: 'color var(--transition), background var(--transition)',
  },
  headerInfo: {
    flex: 1,
  },
  breadcrumb: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '2px',
  },
  breadcrumbLink: {
    color: 'var(--accent)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
  },
  breadcrumbSep: {
    color: 'var(--text-tertiary)',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
  },
  main: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '40px 32px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    marginBottom: '28px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
  },
  sectionCount: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px',
  },
  boardCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    cursor: 'pointer',
    transition: 'border-color var(--transition), box-shadow var(--transition)',
  },
  boardCardTop: {
    marginBottom: '12px',
  },
  boardIcon: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent-glow)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardCardInfo: {},
  boardCardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '2px',
  },
  boardCardMeta: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  addCard: {
    background: 'var(--bg-surface)',
    border: '1px dashed var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '32px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'border-color var(--transition)',
    minHeight: '140px',
  },
  addIcon: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent-glow)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: '15px',
    fontWeight: '500',
    color: 'var(--accent)',
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
    padding: '32px',
    width: '100%',
    maxWidth: '440px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  modalSub: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
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
    marginBottom: '20px',
  },
  choiceGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  choiceBtn: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface-raised)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  choiceBtnAccent: {
    borderColor: 'var(--accent)',
    color: 'var(--accent)',
    background: 'var(--accent-glow)',
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
};
