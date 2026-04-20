import './CardSelector.css';

export default function CardSelector({
  playerCards,
  dealerCard,
  onSlotClick,
  onAddSlot,
  onClear,
}) {
  const canAdd = playerCards[0] !== null && playerCards[1] !== null;

  const renderSlot = (slot, value, extraClass) => {
    const classes = ['card-slot'];
    if (extraClass) classes.push(extraClass);
    if (value === null) classes.push('card-slot--empty');
    return (
      <button
        key={slot}
        type="button"
        className={classes.join(' ')}
        onClick={() => onSlotClick(slot)}
        aria-label={value === null ? `${slot} 未選択` : `${slot} ${value}`}
      >
        {value ?? ''}
      </button>
    );
  };

  return (
    <div className="card-selector">
      <section className="card-selector__section">
        <h2 className="card-selector__label">プレイヤー</h2>
        <div className="card-selector__slots">
          {playerCards.map((value, i) =>
            renderSlot(
              `player-${i}`,
              value,
              i >= 2 ? 'card-slot--hit' : null
            )
          )}
          <button
            type="button"
            className="card-selector__add"
            onClick={onAddSlot}
            disabled={!canAdd}
            aria-label="カードを追加"
            title="ヒットで引いたカードを追加"
          >
            +
          </button>
          <button
            type="button"
            className="card-selector__clear"
            onClick={onClear}
          >
            クリア
          </button>
        </div>
      </section>

      <section className="card-selector__section">
        <h2 className="card-selector__label">ディーラー</h2>
        <div className="card-selector__slots">
          {renderSlot('dealer', dealerCard)}
        </div>
      </section>
    </div>
  );
}
