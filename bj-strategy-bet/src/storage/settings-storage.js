import { readJSON, writeJSON } from './local-storage.js';

// 仕様書 §6.1 のキー
const KEY = 'bj-strategy-bet:settings';

const DEFAULT_MONTECARLO_SEQUENCE = Object.freeze([1, 2, 3]);

// 'empty'  : 数列が空になった時点でサイクル完走（本来の Labouchère）。1 要素でもベット
// 'single' : 数列が 1 要素になった時点で即リセット（日本で紹介される簡易版）
export const MONTECARLO_CYCLE_END_RULES = Object.freeze(['empty', 'single']);
const DEFAULT_MONTECARLO_CYCLE_END_RULE = 'empty';

export const DEFAULT_SETTINGS = Object.freeze({
  bettingMethod: 'barnett',
  baseBet: 100,
  initialFund: 10000,
  methodOptions: Object.freeze({
    montecarlo: Object.freeze({
      sequence: DEFAULT_MONTECARLO_SEQUENCE,
      cycleEndRule: DEFAULT_MONTECARLO_CYCLE_END_RULE,
    }),
  }),
});

// モンテカルロ数列を正規化。正の整数 2 要素以上でなければ fallback を返す
export function normalizeMontecarloSequence(raw, fallback = DEFAULT_MONTECARLO_SEQUENCE) {
  if (!Array.isArray(raw)) return [...fallback];
  const cleaned = raw
    .map((n) => Math.floor(Number(n)))
    .filter((n) => Number.isFinite(n) && n > 0);
  return cleaned.length >= 2 ? cleaned : [...fallback];
}

export function normalizeMontecarloCycleEndRule(raw) {
  if (MONTECARLO_CYCLE_END_RULES.includes(raw)) return raw;
  // raw が undefined（未設定）なら通常運用なので静かに既定値で埋める。
  // 値が入っているのに不正な場合のみ警告を出して不可視のスキーマ齟齬を可視化する
  if (raw !== undefined && raw !== null) {
    console.warn(
      `[settings] unknown montecarlo cycleEndRule "${raw}" — falling back to "${DEFAULT_MONTECARLO_CYCLE_END_RULE}"`
    );
  }
  return DEFAULT_MONTECARLO_CYCLE_END_RULE;
}

function buildDefaults() {
  return {
    ...DEFAULT_SETTINGS,
    methodOptions: {
      montecarlo: {
        sequence: [...DEFAULT_MONTECARLO_SEQUENCE],
        cycleEndRule: DEFAULT_MONTECARLO_CYCLE_END_RULE,
      },
    },
  };
}

// 保存値とデフォルトをマージして返す。未保存・壊れた値はデフォルトで補完
export function loadSettings() {
  const stored = readJSON(KEY, null);
  if (!stored || typeof stored !== 'object') {
    return buildDefaults();
  }
  const storedMc = stored.methodOptions?.montecarlo ?? {};
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    methodOptions: {
      montecarlo: {
        sequence: normalizeMontecarloSequence(storedMc.sequence),
        cycleEndRule: normalizeMontecarloCycleEndRule(storedMc.cycleEndRule),
      },
    },
  };
}

export function saveSettings(settings) {
  const merged = {
    ...DEFAULT_SETTINGS,
    ...settings,
    methodOptions: {
      montecarlo: {
        sequence: normalizeMontecarloSequence(
          settings?.methodOptions?.montecarlo?.sequence
        ),
        cycleEndRule: normalizeMontecarloCycleEndRule(
          settings?.methodOptions?.montecarlo?.cycleEndRule
        ),
      },
    },
  };
  writeJSON(KEY, merged);
}
