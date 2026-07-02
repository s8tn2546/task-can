import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationPrompt() {
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  function handleAllow() {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
    setVisible(false);
    setTimeout(() => setDismissed(true), 300);
  }

  function handleDismiss() {
    setVisible(false);
    setTimeout(() => setDismissed(true), 300);
  }

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          style={styles.banner}
        >
          <div style={styles.bannerContent}>
            <div style={styles.bannerIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <div style={styles.bannerText}>
              <span style={styles.bannerTitle}>Get notified</span>
              <span style={styles.bannerDesc}>Receive reminders for upcoming tasks</span>
            </div>
          </div>
          <div style={styles.bannerActions}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={styles.allowBtn}
              onClick={handleAllow}
            >
              Allow
            </motion.button>
            <button style={styles.laterBtn} onClick={handleDismiss}>
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const styles = {
  banner: {
    position: 'fixed',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 200,
    background: 'var(--bg-surface-raised)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: 'var(--shadow-md)',
    maxWidth: '420px',
    width: 'calc(100% - 32px)',
  },
  bannerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    minWidth: 0,
  },
  bannerIcon: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent-glow)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bannerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  bannerTitle: {
    fontSize: '14px',
    fontWeight: '600',
  },
  bannerDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  bannerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  allowBtn: {
    padding: '6px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
  },
  laterBtn: {
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
};
