import { useEffect } from 'react';
import SettingsForm from './SettingsForm.jsx';
import './SettingsOverlay.css';

export default function SettingsOverlay({ open, onClose, onSaved }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="settings-overlay" role="dialog" aria-modal="true" aria-label="設定">
      <div className="settings-overlay__backdrop" onClick={onClose} />
      <div className="settings-overlay__sheet" role="document">
        <header className="settings-overlay__header">
          <h2 className="settings-overlay__title">設定</h2>
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
          <SettingsForm onSaved={onSaved} />
        </div>
      </div>
    </div>
  );
}
