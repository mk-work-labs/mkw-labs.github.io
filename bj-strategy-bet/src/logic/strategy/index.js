import {
  HARD_STRATEGY,
  SOFT_STRATEGY,
  PAIR_STRATEGY,
} from './default-table.js';
import { classifyHand } from './calculator.js';

// playerCards: 2要素の配列（例 ['A','7']）、dealerCard: 'A'|'2'..'10'
// 入力不備やテーブル外の組み合わせでは null を返す。
// 戻り値: 'H' | 'S' | 'D' | 'Ds' | 'P' | null
export function judgeAction(playerCards, dealerCard) {
  if (!dealerCard) return null;
  const classification = classifyHand(playerCards);
  if (!classification) return null;

  const { type, key } = classification;
  const table =
    type === 'pair'
      ? PAIR_STRATEGY
      : type === 'soft'
        ? SOFT_STRATEGY
        : HARD_STRATEGY;

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
