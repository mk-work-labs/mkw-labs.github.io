import { BettingMethod, assertValidResult } from './base.js';

// 仕様書 §4.3.3 モンテカルロ法（数列式）
// 初期数列 [1, 2, 3]、bet = 先頭 + 末尾（1要素なら自身）、
// 勝で両端削除、負で bet を末尾に追加、空なら自動で初期化。
const INITIAL_SEQUENCE = Object.freeze([1, 2, 3]);

function currentUnit(sequence) {
  if (sequence.length === 0) return INITIAL_SEQUENCE[0] + INITIAL_SEQUENCE[INITIAL_SEQUENCE.length - 1];
  if (sequence.length === 1) return sequence[0];
  return sequence[0] + sequence[sequence.length - 1];
}

export class MonteCarloMethod extends BettingMethod {
  constructor(baseBet) {
    super(baseBet);
    this.sequence = [...INITIAL_SEQUENCE];
  }

  getNextBet() {
    return this.baseBet * currentUnit(this.sequence);
  }

  recordResult(result) {
    assertValidResult(result);

    // 空なら自動初期化してから処理
    if (this.sequence.length === 0) {
      this.sequence = [...INITIAL_SEQUENCE];
    }

    if (result === 'win' || result === 'bj') {
      // 両端削除、残り 0〜1 要素でサイクル完走なら初期化
      if (this.sequence.length <= 2) {
        this.sequence = [...INITIAL_SEQUENCE];
      } else {
        this.sequence = this.sequence.slice(1, -1);
      }
    } else if (result === 'loss') {
      // bet 単位数を末尾に追加
      this.sequence = [...this.sequence, currentUnit(this.sequence)];
    }
    // push: 据え置き
  }

  reset() {
    this.sequence = [...INITIAL_SEQUENCE];
  }

  restore(state) {
    if (!state || typeof state !== 'object') return;
    if (!Array.isArray(state.sequence)) return;
    const cleaned = state.sequence
      .map((n) => Math.floor(Number(n)))
      .filter((n) => Number.isFinite(n) && n > 0);
    this.sequence = cleaned.length > 0 ? cleaned : [...INITIAL_SEQUENCE];
  }

  getState() {
    return {
      name: 'montecarlo',
      sequence: [...this.sequence],
      unit: currentUnit(this.sequence),
      nextBet: this.getNextBet(),
    };
  }
}
