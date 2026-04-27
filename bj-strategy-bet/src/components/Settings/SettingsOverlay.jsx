import { useEffect, useState } from 'react';
import SettingsForm from './SettingsForm.jsx';
import StrategyEditor from '../StrategyEditor/StrategyEditor.jsx';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import './SettingsOverlay.css';

const TITLE_ID = 'settings-overlay-title';

export default function SettingsOverlay({ open, onClose, onSaved, onStrategyChanged }) {
  const [view, setView] = useState('settings');
  const sheetRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setView('settings');
  }, [open]);

  if (!open) return null;

  const title = view === 'strategy' ? 'ストラテジー表 編集' : '設定';

  return (
    <div className="settings-overlay" role="dialog" aria-modal="true" aria-labelledby={TITLE_ID}>
      <div className="settings-overlay__backdrop" onClick={onClose} />
      <div className="settings-overlay__sheet" role="document" ref={sheetRef}>
        <header className="settings-overlay__header">
          <h2 className="settings-overlay__title" id={TITLE_ID}>{title}</h2>
          <button
            type="button"
            className="settings-overlay__close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </header>
        <div className="settings-overlay__body">
          {view === 'settings' ? (
            <SettingsForm
              onSaved={onSaved}
              onEditStrategy={() => setView('strategy')}
            />
          ) : (
            <StrategyEditor
              onBack={() => setView('settings')}
              onChange={onStrategyChanged}
            />
          )}
        </div>
      </div>
    </div>
  );
}
