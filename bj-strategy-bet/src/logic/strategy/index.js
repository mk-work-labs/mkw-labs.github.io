import {
  HARD_STRATEGY,
  SOFT_STRATEGY,
  PAIR_STRATEGY,
} from './default-table.js';
import { classifyHand } from './calculator.js';
import { loadCustomStrategy } from '../../storage/strategy-storage.js';

function mergeTable(defaultTable, customTable) {
  if (!customTable || Object.keys(customTable).length === 0) {
    return defaultTable;
  }
  const merged = {};
  for (const key of Object.keys(defaultTable)) {
    const customRow = customTable[key];
    if (!customRow) {
      merged[key] = defaultTable[key];
      continue;
    }
    merged[key] = { ...defaultTable[key], ...customRow };
  }
  return merged;
}

// デフォルト表にカスタム表を重ね合わせた実効ストラテジーを返す。
// カスタムが無いセルはデフォルトにフォールバックする（§4.2.8.4）
export function getEffectiveStrategy() {
  const custom = loadCustomStrategy();
  return {
    hard: mergeTable(HARD_STRATEGY, custom?.hard),
    soft: mergeTable(SOFT_STRATEGY, custom?.soft),
    pair: mergeTable(PAIR_STRATEGY, custom?.pair),
  };
}

// playerCards: 2要素の配列（例 ['A','7']）、dealerCard: 'A'|'2'..'10'
// 入力不備やテーブル外の組み合わせでは null を返す。
// 戻り値: 'H' | 'S' | 'D' | 'Ds' | 'P' | null
export function judgeAction(playerCards, dealerCard) {
  if (!dealerCard) return null;
  const classification = classifyHand(playerCards);
  if (!classification) return null;

  const { type, key } = classification;
  const strategy = getEffectiveStrategy();
  const table =
    type === 'pair' ? strategy.pair : type === 'soft' ? strategy.soft : strategy.hard;

  const row = table[key];
  if (!row) return null;
  const raw = row[dealerCard] ?? null;

  // 3枚以上はダブル不可（仕様書 §4.2.6）。D → H, Ds → S にフォールバック
  if (Array.isArray(playerCards) && playerCards.length > 2) {
    if (raw === 'D') return 'H';
    if (raw === 'Ds') return 'S';
  }
  return raw;
}

export { HARD_STRATEGY, SOFT_STRATEGY, PAIR_STRATEGY };
export { classifyHand, handTotal } from './calculator.js';
