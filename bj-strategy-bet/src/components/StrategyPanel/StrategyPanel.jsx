import { useState } from 'react';
import CardSelector from './CardSelector.jsx';
import RankPicker from './RankPicker.jsx';
import { judgeAction } from '../../logic/strategy/index.js';
import { handTotal } from '../../logic/strategy/calculator.js';
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

function playerSlotIndex(slot) {
  const match = /^player-(\d+)$/.exec(slot);
  return match ? Number(match[1]) : null;
}

function describeHand(playerCards) {
  const filled = playerCards.filter((c) => c !== null);
  if (filled.length < 2) return null;
  if (filled.length === 2 && filled[0] === filled[1]) {
    return { label: `ペア ${filled[0]},${filled[1]}`, bust: false };
  }
  const { total, isSoft } = handTotal(filled);
  if (total > 21) {
    return { label: `${total}（バースト）`, bust: true };
  }
  return { label: `${isSoft ? 'ソフト' : 'ハード'} ${total}`, bust: false };
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

  const handleAddSlot = () => {
    setPlayerCards((prev) => {
      const nextIndex = prev.length;
      setPickerSlot(`player-${nextIndex}`);
      return [...prev, null];
    });
  };

  const handlePick = (rank) => {
    let nextPlayer = playerCards;
    let nextDealer = dealerCard;
    const idx = playerSlotIndex(pickerSlot);
    if (idx !== null) {
      nextPlayer = playerCards.map((v, i) => (i === idx ? rank : v));
    } else if (pickerSlot === 'dealer') {
      nextDealer = rank;
    }
    setPlayerCards(nextPlayer);
    setDealerCard(nextDealer);
    // 初期 3 枚（player-0, player-1, dealer）までは自動遷移。それ以降は閉じる
    const autoNext = nextEmptySlot(
      [nextPlayer[0] ?? null, nextPlayer[1] ?? null],
      nextDealer
    );
    setPickerSlot(autoNext);
  };

  const handleClose = () => setPickerSlot(null);

  const hand = describeHand(playerCards);
  const action = hand?.bust ? null : judgeAction(playerCards, dealerCard);
  const actionLabel = action ? ACTION_LABELS[action] : null;

  return (
    <section className="strategy-panel">
      <CardSelector
        playerCards={playerCards}
        dealerCard={dealerCard}
        onSlotClick={handleSlotClick}
        onAddSlot={handleAddSlot}
        onClear={handleClear}
      />
      <div className="strategy-panel__result">
        <div className="strategy-panel__result-row">
          <span className="strategy-panel__result-label">合計</span>
          {hand ? (
            <span
              className={
                'strategy-panel__hand' +
                (hand.bust ? ' strategy-panel__hand--bust' : '')
              }
            >
              {hand.label}
            </span>
          ) : (
            <span className="strategy-panel__result-placeholder">—</span>
          )}
        </div>
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
      </div>
      <RankPicker
        slot={pickerSlot}
        onPick={handlePick}
        onClose={handleClose}
      />
    </section>
  );
}
