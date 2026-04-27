// localStorage の薄いラッパー。JSON シリアライズ/パースを吸収する。
// 失敗時はフォールバック値を返しつつ、subscribeStorageError 経由で UI に通知できる。

function isAvailable() {
  return typeof window !== 'undefined' && window.localStorage;
}

const errorListeners = new Set();

// UI 側からストレージのエラーを購読する。返り値は解除関数
export function subscribeStorageError(listener) {
  errorListeners.add(listener);
  return () => {
    errorListeners.delete(listener);
  };
}

// 他タブからの localStorage 変更を購読する。
// 'storage' イベントは書き込み元タブには発火しないため、自タブの書き込みでループする心配はない。
const storageListeners = new Map(); // key -> Set<listener>
let storageHandlerInstalled = false;

function ensureStorageHandler() {
  if (storageHandlerInstalled || typeof window === 'undefined') return;
  storageHandlerInstalled = true;
  window.addEventListener('storage', (e) => {
    if (!e.key) return; // localStorage.clear() で全消去された場合
    const set = storageListeners.get(e.key);
    if (!set) return;
    for (const listener of set) {
      try {
        listener({
          key: e.key,
          oldValue: e.oldValue,
          newValue: e.newValue,
        });
      } catch {
        // listener 例外で他に波及させない
      }
    }
  });
}

export function subscribeStorage(key, listener) {
  ensureStorageHandler();
  let set = storageListeners.get(key);
  if (!set) {
    set = new Set();
    storageListeners.set(key, set);
  }
  set.add(listener);
  return () => {
    const s = storageListeners.get(key);
    if (!s) return;
    s.delete(listener);
    if (s.size === 0) storageListeners.delete(key);
  };
}

function emitError(event) {
  for (const listener of errorListeners) {
    try {
      listener(event);
    } catch {
      // listener 側のエラーで他の listener を巻き込まない
    }
  }
}

function classifyWriteError(err) {
  if (!err) return 'unknown';
  // Chrome/Firefox/Safari のいずれかで quota 超過を識別できるように複数条件
  if (err.name === 'QuotaExceededError') return 'quota';
  if (err.code === 22 || err.code === 1014) return 'quota';
  return 'unknown';
}

export function readJSON(key, fallback = null) {
  if (!isAvailable()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`localStorage read failed for "${key}":`, e);
    emitError({ type: 'read', key, error: 'parse', message: e?.message });
    return fallback;
  }
}

// 書き込み結果を { ok, error? } で返す。呼び出し側は無視可能だが、
// 通知が必要な箇所では subscribeStorageError でハンドリングできる
export function writeJSON(key, value) {
  if (!isAvailable()) {
    emitError({ type: 'write', key, error: 'unavailable' });
    return { ok: false, error: 'unavailable' };
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (e) {
    const error = classifyWriteError(e);
    console.error(`localStorage write failed for "${key}":`, e);
    emitError({ type: 'write', key, error, message: e?.message });
    return { ok: false, error };
  }
}

export function remove(key) {
  if (!isAvailable()) return { ok: false, error: 'unavailable' };
  try {
    window.localStorage.removeItem(key);
    return { ok: true };
  } catch (e) {
    console.error(`localStorage remove failed for "${key}":`, e);
    emitError({ type: 'remove', key, error: 'unknown', message: e?.message });
    return { ok: false, error: 'unknown' };
  }
}
