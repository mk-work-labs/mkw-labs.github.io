import { useEffect } from 'react';
import { RANKS } from '../../logic/cards.js';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import './RankPicker.css';

const SLOT_LABELS = {
  'player-0': 'プレイヤー 1 枚目',
  'player-1': 'プレイヤー 2 枚目',
  dealer: 'ディーラー',
};

const TITLE_ID = 'rank-picker-title';

export default function RankPicker({ slot, onPick, onClose }) {
  const sheetRef = useFocusTrap(slot !== null);

  useEffect(() => {
    if (slot === null) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slot, onClose]);

  if (slot === null) return null;

  return (
    <div className="rank-picker" role="dialog" aria-modal="true" aria-labelledby={TITLE_ID}>
      <div className="rank-picker__backdrop" onClick={onClose} />
      <div className="rank-picker__sheet" role="document" ref={sheetRef}>
        <div className="rank-picker__header">
          <h2 className="rank-picker__title" id={TITLE_ID}>{SLOT_LABELS[slot]}</h2>
          <button
            type="button"
            className="rank-picker__close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        <div className="rank-picker__ranks">
          {RANKS.map((rank) => (
            <button
              key={rank}
              type="button"
              className="rank-picker__rank"
              onClick={() => onPick(rank)}
              title={rank === '10' ? '10 / J / Q / K' : rank}
              aria-label={rank === '10' ? '10 / J / Q / K' : rank}
            >
              {rank}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
