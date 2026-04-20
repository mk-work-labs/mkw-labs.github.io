import './CardSelector.css';

export default function CardSelector({
  playerCards,
  dealerCard,
  onSlotClick,
  onClear,
}) {
  const renderSlot = (slot, value) => {
    const classes = ['card-slot'];
    if (value === null) classes.push('card-slot--empty');
    return (
      <button
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
          {renderSlot('player-0', playerCards[0])}
          {renderSlot('player-1', playerCards[1])}
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
