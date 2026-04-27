import { useEffect } from 'react';
import HistoryView from './HistoryView.jsx';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import './HistoryOverlay.css';

const TITLE_ID = 'history-overlay-title';

export default function HistoryOverlay({ open, onClose, onRestored }) {
  const sheetRef = useFocusTrap(open);

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
    <div className="history-overlay" role="dialog" aria-modal="true" aria-labelledby={TITLE_ID}>
      <div className="history-overlay__backdrop" onClick={onClose} />
      <div className="history-overlay__sheet" role="document" ref={sheetRef}>
        <header className="history-overlay__header">
          <h2 className="history-overlay__title" id={TITLE_ID}>履歴</h2>
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
