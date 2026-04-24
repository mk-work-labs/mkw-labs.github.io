import { BettingMethod, assertValidResult } from './base.js';

// 仕様書 §4.3.3 モンテカルロ法（数列式）
// 初期数列はユーザーが設定画面から変更可能。bet = 先頭 + 末尾（1要素なら自身）、
// 勝で両端削除、負で bet を末尾に追加。
// cycleEndRule:
//   'empty'  — 数列が空になるまで続ける（1 要素でもベット、本来の Labouchère）
//   'single' — 数列が 1 要素になった時点でリセット（日本で紹介される簡易版）
const DEFAULT_SEQUENCE = Object.freeze([1, 2, 3]);
const DEFAULT_CYCLE_END_RULE = 'empty';
const CYCLE_END_THRESHOLDS = Object.freeze({
  // スライス前の length がこの値以下ならリセット。'empty' では length<=2（スライス後 0）、
  // 'single' では length<=3（スライス後 0 または 1）
  empty: 2,
  single: 3,
});

function sanitizeSequence(raw) {
  if (!Array.isArray(raw)) return null;
  const cleaned = raw
    .map((n) => Math.floor(Number(n)))
    .filter((n) => Number.isFinite(n) && n > 0);
  return cleaned.length >= 2 ? cleaned : null;
}

function sanitizeCycleEndRule(raw) {
  return raw in CYCLE_END_THRESHOLDS ? raw : DEFAULT_CYCLE_END_RULE;
}

export class MonteCarloMethod extends BettingMethod {
  constructor(baseBet, options = {}) {
    super(baseBet);
    this.initialSequence = sanitizeSequence(options?.sequence) ?? [...DEFAULT_SEQUENCE];
    this.cycleEndRule = sanitizeCycleEndRule(options?.cycleEndRule);
    this.sequence = [...this.initialSequence];
  }

  _currentUnit() {
    const s = this.sequence;
    if (s.length === 0) {
      const init = this.initialSequence;
      return init[0] + init[init.length - 1];
    }
    if (s.length === 1) return s[0];
    return s[0] + s[s.length - 1];
  }

  getNextBet() {
    return this.baseBet * this._currentUnit();
  }

  recordResult(result) {
    assertValidResult(result);

    // 空なら自動初期化してから処理
    if (this.sequence.length === 0) {
      this.sequence = [...this.initialSequence];
    }

    if (result === 'win' || result === 'bj') {
      // cycleEndRule に応じた閾値でサイクル完走判定
      const threshold = CYCLE_END_THRESHOLDS[this.cycleEndRule];
      if (this.sequence.length <= threshold) {
        this.sequence = [...this.initialSequence];
      } else {
        this.sequence = this.sequence.slice(1, -1);
      }
    } else if (result === 'loss') {
      // bet 単位数を末尾に追加
      this.sequence = [...this.sequence, this._currentUnit()];
    }
    // push: 据え置き
  }

  reset() {
    this.sequence = [...this.initialSequence];
  }

  restore(state) {
    if (!state || typeof state !== 'object') return;
    if (!Array.isArray(state.sequence)) return;
    const cleaned = state.sequence
      .map((n) => Math.floor(Number(n)))
      .filter((n) => Number.isFinite(n) && n > 0);
    this.sequence = cleaned.length > 0 ? cleaned : [...this.initialSequence];
  }

  getState() {
    return {
      name: 'montecarlo',
      sequence: [...this.sequence],
      unit: this._currentUnit(),
      nextBet: this.getNextBet(),
      cycleEndRule: this.cycleEndRule,
    };
  }
}
