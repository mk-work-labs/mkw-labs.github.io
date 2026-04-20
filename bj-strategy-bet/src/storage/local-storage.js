// localStorage の薄いラッパー。JSON シリアライズ/パースを吸収し、
// パース失敗や書き込みエラー時にはフォールバック or ログで握り潰す。

function isAvailable() {
  return typeof window !== 'undefined' && window.localStorage;
}

export function readJSON(key, fallback = null) {
  if (!isAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`localStorage read failed for "${key}":`, e);
    return fallback;
  }
}

export function writeJSON(key, value) {
  if (!isAvailable()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`localStorage write failed for "${key}":`, e);
  }
}

export function remove(key) {
  if (!isAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch (e) {
    console.warn(`localStorage remove failed for "${key}":`, e);
  }
}
