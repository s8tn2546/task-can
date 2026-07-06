import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';

export default function BoardCreationChoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, generateTasks } = useApp();
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState(null);

  const boardId = searchParams.get('boardId');
  const boardName = searchParams.get('name') || 'Untitled';
  const generating = state.generatingTasks;

  function handleAIAssisted() {
    setMode('ai');
  }

  function handleBlank() {
    navigate(boardId ? `/board/${boardId}` : '/');
  }

  function handleGenerate() {
    if (!prompt.trim() || generating) return;
    if (!boardId) return;
    void generateTasks(boardId, prompt.trim());
    navigate(`/board/${boardId}`);
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div>
          <span style={styles.breadcrumb}>New Board</span>
          <h1 style={styles.title}>{boardName}</h1>
        </div>
      </header>

      <main style={styles.main}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={styles.choiceCard}
        >
          {!mode ? (
            <>
              <div style={styles.choiceHeader}>
                <div style={styles.choiceIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </div>
                <h2 style={styles.choiceTitle}>How would you like to start?</h2>
                <p style={styles.choiceSub}>
                  Let AI generate tasks from a description, or start with an empty board
                </p>
              </div>

              <div style={styles.options}>
                <motion.button
                  whileHover={{ y: -2, borderColor: 'var(--accent)' }}
                  whileTap={{ scale: 0.98 }}
                  style={styles.optionCard}
                  onClick={handleAIAssisted}
                >
                  <div style={styles.optionIconWrap}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 3 21 3 21 8" />
                      <line x1="4" y1="20" x2="21" y2="3" />
                      <polyline points="21 16 21 21 16 21" />
                      <line x1="15" y1="15" x2="21" y2="21" />
                      <line x1="4" y1="4" x2="9" y2="9" />
                    </svg>
                  </div>
                  <div style={styles.optionText}>
                    <h3 style={styles.optionTitle}>AI Assisted</h3>
                    <p style={styles.optionDesc}>
                      Describe your goal, and we'll generate a structured task list
                    </p>
                  </div>
                  <div style={styles.optionArrow}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ y: -2, borderColor: 'var(--border-hover)' }}
                  whileTap={{ scale: 0.98 }}
                  style={styles.optionCard}
                  onClick={handleBlank}
                >
                  <div style={styles.optionIconWrapBlank}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </div>
                  <div style={styles.optionText}>
                    <h3 style={styles.optionTitle}>Blank Board</h3>
                    <p style={styles.optionDesc}>
                      Start from scratch and add tasks manually
                    </p>
                  </div>
                  <div style={styles.optionArrow}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </motion.button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div style={styles.choiceHeader}>
                <div style={{
                  ...styles.choiceIcon,
                  background: 'var(--accent-glow)',
                  color: 'var(--accent)',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 3 21 3 21 8" />
                    <line x1="4" y1="20" x2="21" y2="3" />
                    <polyline points="21 16 21 21 16 21" />
                    <line x1="15" y1="15" x2="21" y2="21" />
                    <line x1="4" y1="4" x2="9" y2="9" />
                  </svg>
                </div>
                <h2 style={styles.choiceTitle}>Describe your goal</h2>
                <p style={styles.choiceSub}>
                  Tell AI what you want to accomplish, and it will generate tasks for you
                </p>
              </div>

              <div style={styles.promptArea}>
                <textarea
                  style={styles.textarea}
                  placeholder="e.g., Plan a birthday party, Build a portfolio website, Organize a team offsite..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  autoFocus
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    ...styles.generateBtn,
                    opacity: prompt.trim() && !generating ? 1 : 0.5,
                  }}
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || generating}
                >
                  {generating ? (
                    <span style={styles.generatingRow}>
                      <span style={styles.spinner} />
                      Generating tasks...
                    </span>
                  ) : (
                    <span style={styles.generateRow}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 3 21 3 21 8" />
                        <line x1="4" y1="20" x2="21" y2="3" />
                        <polyline points="21 16 21 21 16 21" />
                        <line x1="15" y1="15" x2="21" y2="21" />
                        <line x1="4" y1="4" x2="9" y2="9" />
                      </svg>
                      Generate Tasks
                    </span>
                  )}
                </motion.button>
              </div>

              {generating && (
                <div style={styles.generatingHint}>
                  <div style={styles.generatingDots}>
                    <span style={{ ...styles.dot, animationDelay: '0s' }} />
                    <span style={{ ...styles.dot, animationDelay: '0.3s' }} />
                    <span style={{ ...styles.dot, animationDelay: '0.6s' }} />
                  </div>
                  <span style={styles.generatingText}>
                    AI is analyzing your goal and creating a structured task breakdown…
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>
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
    gap: '16px',
    padding: '16px 32px',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface)',
  },
  backBtn: {
    padding: '8px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
  },
  breadcrumb: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: '2px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
  },
  main: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '64px 24px',
  },
  choiceCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)',
    padding: '40px',
  },
  choiceHeader: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  choiceIcon: {
    width: '56px',
    height: '56px',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--accent-glow)',
    color: 'var(--accent)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  choiceTitle: {
    fontSize: '22px',
    fontWeight: '700',
    marginBottom: '8px',
    letterSpacing: '-0.3px',
  },
  choiceSub: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  optionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface-raised)',
    textAlign: 'left',
    transition: 'border-color var(--transition)',
  },
  optionIconWrap: {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent-glow)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionIconWrapBlank: {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '2px',
  },
  optionDesc: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  optionArrow: {
    flexShrink: 0,
  },
  promptArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  textarea: {
    width: '100%',
    padding: '14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-input)',
    fontSize: '15px',
    color: 'var(--text-primary)',
    outline: 'none',
    resize: 'vertical',
    minHeight: '100px',
    lineHeight: '1.6',
  },
  generateBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  generatingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  generatingHint: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '20px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent-glow)',
    border: '1px solid rgba(124, 92, 252, 0.2)',
  },
  generatingDots: {
    display: 'flex',
    gap: '6px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--accent)',
    animation: 'pulse 1.4s ease-in-out infinite',
  },
  generatingText: {
    fontSize: '13px',
    color: 'var(--ai-badge-text)',
    textAlign: 'center',
  },
};
