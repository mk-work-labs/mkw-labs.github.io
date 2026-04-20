import { readJSON, writeJSON, remove } from './local-storage.js';

// 仕様書 §6.1 のキー。現在のセッションのみ保持（履歴は history キーで別管理）
const KEY = 'bj-strategy-bet:current-session';

// 保存形式は仕様書 §6.2 の current-session スキーマに準拠
export function loadSession() {
  const stored = readJSON(KEY, null);
  if (!stored || typeof stored !== 'object') return null;
  return stored;
}

export function saveSession(session) {
  writeJSON(KEY, session);
}

export function clearSession() {
  remove(KEY);
}
