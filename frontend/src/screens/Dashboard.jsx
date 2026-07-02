import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import NotificationPrompt from '../components/NotificationPrompt';

export default function Dashboard() {
  const { state, createWorkspace, logout } = useApp();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [wsName, setWsName] = useState('');

  function handleCreate() {
    if (!wsName.trim()) return;
    const ws = createWorkspace(wsName.trim());
    setWsName('');
    setShowCreate(false);
    navigate(`/workspace/${ws.id}`);
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={styles.page}>
      <NotificationPrompt />

      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <span style={styles.brandName}>TaskCan</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{state.user?.displayName || 'User'}</span>
          <button style={styles.logoutBtn} onClick={handleLogout} title="Sign out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.greeting}>
          <h1 style={styles.title}>Your Workspaces</h1>
          <p style={styles.subtitle}>
            {state.workspaces.length === 0
              ? 'Create your first workspace to get started'
              : `${state.workspaces.length} workspace${state.workspaces.length > 1 ? 's' : ''}`}
          </p>
        </div>

        <div style={styles.grid}>
          <AnimatePresence mode="popLayout">
            {state.workspaces.map((ws, i) => (
              <motion.div
                key={ws.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                style={styles.workspaceCard}
                onClick={() => navigate(`/workspace/${ws.id}`)}
                whileHover={{ y: -3, borderColor: 'var(--border-hover)' }}
              >
                <div style={styles.cardIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <div style={styles.cardInfo}>
                  <h3 style={styles.cardTitle}>{ws.name}</h3>
                  <p style={styles.cardMeta}>
                    {ws.boardCount || (state.boards[ws.id]?.length ?? 0)} board{(ws.boardCount || (state.boards[ws.id]?.length ?? 0)) !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={styles.cardArrow}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
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
            <span style={styles.addText}>Create Workspace</span>
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
              <h2 style={styles.modalTitle}>New Workspace</h2>
              <p style={styles.modalSub}>Give your workspace a name</p>
              <input
                style={styles.modalInput}
                placeholder="e.g. Personal, Work, Side Project"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <div style={styles.modalActions}>
                <button style={styles.cancelBtn} onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    ...styles.createBtn,
                    opacity: wsName.trim() ? 1 : 0.5,
                  }}
                  onClick={handleCreate}
                  disabled={!wsName.trim()}
                >
                  Create
                </motion.button>
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
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  userName: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  logoutBtn: {
    padding: '8px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    transition: 'color var(--transition), background var(--transition)',
  },
  main: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '48px 32px',
  },
  greeting: {
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    marginTop: '6px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px',
  },
  workspaceCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'border-color var(--transition), box-shadow var(--transition)',
  },
  cardIcon: {
    width: '44px',
    height: '44px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent-glow)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '2px',
  },
  cardMeta: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  cardArrow: {
    flexShrink: 0,
  },
  addCard: {
    background: 'var(--bg-surface)',
    border: '1px dashed var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minHeight: '160px',
    cursor: 'pointer',
    transition: 'border-color var(--transition)',
  },
  addIcon: {
    width: '44px',
    height: '44px',
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
    maxWidth: '400px',
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
};
