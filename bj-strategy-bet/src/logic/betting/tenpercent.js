import { BettingMethod, assertValidResult } from './base.js';

// 10% 法
// 毎回のベット額 = 現在資金の 10%（baseBet 単位で切り下げ、下限 baseBet）。
// 連敗で自動的にベットが縮小し、連勝で自動的に拡大する。
// 内部状態は持たない（勝敗で何も更新しない）。
const RATIO = 0.1;

function computeBet(fund, baseBet) {
  if (!Number.isFinite(fund) || fund <= 0) return baseBet;
  const raw = fund * RATIO;
  if (raw <= baseBet) return baseBet;
  const units = Math.floor(raw / baseBet);
  return units * baseBet;
}

export class TenPercentMethod extends BettingMethod {
  constructor(baseBet) {
    super(baseBet);
    // 直近にコンテキスト経由で受け取った fund（表示用）。永続化はしない
    this._latestFund = null;
  }

  getNextBet(context) {
    const fund = Number(context?.fund);
    if (Number.isFinite(fund)) this._latestFund = fund;
    return computeBet(this._latestFund, this.baseBet);
  }

  recordResult(result) {
    assertValidResult(result);
    // 状態変化なし（資金の変動に伴い次回ベットが自動的に変わる）
  }

  reset() {
    this._latestFund = null;
  }

  restore(_state) {
    // 永続化する内部状態なし
  }

  getState(context) {
    const nextBet = this.getNextBet(context);
    return {
      name: 'tenpercent',
      nextBet,
      unit: Math.max(1, Math.round(nextBet / this.baseBet)),
      fund: this._latestFund,
    };
  }
}
