import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createMethod,
  getMethodLabel,
  resolveMethodId,
} from '../../logic/betting/registry.js';
import { loadSettings } from '../../storage/settings-storage.js';
import {
  loadSession,
  saveSession,
} from '../../storage/session-storage.js';
import { archiveSession } from '../../storage/history-storage.js';
import './BettingPanel.css';

function formatYen(n) {
  const sign = n < 0 ? '-' : '';
  return `${sign}¥${Math.abs(n).toLocaleString('ja-JP')}`;
}

function fundDelta(result, bet) {
  if (result === 'win') return bet;
  if (result === 'bj') return Math.round(bet * 1.5);
  if (result === 'loss') return -bet;
  return 0;
}

function buildInitialSession(settings, methodId) {
  return {
    startedAt: new Date().toISOString(),
    initialFund: settings.initialFund,
    baseBet: settings.baseBet,
    currentFund: settings.initialFund,
    currentMethod: methodId,
    methodState: {},
    hands: [],
    methodSwitches: [],
  };
}

// メソッド固有の状態表記（バーネット/グッドマンは「連勝 N」、モンテカルロは数列）
function describeMethodState(methodState) {
  if (!methodState) return null;
  if (methodState.name === 'montecarlo') {
    return `数列 [${methodState.sequence.join(', ')}]`;
  }
  return `連勝 ${methodState.consecutiveWins ?? 0}`;
}

