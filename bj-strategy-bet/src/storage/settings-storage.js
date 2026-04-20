import { readJSON, writeJSON } from './local-storage.js';

// 仕様書 §6.1 のキー
const KEY = 'bj-strategy-bet:settings';

export const DEFAULT_SETTINGS = Object.freeze({
  bettingMethod: 'barnett',
  baseBet: 100,
  initialFund: 10000,
});

// 保存値とデフォルトをマージして返す。未保存・壊れた値はデフォルトで補完
export function loadSettings() {
  const stored = readJSON(KEY, null);
  if (!stored || typeof stored !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings) {
  writeJSON(KEY, { ...DEFAULT_SETTINGS, ...settings });
}
