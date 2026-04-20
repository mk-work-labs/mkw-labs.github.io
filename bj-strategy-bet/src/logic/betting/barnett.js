import { BettingMethod, assertValidResult } from './base.js';

// 仕様書 §4.3.2 バーネット法（1-3-2-6法）のユニット倍率
const SEQUENCE = Object.freeze([1, 3, 2, 6]);

export class BarnettMethod extends BettingMethod {
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
        // 4連勝達成（6u で勝った時点）で初期ベットに戻る
        this.streakLevel = 0;
      } else {
        this.streakLevel += 1;
      }
    } else if (result === 'loss') {
      // 連勝サイクル終了。初期ベットに戻す
      this.streakLevel = 0;
    }
    // push: 状態据え置き
  }

  reset() {
    this.streakLevel = 0;
  }

  // 保存された getState() 出力（あるいは同形のオブジェクト）から
  // 内部状態を復元する。想定外の値は安全側に丸める
  restore(state) {
    if (!state || typeof state !== 'object') return;
    const raw = Number(state.consecutiveWins);
    if (!Number.isFinite(raw)) return;
    const clamped = Math.max(0, Math.min(SEQUENCE.length - 1, Math.floor(raw)));
    this.streakLevel = clamped;
  }

  getState() {
    return {
      name: 'barnett',
      consecutiveWins: this.streakLevel,
      unit: SEQUENCE[this.streakLevel],
      nextBet: this.getNextBet(),
    };
  }
}
