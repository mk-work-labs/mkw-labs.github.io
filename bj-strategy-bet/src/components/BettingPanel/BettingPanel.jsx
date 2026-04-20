import { useEffect, useMemo, useRef, useState } from 'react';
import { BarnettMethod } from '../../logic/betting/barnett.js';
import { loadSettings } from '../../storage/settings-storage.js';
import {
  loadSession,
  saveSession,
} from '../../storage/session-storage.js';
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

function buildInitialSession(settings) {
  return {
    startedAt: new Date().toISOString(),
    initialFund: settings.initialFund,
    baseBet: settings.baseBet,
    currentFund: settings.initialFund,
    currentMethod: 'barnett',
    methodState: { barnett: { consecutiveWins: 0 } },
    hands: [],
    methodSwitches: [],
  };
}

export default function BettingPanel() {
  // 起動時に設定とセッションを読み込む（一度のみ）
  const bootstrapRef = useRef(null);
  if (bootstrapRef.current === null) {
    const settings = loadSettings();
    const stored = loadSession();
    bootstrapRef.current = {
      settings,
      session: stored ?? buildInitialSession(settings),
    };
  }
  const { settings, session: initialSession } = bootstrapRef.current;

  // BarnettMethod のインスタンスはライフタイム中保持。保存状態があれば復元
  const methodRef = useRef(null);
  if (methodRef.current === null) {
    const m = new BarnettMethod(initialSession.baseBet ?? settings.baseBet);
    m.restore(initialSession.methodState?.barnett);
    methodRef.current = m;
  }
  const method = methodRef.current;

  const [startedAt, setStartedAt] = useState(initialSession.startedAt);
  const [fund, setFund] = useState(initialSession.currentFund);
  const [hands, setHands] = useState(initialSession.hands ?? []);
  const [methodState, setMethodState] = useState(() => method.getState());

  // state 変化時にセッションを永続化
  useEffect(() => {
    saveSession({
      startedAt,
      initialFund: settings.initialFund,
      baseBet: settings.baseBet,
      currentFund: fund,
      currentMethod: 'barnett',
      methodState: {
        barnett: { consecutiveWins: methodState.consecutiveWins },
      },
      hands,
      methodSwitches: [],
    });
  }, [startedAt, settings, fund, hands, methodState]);

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
        bettingMethod: 'barnett',
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
        '現在のセッションをリセットしますか？\n資金・履歴・連勝数がすべて初期化されます。'
      );
      if (!ok) return;
    }
    method.reset();
    setMethodState(method.getState());
    setFund(settings.initialFund);
    setHands([]);
    setStartedAt(new Date().toISOString());
  };

  return (
    <section className="betting-panel">
      <div className="betting-panel__summary">
        <div className="betting-panel__summary-row">
          <span className="betting-panel__summary-label">資金</span>
          <span className="betting-panel__summary-value">{formatYen(fund)}</span>
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

      <div className="betting-panel__next-bet">
        <span className="betting-panel__next-bet-label">次回ベット</span>
        <span className="betting-panel__next-bet-value">
          {formatYen(methodState.nextBet)}
        </span>
        <span className="betting-panel__next-bet-unit">
          （{methodState.unit}u）
        </span>
      </div>

      <div className="betting-panel__actions">
        <button
          type="button"
          className="betting-panel__action betting-panel__action--win"
          onClick={() => handleResult('win')}
        >
          勝ち
        </button>
        <button
          type="button"
          className="betting-panel__action betting-panel__action--loss"
          onClick={() => handleResult('loss')}
        >
          負け
        </button>
        <button
          type="button"
          className="betting-panel__action betting-panel__action--push"
          onClick={() => handleResult('push')}
        >
          プッシュ
        </button>
        <button
          type="button"
          className="betting-panel__action betting-panel__action--bj"
          onClick={() => handleResult('bj')}
        >
          BJ
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
        <span>連勝 {methodState.consecutiveWins}</span>
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
