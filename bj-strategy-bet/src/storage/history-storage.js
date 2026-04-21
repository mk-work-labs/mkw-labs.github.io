import { readJSON, writeJSON } from './local-storage.js';
import { loadSession, saveSession } from './session-storage.js';
import { saveSettings } from './settings-storage.js';
import { resolveMethodId } from '../logic/betting/registry.js';

const KEY = 'bj-strategy-bet:history';

// 仕様書 §6.2 history スキーマに沿ってセッションをアーカイブする。
// 空セッション（hands なし）はアーカイブしない責務を呼び出し側に委ねる。

export function loadHistory() {
  const stored = readJSON(KEY, []);
  return Array.isArray(stored) ? stored : [];
}

export function saveHistory(list) {
  writeJSON(KEY, list);
}

// current-session を history エントリに集計して変換する。
// per-method の profit は hand 間の fundAfter 差分で算出（手動の資金編集も含めて実績ベース）
// snapshot には復元用に raw な session 状態を丸ごと含める
export function buildHistoryEntry(session) {
  const { startedAt, initialFund, baseBet, currentFund, currentMethod, methodState, hands, methodSwitches } = session;
  const totalHands = hands.length;
  const endFund = totalHands > 0 ? hands[totalHands - 1].fundAfter : initialFund;

  const decided = hands.filter((h) => h.result !== 'push');
  const wins = decided.filter((h) => h.result === 'win' || h.result === 'bj').length;
  const winRate = decided.length === 0 ? 0 : wins / decided.length;

  const methodAcc = new Map();
  let prevFund = initialFund;
  for (const h of hands) {
    const delta = h.fundAfter - prevFund;
    prevFund = h.fundAfter;
    let entry = methodAcc.get(h.bettingMethod);
    if (!entry) {
      entry = { method: h.bettingMethod, hands: 0, decided: 0, wins: 0, profit: 0 };
      methodAcc.set(h.bettingMethod, entry);
    }
    entry.hands += 1;
    entry.profit += delta;
    if (h.result !== 'push') {
      entry.decided += 1;
      if (h.result === 'win' || h.result === 'bj') entry.wins += 1;
    }
  }

  const methodSummary = Array.from(methodAcc.values()).map((e) => ({
    method: e.method,
    hands: e.hands,
    winRate: e.decided === 0 ? 0 : e.wins / e.decided,
    profit: e.profit,
  }));

  return {
    id: `session-${Date.now()}`,
    startedAt,
    endedAt: new Date().toISOString(),
    startFund: initialFund,
    endFund,
    totalHands,
    winRate,
    methodSummary,
    methodSwitches: methodSwitches ?? [],
    snapshot: {
      startedAt,
      initialFund,
      baseBet,
      currentFund: currentFund ?? endFund,
      currentMethod,
      methodState: methodState ?? {},
      hands,
      methodSwitches: methodSwitches ?? [],
    },
  };
}

export function archiveSession(session) {
  if (!session || !Array.isArray(session.hands) || session.hands.length === 0) {
    return null;
  }
  const entry = buildHistoryEntry(session);
  const next = [...loadHistory(), entry];
  saveHistory(next);
  return entry;
}

// 履歴エントリの snapshot を current-session / settings に書き戻して復元する。
// 現行セッションに hands があれば先にアーカイブし、復元元エントリは history から除去。
export function restoreFromHistory(entry) {
  if (!entry?.snapshot) {
    throw new Error('history entry has no snapshot');
  }

  const currentSession = loadSession();
  if (currentSession && Array.isArray(currentSession.hands) && currentSession.hands.length > 0) {
    archiveSession(currentSession);
  }

  const { snapshot } = entry;
  const methodId = resolveMethodId(snapshot.currentMethod);

  saveSettings({
    bettingMethod: methodId,
    baseBet: snapshot.baseBet,
    initialFund: snapshot.initialFund,
  });

  saveSession({
    startedAt: snapshot.startedAt,
    initialFund: snapshot.initialFund,
    baseBet: snapshot.baseBet,
    currentFund: snapshot.currentFund,
    currentMethod: methodId,
    methodState: snapshot.methodState ?? {},
    hands: Array.isArray(snapshot.hands) ? snapshot.hands : [],
    methodSwitches: snapshot.methodSwitches ?? [],
  });

  saveHistory(loadHistory().filter((e) => e.id !== entry.id));
}
