import { useEffect, useRef, useState } from 'react';
import {
  getEffectiveStrategy,
} from '../../logic/strategy/index.js';
import {
  saveCustomCell,
  resetCustomTable,
  resetAllCustom,
} from '../../storage/strategy-storage.js';
import './StrategyEditor.css';

const DEALER_COLS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
const HARD_ROWS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const SOFT_ROWS = [13, 14, 15, 16, 17, 18, 19, 20, 21];
const PAIR_ROWS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

const TABS = [
  { id: 'hard', label: 'ハード', rows: HARD_ROWS, rowLabel: (k) => k },
  { id: 'soft', label: 'ソフト', rows: SOFT_ROWS, rowLabel: (k) => `A+${k - 11}` },
  { id: 'pair', label: 'ペア',   rows: PAIR_ROWS, rowLabel: (k) => `${k},${k}` },
];

// ハード表に Ds は仕様書 §4.2.4 にないため選ばせない。P はペア限定
const ACTIONS_BY_TYPE = {
  hard: ['H', 'S', 'D'],
  soft: ['H', 'S', 'D', 'Ds'],
  pair: ['H', 'S', 'D', 'Ds', 'P'],
};

const ACTION_VARIANT = {
  H: 'hit',
  S: 'stand',
  D: 'double',
  Ds: 'double',
  P: 'split',
};

export default function StrategyEditor({ onChange, onBack }) {
  const [activeTab, setActiveTab] = useState('hard');
  const [strategy, setStrategy] = useState(() => getEffectiveStrategy());
  const [picker, setPicker] = useState(null); // { type, rowKey, dealer, x, y }
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!picker) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') setPicker(null);
    };
    const handleClick = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setPicker(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('touchstart', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('touchstart', handleClick);
    };
  }, [picker]);

  const openPicker = (type, rowKey, dealer) => {
    setPicker({ type, rowKey, dealer });
  };

  const handlePick = (action) => {
    if (!picker) return;
    saveCustomCell(picker.type, picker.rowKey, picker.dealer, action);
    const next = getEffectiveStrategy();
    setStrategy(next);
    setPicker(null);
    onChange?.(next);
  };

  const handleResetTable = (type) => {
    const tab = TABS.find((t) => t.id === type);
    const label = tab ? tab.label : type;
    if (!window.confirm(`${label}表をデフォルトに戻します。よろしいですか？`)) return;
    resetCustomTable(type);
    const next = getEffectiveStrategy();
    setStrategy(next);
    onChange?.(next);
  };

  const handleResetAll = () => {
    if (!window.confirm('ストラテジー表のカスタマイズを全て破棄してデフォルトに戻します。よろしいですか？')) return;
    resetAllCustom();
    const next = getEffectiveStrategy();
    setStrategy(next);
    onChange?.(next);
  };

  const tab = TABS.find((t) => t.id === activeTab);
  const table = strategy[activeTab];

  return (
    <div className="strategy-editor">
      <header className="strategy-editor__header">
        {onBack && (
          <button
            type="button"
            className="strategy-editor__back"
            onClick={onBack}
            aria-label="設定に戻る"
          >
            ← 戻る
          </button>
        )}
        <h2 className="strategy-editor__title">ストラテジー表 編集</h2>
      </header>

      <div className="strategy-editor__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === activeTab}
            className={
              'strategy-editor__tab' +
              (t.id === activeTab ? ' strategy-editor__tab--active' : '')
            }
            onClick={() => {
              setPicker(null);
              setActiveTab(t.id);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="strategy-editor__table-wrap">
        <table className="strategy-editor__table">
          <thead>
            <tr>
              <th className="strategy-editor__corner" scope="col">
                <span className="strategy-editor__corner-text">ディーラー →</span>
              </th>
              {DEALER_COLS.map((d) => (
                <th key={d} scope="col" className="strategy-editor__col-head">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tab.rows.map((rowKey) => (
              <tr key={rowKey}>
                <th scope="row" className="strategy-editor__row-head">
                  {tab.rowLabel(rowKey)}
                </th>
                {DEALER_COLS.map((dealer) => {
                  const value = table[rowKey]?.[dealer] ?? '';
                  const variant = ACTION_VARIANT[value] ?? '';
                  const isActive =
                    picker &&
                    picker.type === activeTab &&
                    String(picker.rowKey) === String(rowKey) &&
                    picker.dealer === dealer;
                  return (
                    <td key={dealer} className="strategy-editor__cell-wrap">
                      <button
                        type="button"
                        className={
                          'strategy-editor__cell' +
                          (variant ? ` strategy-editor__cell--${variant}` : '') +
                          (isActive ? ' strategy-editor__cell--active' : '')
                        }
                        onClick={() => openPicker(activeTab, rowKey, dealer)}
                        aria-label={`${tab.rowLabel(rowKey)} 対 ディーラー ${dealer}: ${value || '未設定'}`}
                      >
                        {value || '—'}
                      </button>
                      {isActive && (
                        <div
                          ref={pickerRef}
                          className="strategy-editor__popover"
                          role="menu"
                        >
                          {ACTIONS_BY_TYPE[activeTab].map((action) => (
                            <button
                              key={action}
                              type="button"
                              role="menuitem"
                              className={
                                'strategy-editor__popover-item' +
                                ` strategy-editor__popover-item--${ACTION_VARIANT[action]}` +
                                (action === value
                                  ? ' strategy-editor__popover-item--current'
                                  : '')
                              }
                              onClick={() => handlePick(action)}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="strategy-editor__legend" aria-hidden="true">
        <span className="strategy-editor__legend-item strategy-editor__legend-item--hit">H ヒット</span>
        <span className="strategy-editor__legend-item strategy-editor__legend-item--stand">S スタンド</span>
        <span className="strategy-editor__legend-item strategy-editor__legend-item--double">D/Ds ダブル</span>
        {activeTab === 'pair' && (
          <span className="strategy-editor__legend-item strategy-editor__legend-item--split">P スプリット</span>
        )}
      </div>

      <div className="strategy-editor__actions">
        <button
          type="button"
          className="strategy-editor__reset"
          onClick={() => handleResetTable(activeTab)}
        >
          この表をリセット
        </button>
        <button
          type="button"
          className="strategy-editor__reset strategy-editor__reset--danger"
          onClick={handleResetAll}
        >
          全体をリセット
        </button>
      </div>
    </div>
  );
}
