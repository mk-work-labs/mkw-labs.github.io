import { useEffect } from 'react';
import HistoryView from './HistoryView.jsx';
import './HistoryOverlay.css';

export default function HistoryOverlay({ open, onClose, onRestored }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleRestore = (entry) => {
    onRestored?.(entry);
    onClose();
  };

  return (
    <div className="history-overlay" role="dialog" aria-modal="true" aria-label="履歴">
      <div className="history-overlay__backdrop" onClick={onClose} />
      <div className="history-overlay__sheet" role="document">
        <header className="history-overlay__header">
          <h2 className="history-overlay__title">履歴</h2>
          <button
            type="button"
            className="history-overlay__close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </header>
        <div className="history-overlay__body">
          <HistoryView onRestore={handleRestore} />
        </div>
      </div>
    </div>
  );
}
