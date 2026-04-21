import { BarnettMethod } from './barnett.js';
import { MonteCarloMethod } from './montecarlo.js';
import { GoodmanMethod } from './goodman.js';
import { OscarsGrindMethod } from './oscarsgrind.js';
import { TenPercentMethod } from './tenpercent.js';
import { ParlayMethod } from './parlay.js';

// ベッティング法のレジストリ。
// implemented=false はセレクターに並べるが選択不可として「将来像」を示す。
export const METHODS = Object.freeze([
  { id: 'barnett',     label: 'バーネット法（1-3-2-6）',      implemented: true, ctor: BarnettMethod },
  { id: 'montecarlo',  label: 'モンテカルロ法（数列式）',    implemented: true, ctor: MonteCarloMethod },
  { id: 'goodman',     label: 'グッドマン法（1-2-3-5）',     implemented: true, ctor: GoodmanMethod },
  { id: 'oscarsgrind', label: 'オスカーズグラインド法',      implemented: true, ctor: OscarsGrindMethod },
  { id: 'tenpercent',  label: '10% 法',                      implemented: true, ctor: TenPercentMethod },
  { id: 'parlay',      label: 'パーレー法（1-2-4）',         implemented: true, ctor: ParlayMethod },
]);

export const DEFAULT_METHOD_ID = 'barnett';

function findEntry(methodId) {
  return METHODS.find((m) => m.id === methodId) ?? null;
}

// 未実装 ID や不正値は DEFAULT_METHOD_ID にフォールバック
export function createMethod(methodId, baseBet) {
  const entry = findEntry(methodId);
  if (!entry || !entry.implemented) {
    const fallback = findEntry(DEFAULT_METHOD_ID);
    return new fallback.ctor(baseBet);
  }
  return new entry.ctor(baseBet);
}

export function resolveMethodId(methodId) {
  const entry = findEntry(methodId);
  return entry && entry.implemented ? entry.id : DEFAULT_METHOD_ID;
}

export function getMethodLabel(methodId) {
  return findEntry(methodId)?.label ?? methodId;
}
