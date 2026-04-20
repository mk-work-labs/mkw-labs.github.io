import { useState } from 'react';
import CardSelector from './CardSelector.jsx';
import RankPicker from './RankPicker.jsx';
import { judgeAction } from '../../logic/strategy/index.js';
import './StrategyPanel.css';

const ACTION_LABELS = {
  H:  { text: 'ヒット',       variant: 'hit' },
  S:  { text: 'スタンド',     variant: 'stand' },
  D:  { text: 'ダブルダウン', variant: 'double' },
  Ds: { text: 'ダブルダウン', variant: 'double' },
  P:  { text: 'スプリット',   variant: 'split' },
};

function nextEmptySlot(playerCards, dealerCard) {
  if (playerCards[0] === null) return 'player-0';
  if (playerCards[1] === null) return 'player-1';
  if (dealerCard === null) return 'dealer';
  return null;
}

export default function StrategyPanel() {
  const [playerCards, setPlayerCards] = useState([null, null]);
  const [dealerCard, setDealerCard] = useState(null);
  const [pickerSlot, setPickerSlot] = useState(null);

  const handleSlotClick = (slot) => setPickerSlot(slot);

  const handleClear = () => {
    setPlayerCards([null, null]);
    setDealerCard(null);
    setPickerSlot(null);
  };

  const handlePick = (rank) => {
    let nextPlayer = playerCards;
    let nextDealer = dealerCard;
    if (pickerSlot === 'player-0') nextPlayer = [rank, playerCards[1]];
    else if (pickerSlot === 'player-1') nextPlayer = [playerCards[0], rank];
    else if (pickerSlot === 'dealer') nextDealer = rank;
    setPlayerCards(nextPlayer);
    setDealerCard(nextDealer);
    setPickerSlot(nextEmptySlot(nextPlayer, nextDealer));
  };

  const handleClose = () => setPickerSlot(null);

  const action = judgeAction(playerCards, dealerCard);
  const actionLabel = action ? ACTION_LABELS[action] : null;

  return (
    <section className="strategy-panel">
      <CardSelector
        playerCards={playerCards}
        dealerCard={dealerCard}
        onSlotClick={handleSlotClick}
        onClear={handleClear}
      />
      <div className="strategy-panel__result">
        <div className="strategy-panel__result-row">
          <span className="strategy-panel__result-label">推奨</span>
          {actionLabel ? (
            <span
              className={`strategy-panel__action strategy-panel__action--${actionLabel.variant}`}
            >
              {actionLabel.text}
            </span>
          ) : (
            <span className="strategy-panel__result-placeholder">—</span>
          )}
        </div>
        <div className="strategy-panel__result-row">
          <span className="strategy-panel__result-label">勝率</span>
          <span className="strategy-panel__result-placeholder">—</span>
        </div>
      </div>
      <RankPicker
        slot={pickerSlot}
        onPick={handlePick}
        onClose={handleClose}
      />
    </section>
  );
}
