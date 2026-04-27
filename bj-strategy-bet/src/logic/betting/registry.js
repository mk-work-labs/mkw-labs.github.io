import { BarnettMethod } from './barnett.js';
import { MonteCarloMethod } from './montecarlo.js';
import { GoodmanMethod } from './goodman.js';
import { OscarsGrindMethod } from './oscarsgrind.js';
import { TenPercentMethod } from './tenpercent.js';
import { ParlayMethod } from './parlay.js';

// ベッティング法のレジストリ。
// implemented=false はセレクターに並べるが選択不可として「将来像」を示す。
// description は設定画面の選択プレビューで使う短い説明文。
export const METHODS = Object.freeze([
  {
    id: 'barnett',
    label: 'バーネット法（1-3-2-6）',
    implemented: true,
    ctor: BarnettMethod,
    description:
      '連勝時に 1 → 3 → 2 → 6 ユニットと段階的にベット額を変える進行型。4 連勝でサイクル完走し 1u に戻る。負けた時点で即 1u にリセット。最大損失は 1u に抑えつつ、連勝時に大きな利益を狙う。',
  },
  {
    id: 'montecarlo',
    label: 'モンテカルロ法（数列式）',
    implemented: true,
    ctor: MonteCarloMethod,
    description:
      '数列（初期 [1, 2, 3]）を使い、ベット = 先頭 + 末尾。勝で両端削除、負で bet 額を末尾に追加。サイクル完走で初期数列の合計分の利益が出る。連敗時にベット額が緩やかに増える。',
  },
  {
    id: 'goodman',
    label: 'グッドマン法（1-2-3-5）',
    implemented: true,
    ctor: GoodmanMethod,
    description:
      '連勝時に 1 → 2 → 3 → 5 ユニットと進行。4 連勝以降は 5u を維持。バーネット法より緩やかで、早期に利益確定しやすい。負けた時点で 1u にリセット。',
  },
  {
    id: 'oscarsgrind',
    label: 'オスカーズグラインド法',
    implemented: true,
    ctor: OscarsGrindMethod,
    description:
      '1u から開始。勝ったら +1u 増やすが、サイクル収支が +1u に達した時点で 1u にリセット。負けてもベット額は据え置き。小幅な利益を積み重ねる堅実派。',
  },
  {
    id: 'tenpercent',
    label: '10% 法',
    implemented: true,
    ctor: TenPercentMethod,
    description:
      '常に現在の資金の 10% をベットする資金比例型。勝てば増え、負ければ減るので破産しにくい。ベース金額の設定に依存せず、資金の増減に応じて動的に変わる。',
  },
  {
    id: 'parlay',
    label: 'パーレー法（1-2-4）',
    implemented: true,
    ctor: ParlayMethod,
    description:
      '連勝時に 1 → 2 → 4 ユニットと倍々に進行。3 連勝でサイクル完走し 1u に戻る。負けた時点で 1u にリセット。積極派向けで、短期間で大きな利益を狙える。',
  },
]);

export const DEFAULT_METHOD_ID = 'barnett';

function findEntry(methodId) {
  return METHODS.find((m) => m.id === methodId) ?? null;
}

// 未実装 ID や不正値は DEFAULT_METHOD_ID にフォールバック。
// methodOptions は { [methodId]: { ... } } の形。各メソッドのコンストラクタに
// 自分の id 用 options が常に渡される。options を必要としないメソッドは無視するだけ
export function createMethod(methodId, baseBet, methodOptions = {}) {
  const entry = findEntry(methodId);
  const resolved = !entry || !entry.implemented ? findEntry(DEFAULT_METHOD_ID) : entry;
  return new resolved.ctor(baseBet, methodOptions?.[resolved.id]);
}

export function resolveMethodId(methodId) {
  const entry = findEntry(methodId);
  return entry && entry.implemented ? entry.id : DEFAULT_METHOD_ID;
}

export function getMethodLabel(methodId) {
  return findEntry(methodId)?.label ?? methodId;
}

export function getMethodDescription(methodId) {
  return findEntry(methodId)?.description ?? '';
}
