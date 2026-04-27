import { useEffect, useMemo, useState } from 'react';
import {
  loadHistory,
  restoreFromHistory,
  saveHistory,
} from '../../storage/history-storage.js';
import { loadSession } from '../../storage/session-storage.js';
import { subscribeStorage } from '../../storage/local-storage.js';
import { getMethodLabel } from '../../logic/betting/registry.js';
import './HistoryView.css';

const HISTORY_KEY = 'bj-strategy-bet:history';

function formatYen(n) {
  const sign = n < 0 ? '-' : '';
  return `${sign}¥${Math.abs(n).toLocaleString('ja-JP')}`;
}

function formatSignedYen(n) {
  if (n > 0) return `+${formatYen(n)}`;
  return formatYen(n);
}

function formatPercent(rate) {
  return `${(rate * 100).toFixed(1)}%`;
}

function formatDateRange(startedAt, endedAt) {
  try {
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const dateFmt = new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const timeFmt = new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();
    if (sameDay) {
      return `${dateFmt.format(start)} ${timeFmt.format(start)}〜${timeFmt.format(end)}`;
    }
    return `${dateFmt.format(start)} ${timeFmt.format(start)} 〜 ${dateFmt.format(end)} ${timeFmt.format(end)}`;
  } catch {
    return `${startedAt} 〜 ${endedAt}`;
  }
}

export default function HistoryView({ onRestore }) {
  const [history, setHistory] = useState(() => loadHistory());

  // 他タブからの履歴更新と bfcache 復元に追従して最新の履歴を表示する。
  // 履歴一覧は編集対象を持たないため、確認なしで再読込してよい。
  useEffect(() => {
    const refresh = () => setHistory(loadHistory());
    const unsub = subscribeStorage(HISTORY_KEY, refresh);
    const handlePageShow = (e) => {
      if (e.persisted) refresh();
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      unsub();
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1)),
    [history]
  );

  const handleClearAll = () => {
    if (history.length === 0) return;
    const ok = window.confirm(
      '履歴をすべて削除しますか？\nこの操作は元に戻せません。'
    );
    if (!ok) return;
    saveHistory([]);
    setHistory([]);
  };

  const handleRestore = (entry) => {
    if (!entry.snapshot) return;
    const current = loadSession();
    const hasActiveHands = Array.isArray(current?.hands) && current.hands.length > 0;
    const message = hasActiveHands
      ? '現在のセッションは履歴に保存され、このセッションに戻ります。\n設定（ベッティング法・ベースベット・初期資金）も復元元に合わせて上書きされます。\n続行しますか？'
      : 'このセッションに戻します。\n設定（ベッティング法・ベースベット・初期資金）も復元元に合わせて上書きされます。\n続行しますか？';
    const ok = window.confirm(message);
    if (!ok) return;
    try {
      restoreFromHistory(entry);
    } catch (e) {
      console.error('restoreFromHistory failed', e);
      window.alert('復元に失敗しました。');
      return;
    }
    onRestore?.(entry);
  };

  if (sortedHistory.length === 0) {
    return (
      <section className="history-view__empty">
        <p>まだ履歴がありません。</p>
        <p className="history-view__empty-hint">
          メイン画面の「セッションをリセット」を押すと、現在のセッションが履歴に保存されます。
        </p>
      </section>
    );
  }

  return (
    <>
      <div className="history-view__toolbar">
        <span className="history-view__count">{sortedHistory.length} 件</span>
        <button
          type="button"
          className="history-view__clear"
          onClick={handleClearAll}
        >
          すべて削除
        </button>
      </div>
      <ul className="history-view__list">
        {sortedHistory.map((entry) => {
          // gameplayProfit は手動資金編集を除いたゲーム純成績。古い履歴は未保存のため endFund-startFund に fallback
          const profit =
            typeof entry.gameplayProfit === 'number'
              ? entry.gameplayProfit
              : entry.endFund - entry.startFund;
          const adjustmentTotal =
            typeof entry.adjustmentTotal === 'number' ? entry.adjustmentTotal : 0;
          const profitClass =
            profit > 0
              ? 'history-card__profit--positive'
              : profit < 0
                ? 'history-card__profit--negative'
                : '';
          return (
            <li key={entry.id} className="history-card">
              <header className="history-card__header">
                <span className="history-card__date">
                  {formatDateRange(entry.startedAt, entry.endedAt)}
                </span>
                <span className={`history-card__profit ${profitClass}`}>
                  {formatSignedYen(profit)}
                </span>
              </header>
              <dl className="history-card__stats">
                <div className="history-card__stat">
                  <dt>資金</dt>
                  <dd>
                    {formatYen(entry.startFund)} → {formatYen(entry.endFund)}
                  </dd>
                </div>
                <div className="history-card__stat">
                  <dt>ハンド</dt>
                  <dd>{entry.totalHands}</dd>
                </div>
                <div className="history-card__stat">
                  <dt>勝率</dt>
                  <dd>{formatPercent(entry.winRate)}</dd>
                </div>
                {adjustmentTotal !== 0 && (
                  <div className="history-card__stat">
                    <dt>資金編集</dt>
                    <dd>{formatSignedYen(adjustmentTotal)}</dd>
                  </div>
                )}
              </dl>
              {entry.methodSummary?.length > 0 && (
                <ul className="history-card__methods">
                  {entry.methodSummary.map((m) => (
                    <li key={m.method} className="history-card__method">
                      <span className="history-card__method-label">
                        {getMethodLabel(m.method)}
                      </span>
                      <span className="history-card__method-meta">
                        {m.hands} ハンド / 勝率 {formatPercent(m.winRate)} /{' '}
                        <span
                          className={
                            m.profit > 0
                              ? 'history-card__profit--positive'
                              : m.profit < 0
                                ? 'history-card__profit--negative'
                                : ''
                          }
                        >
                          {formatSignedYen(m.profit)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="history-card__actions">
                <button
                  type="button"
                  className="history-card__action history-card__action--resume"
                  onClick={() => handleRestore(entry)}
                  disabled={!entry.snapshot}
                  title={
                    entry.snapshot
                      ? undefined
                      : '古いバージョンで保存されたため復元に対応していません'
                  }
                >
                  このセッションから再開
                </button>
                {!entry.snapshot && (
                  <span className="history-card__action-hint">
                    このバージョンでは復元に非対応
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
