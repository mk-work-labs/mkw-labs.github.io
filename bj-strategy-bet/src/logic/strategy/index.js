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
  return row[dealerCard] ?? null;
}

export { HARD_STRATEGY, SOFT_STRATEGY, PAIR_STRATEGY };
export { classifyHand, handTotal } from './calculator.js';
