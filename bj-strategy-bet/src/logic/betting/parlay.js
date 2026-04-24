import { BettingMethod, assertValidResult } from './base.js';

// パーレー法（3 ステップ版）
// 1u → 2u → 4u と連勝で倍がけし、3 連勝達成で強制リセット（利益確定）。
// 負ければ 1u に戻る。push は据え置き。
// 完走サイクル利益: 1 + 2 + 4 = +7u
const SEQUENCE = Object.freeze([1, 2, 4]);

export class ParlayMethod extends BettingMethod {
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
      if (this.streakLevel === SEQUENCE.length - 1) {
        // 上限達成 → 利益確定してリセット
        this.streakLevel = 0;
      } else {
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
      name: 'parlay',
      consecutiveWins: this.streakLevel,
      unit: SEQUENCE[this.streakLevel],
      nextBet: this.getNextBet(),
    };
  }
}
