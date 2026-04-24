import { BettingMethod, assertValidResult } from './base.js';

// オスカーズグラインド法
// ルール:
//  - 1 サイクルの目標利益: +1u
//  - 勝ち: 次のベットを +1u（ただし超過しそうなら必要最小限の u に抑える）
//  - 負け: ベット据え置き
//  - サイクル収支が +1u 以上に達したら 1u に戻して新サイクル
// BJ は 1.5 倍の利得としてサイクル収支に加算する。
const TARGET_UNITS = 1;
const INITIAL_BET_UNITS = 1;

export class OscarsGrindMethod extends BettingMethod {
  constructor(baseBet) {
    super(baseBet);
    this.betUnits = INITIAL_BET_UNITS;
    this.cycleProfitUnits = 0;
  }

  getNextBet() {
    return this.baseBet * this.betUnits;
  }

  recordResult(result) {
    assertValidResult(result);
    if (result === 'push') return;

    if (result === 'loss') {
      this.cycleProfitUnits -= this.betUnits;
      return;
    }

    const gain = result === 'bj' ? this.betUnits * 1.5 : this.betUnits;
    this.cycleProfitUnits += gain;

    if (this.cycleProfitUnits >= TARGET_UNITS) {
      // サイクル完走 → 次サイクル開始
      this.betUnits = INITIAL_BET_UNITS;
      this.cycleProfitUnits = 0;
      return;
    }

    const proposed = this.betUnits + 1;
    if (this.cycleProfitUnits + proposed > TARGET_UNITS) {
      // 超過するなら目標到達に必要な分に抑える（最低 1u）
      const needed = Math.max(1, Math.ceil(TARGET_UNITS - this.cycleProfitUnits));
      this.betUnits = needed;
    } else {
      this.betUnits = proposed;
    }
  }

  reset() {
    this.betUnits = INITIAL_BET_UNITS;
    this.cycleProfitUnits = 0;
  }

  restore(state) {
    if (!state || typeof state !== 'object') return;
    const bet = Number(state.betUnits);
    const profit = Number(state.cycleProfitUnits);
    if (Number.isFinite(bet) && bet >= 1) {
      this.betUnits = Math.max(1, Math.floor(bet));
    }
    if (Number.isFinite(profit)) {
      this.cycleProfitUnits = profit;
    }
  }

  getState() {
    return {
      name: 'oscarsgrind',
      betUnits: this.betUnits,
      cycleProfitUnits: this.cycleProfitUnits,
      unit: this.betUnits,
      nextBet: this.getNextBet(),
    };
  }
}
