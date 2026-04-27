import { subscribeStorageError } from './local-storage.js';

// 同一エラーで alert を連発しないためのクールダウン
const COOLDOWN_MS = 30_000;
let lastAlertedAt = 0;

function messageFor(event) {
  if (event.type === 'write') {
    if (event.error === 'quota') {
      return (
        'ブラウザのストレージ容量が不足しているため、データを保存できません。\n' +
        '履歴の「すべて削除」を試すか、ブラウザのデータをクリアしてください。'
      );
    }
    if (event.error === 'unavailable') {
      return (
        'ブラウザのストレージにアクセスできないため、データを保存できません。\n' +
        'プライベートモードや拡張機能の影響がないか確認してください。'
      );
    }
    return 'データの保存に失敗しました。';
  }
  // read 破損は fallback で動作継続するため alert しない（コンソールにのみ出力）
  return null;
}

let installed = false;

// アプリのエントリポイントから 1 回だけ呼ぶ。複数回呼ばれても多重購読しない
export function setupStorageErrorAlerts() {
  if (installed) return;
  installed = true;
  subscribeStorageError((event) => {
    const message = messageFor(event);
    if (!message) return;
    const now = Date.now();
    if (now - lastAlertedAt < COOLDOWN_MS) return;
    lastAlertedAt = now;
    // alert は同期ブロックするため、render と競合しないよう次のタスクにずらす
    setTimeout(() => window.alert(message), 0);
  });
}
