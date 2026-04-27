// ベッティング法の共通インターフェース（仕様書 §4.3.4.7）。
// サブクラスは全メソッドをオーバーライドする必要がある。
export class BettingMethod {
  constructor(baseBet) {
    if (!Number.isFinite(baseBet) || baseBet <= 0) {
      throw new Error(`baseBet must be a positive number (got ${baseBet})`);
    }
    this.baseBet = baseBet;
  }

  // 次にベットすべき金額を返す（通貨単位）
  // context: { fund?: number } — 10% 法など資金依存メソッド向け。他メソッドは無視する
  getNextBet(_context) {
    throw new Error('getNextBet() must be implemented by subclass');
  }

  // result: 'win' | 'loss' | 'push' | 'bj'
  recordResult(_result) {
    throw new Error('recordResult() must be implemented by subclass');
  }

  // 初期状態に戻す
  reset() {
    throw new Error('reset() must be implemented by subclass');
  }

  // 表示用の状態スナップショットを返す。
  // context は getNextBet と同じ（nextBet 算出に使う）
  getState(_context) {
    throw new Error('getState() must be implemented by subclass');
  }
}

// 有効な勝敗結果の一覧。サブクラスの recordResult で使う。
export const RESULTS = Object.freeze(['win', 'loss', 'push', 'bj']);

export function assertValidResult(result) {
  if (!RESULTS.includes(result)) {
    throw new Error(
      `Invalid result "${result}". Expected one of: ${RESULTS.join(', ')}`
    );
  }
}

// 仕様書 §3 基準ルール: BJ 配当 1.5 倍、その他は 1:1。
// ハンド結果から純粋な資金変動量を算出する（手動の資金編集など外部要因は含まない）
export function handFundDelta(result, bet) {
  if (result === 'win') return bet;
  if (result === 'bj') return Math.round(bet * 1.5);
  if (result === 'loss') return -bet;
  return 0;
}