export default function BettingPanel({ onHandsChange } = {}) {
  // 起動時に設定とセッションを解決。settings のメソッドと session の
  // currentMethod が異なる場合、method を切替えた扱い（新規初期化）
  const bootstrapRef = useRef(null);
  if (bootstrapRef.current === null) {
    const settings = loadSettings();
    const activeMethodId = resolveMethodId(settings.bettingMethod);
    const stored = loadSession();
    const session = stored ?? buildInitialSession(settings, activeMethodId);
    const switched = session.currentMethod !== activeMethodId;
    bootstrapRef.current = {
      settings,
      activeMethodId,
      session,
      switched,
    };
  }
  const { settings, activeMethodId, session: initialSession, switched } =
    bootstrapRef.current;

  // method インスタンスは切替え時に作り直される構造にしたいので
  // activeMethodId 固定の前提でライフタイム中 1 つだけ保持
  const methodRef = useRef(null);
  if (methodRef.current === null) {
    const m = createMethod(activeMethodId, settings.baseBet);
    if (!switched) {
      m.restore(initialSession.methodState?.[activeMethodId]);
    }
    methodRef.current = m;
  }
  const method = methodRef.current;

  const [startedAt, setStartedAt] = useState(initialSession.startedAt);
  const [fund, setFund] = useState(initialSession.currentFund);
  const [hands, setHands] = useState(initialSession.hands ?? []);
  const [methodState, setMethodState] = useState(() => method.getState());

  // 資金編集
  const [editingFund, setEditingFund] = useState(false);
  const [editValue, setEditValue] = useState('');

  // state 変化時にセッションを永続化。methodState は current method の
  // キーに入れ、他メソッドの履歴は保持する
  useEffect(() => {
    const preservedMethodState = initialSession.methodState ?? {};
    saveSession({
      startedAt,
      initialFund: settings.initialFund,
      baseBet: settings.baseBet,
      currentFund: fund,
      currentMethod: activeMethodId,
      methodState: {
        ...preservedMethodState,
        [activeMethodId]: {
          // getState() の中身をそのまま保存。restore 側で必要な値だけ見る
          ...methodState,
        },
      },
      hands,
      methodSwitches: initialSession.methodSwitches ?? [],
    });
    onHandsChange?.(hands);
  }, [startedAt, settings, activeMethodId, fund, hands, methodState, initialSession, onHandsChange]);

  const stats = useMemo(() => {
    const decided = hands.filter((h) => h.result !== 'push');
    const wins = decided.filter(
      (h) => h.result === 'win' || h.result === 'bj'
    ).length;
    return {
      total: hands.length,
      decided: decided.length,
      wins,
      winRate: decided.length === 0 ? null : wins / decided.length,
    };
  }, [hands]);

  const profit = fund - settings.initialFund;

  const handleResult = (result) => {
    const bet = method.getNextBet();
    const delta = fundDelta(result, bet);
    const nextFund = fund + delta;

    method.recordResult(result);
    setMethodState(method.getState());
    setFund(nextFund);
    setHands((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        bettingMethod: activeMethodId,
        bet,
        result,
        fundAfter: nextFund,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleReset = () => {
    if (hands.length > 0) {
      const ok = window.confirm(
        '現在のセッションをリセットしますか？\n資金・履歴・連勝数がすべて初期化されます。\n現在のセッションは履歴に保存されます。'
      );
      if (!ok) return;
      archiveSession({
        startedAt,
        initialFund: settings.initialFund,
        baseBet: settings.baseBet,
        currentFund: fund,
        currentMethod: activeMethodId,
        hands,
        methodSwitches: initialSession.methodSwitches ?? [],
      });
    }
    method.reset();
    setMethodState(method.getState());
    setFund(settings.initialFund);
    setHands([]);
    setStartedAt(new Date().toISOString());
  };

  const startEditFund = () => {
    setEditValue(String(fund));
    setEditingFund(true);
  };

  const cancelEditFund = () => {
    setEditingFund(false);
    setEditValue('');
  };

  const commitEditFund = (event) => {
    event.preventDefault();
    const raw = editValue.replace(/[^\d-]/g, '');
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      cancelEditFund();
      return;
    }
    setFund(Math.trunc(n));
    cancelEditFund();
  };

  return (
    <section className="betting-panel">
      <div className="betting-panel__summary">
        <div className="betting-panel__summary-row">
          <span className="betting-panel__summary-label">資金</span>
          {editingFund ? (
            <form
              className="betting-panel__fund-edit"
              onSubmit={commitEditFund}
            >
              <input
                className="betting-panel__fund-input"
                type="number"
                inputMode="numeric"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="betting-panel__fund-submit"
              >
                保存
              </button>
              <button
                type="button"
                className="betting-panel__fund-cancel"
                onClick={cancelEditFund}
              >
                取消
              </button>
            </form>
          ) : (
            <span className="betting-panel__summary-value">
              {formatYen(fund)}
              <button
                type="button"
                className="betting-panel__fund-edit-btn"
                onClick={startEditFund}
                aria-label="資金を編集"
              >
                編集
              </button>
            </span>
          )}
        </div>
        <div className="betting-panel__summary-row">
          <span className="betting-panel__summary-label">通算収支</span>
          <span
            className={
              'betting-panel__summary-value' +
              (profit > 0 ? ' betting-panel__summary-value--positive' : '') +
              (profit < 0 ? ' betting-panel__summary-value--negative' : '')
            }
          >
            {profit > 0 ? `+${formatYen(profit)}` : formatYen(profit)}
          </span>
        </div>
      </div>

      <div className="betting-panel__method">
        <span className="betting-panel__method-label">
          {getMethodLabel(activeMethodId)}
        </span>
        <span className="betting-panel__method-state">
          {describeMethodState(methodState)}
        </span>
      </div>

      <div className="betting-panel__next-bet">
        <span className="betting-panel__next-bet-label">次回ベット</span>
        <span className="betting-panel__next-bet-value">
          {formatYen(methodState.nextBet)}
        </span>
        {typeof methodState.unit === 'number' && (
          <span className="betting-panel__next-bet-unit">
            （{methodState.unit}u）
          </span>
        )}
      </div>

      <div className="betting-panel__actions">
        <button
          type="button"
          className="betting-panel__action betting-panel__action--win"
          onClick={() => handleResult('win')}
        >
          <span className="betting-panel__action-icon" aria-hidden="true">✓</span>
          <span className="betting-panel__action-label">勝ち</span>
        </button>
        <button
          type="button"
          className="betting-panel__action betting-panel__action--loss"
          onClick={() => handleResult('loss')}
        >
          <span className="betting-panel__action-icon" aria-hidden="true">✕</span>
          <span className="betting-panel__action-label">負け</span>
        </button>
        <button
          type="button"
          className="betting-panel__action betting-panel__action--push"
          onClick={() => handleResult('push')}
        >
          <span className="betting-panel__action-icon" aria-hidden="true">＝</span>
          <span className="betting-panel__action-label">プッシュ</span>
        </button>
        <button
          type="button"
          className="betting-panel__action betting-panel__action--bj"
          onClick={() => handleResult('bj')}
        >
          <span className="betting-panel__action-icon" aria-hidden="true">★</span>
          <span className="betting-panel__action-label">BJ</span>
        </button>
      </div>

      <div className="betting-panel__stats">
        <span>総ハンド {stats.total}</span>
        <span>
          勝率{' '}
          {stats.winRate === null
            ? '—'
            : `${Math.round(stats.winRate * 100)}%`}
        </span>
      </div>

      <div className="betting-panel__footer">
        <button
          type="button"
          className="betting-panel__reset"
          onClick={handleReset}
        >
          セッションをリセット
        </button>
      </div>
    </section>
  );
}
