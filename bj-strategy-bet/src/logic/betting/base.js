// ベッティング法の共通インターフェース（仕様書 §4.3.4.7）。
// サブクラスは全メソッドをオーバーライドする必要がある。
//
// コンストラクタ規約:
//   constructor(baseBet, options?)
//   - baseBet: 正の数値。1 ユニットの通貨額
//   - options: 各メソッド固有の初期化オプション（モンテカルロの sequence など）
//     registry.createMethod が methodOptions?.[id] を常に渡すため、
//     options を必要としないメソッドは引数を無視するだけでよい
//
// context 規約（getNextBet / getState）:
//   呼び出し側（BettingPanel）は常に { fund } を渡す慣習。
//   fund に依存するメソッド（10% 法など）は context から読み、依存しないメソッドは無視する
export class BettingMethod {
  constructor(baseBet) {
    if (!Number.isFinite(baseBet) || baseBet <= 0) {
      throw new Error(`baseBet must be a positive number (got ${baseBet})`);
    }
    this.baseBet = baseBet;
  }

  /**
   * 次にベットすべき金額（通貨単位）を返す。
   * @param {{fund?: number}} [_context] 資金依存メソッド向け。他メソッドは無視
   * @returns {number}
   */
  getNextBet(_context) {
    throw new Error('getNextBet() must be implemented by subclass');
  }

  /**
   * ハンド結果を記録して内部状態を更新する。
   * @param {'win' | 'loss' | 'push' | 'bj'} _result
   */
  recordResult(_result) {
    throw new Error('recordResult() must be implemented by subclass');
  }

  /** 初期状態に戻す */
  reset() {
    throw new Error('reset() must be implemented by subclass');
  }

  /**
   * 永続化用の状態スナップショットを返す。
   * `restore(state)` がこの形のオブジェクトを受け取って内部状態を復元できることが前提。
   * @param {{fund?: number}} [_context] getNextBet と同じ
   * @returns {object}
   */
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
