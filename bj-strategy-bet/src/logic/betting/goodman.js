import { BettingMethod, assertValidResult } from './base.js';

// グッドマン法（1-2-3-5 累進）
// バーネット法と似ているが、最大値 5u に到達したらそのまま継続する点が異なる。
const SEQUENCE = Object.freeze([1, 2, 3, 5]);

export class GoodmanMethod extends BettingMethod {
  constructor(baseBet) {
    super(baseBet);
    this.streakLevel = 0;
  }

  getNextBet() {
    return this.baseBet * SEQUENCE[this.streakLevel];
  }

  recordResult(result) {
    assertValidResult(result);
    if (result === 'win' || result === 'bj') {
      // 5u までは進行、最大値に達したらそのまま維持
      if (this.streakLevel < SEQUENCE.length - 1) {
        this.streakLevel += 1;
      }
    } else if (result === 'loss') {
      this.streakLevel = 0;
    }
    // push: 据え置き
  }

  reset() {
    this.streakLevel = 0;
  }

  restore(state) {
    if (!state || typeof state !== 'object') return;
    const raw = Number(state.consecutiveWins);
    if (!Number.isFinite(raw)) return;
    this.streakLevel = Math.max(0, Math.min(SEQUENCE.length - 1, Math.floor(raw)));
  }

  getState() {
    return {
      name: 'goodman',
      consecutiveWins: this.streakLevel,
      unit: SEQUENCE[this.streakLevel],
      nextBet: this.getNextBet(),
    };
  }
}
