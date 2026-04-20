import { readJSON, writeJSON, remove } from './local-storage.js';

// 仕様書 §4.2.8.3 のキー
const KEY = 'bj-strategy-bet:custom-strategy';
const VERSION = 1;

const TABLE_TYPES = ['hard', 'soft', 'pair'];

function emptyTable() {
  return { hard: {}, soft: {}, pair: {} };
}

// カスタム表を読み込む。未保存・壊れた値は null
export function loadCustomStrategy() {
  const stored = readJSON(KEY, null);
  if (!stored || typeof stored !== 'object') return null;
  const tables = emptyTable();
  for (const type of TABLE_TYPES) {
    if (stored[type] && typeof stored[type] === 'object') {
      tables[type] = stored[type];
    }
  }
  return {
    version: VERSION,
    updatedAt: stored.updatedAt ?? null,
    ...tables,
  };
}

function persist(next) {
  writeJSON(KEY, {
    version: VERSION,
    updatedAt: new Date().toISOString(),
    hard: next.hard,
    soft: next.soft,
    pair: next.pair,
  });
}

// 1 セル分だけ書き換える（タップ編集の主経路）
export function saveCustomCell(type, rowKey, dealer, action) {
  if (!TABLE_TYPES.includes(type)) return;
  const current = loadCustomStrategy() ?? emptyTable();
  const table = { ...(current[type] ?? {}) };
  const row = { ...(table[rowKey] ?? {}) };
  row[dealer] = action;
  table[rowKey] = row;
  persist({ ...current, [type]: table });
}

// 指定タイプのカスタム分を破棄してデフォルトに戻す。
// 他タイプのカスタムが残っていれば全体は保持する
export function resetCustomTable(type) {
  if (!TABLE_TYPES.includes(type)) return;
  const current = loadCustomStrategy();
  if (!current) return;
  const next = { ...current, [type]: {} };
  const empty = TABLE_TYPES.every((t) => Object.keys(next[t]).length === 0);
  if (empty) {
    remove(KEY);
    return;
  }
  persist(next);
}

// カスタム表全体を破棄
export function resetAllCustom() {
  remove(KEY);
}
