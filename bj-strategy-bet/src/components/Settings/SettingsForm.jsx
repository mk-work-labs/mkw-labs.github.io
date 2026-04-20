import { useState } from 'react';
import { METHODS } from '../../logic/betting/registry.js';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from '../../storage/settings-storage.js';
import './SettingsForm.css';

function parsePositiveInt(value, fallback) {
  const n = Math.trunc(Number(String(value).replace(/[^\d-]/g, '')));
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

// ページ版とオーバーレイ版で共用するフォーム本体。
// onSaved は保存完了時に呼ばれる（親側で再読み込みや閉じる判断に使う）
// onEditStrategy があればストラテジー表編集への導線ボタンを表示する（オーバーレイ用）
export default function SettingsForm({ onSaved, onEditStrategy }) {
  const [form, setForm] = useState(() => loadSettings());
  const [savedAt, setSavedAt] = useState(null);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedAt(null);
  };

  const handleSave = (event) => {
    event.preventDefault();
    const normalized = {
      ...form,
      initialFund: parsePositiveInt(form.initialFund, DEFAULT_SETTINGS.initialFund),
      baseBet: parsePositiveInt(form.baseBet, DEFAULT_SETTINGS.baseBet),
    };
    setForm(normalized);
    saveSettings(normalized);
    setSavedAt(new Date());
    onSaved?.(normalized);
  };

  const handleResetToDefaults = () => {
    setForm({ ...DEFAULT_SETTINGS });
    setSavedAt(null);
  };

  return (
    <form className="settings-form" onSubmit={handleSave}>
      <label className="settings-form__field">
        <span className="settings-form__label">初期資金（リセット時の復帰先）</span>
        <div className="settings-form__input-row">
          <span className="settings-form__prefix">¥</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            className="settings-form__input"
            value={form.initialFund}
            onChange={(e) => update('initialFund', e.target.value)}
          />
        </div>
        <p className="settings-form__hint">
          現在の資金はメイン画面の「編集」ボタンから直接変更できます
        </p>
      </label>

      <label className="settings-form__field">
        <span className="settings-form__label">ベースベット（1 ユニット）</span>
        <div className="settings-form__input-row">
          <span className="settings-form__prefix">¥</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            className="settings-form__input"
            value={form.baseBet}
            onChange={(e) => update('baseBet', e.target.value)}
          />
        </div>
        <p className="settings-form__hint">
          保存後、次回ベットから即時反映されます
        </p>
      </label>

      <label className="settings-form__field">
        <span className="settings-form__label">ベッティング法</span>
        <select
          className="settings-form__select"
          value={form.bettingMethod}
          onChange={(e) => update('bettingMethod', e.target.value)}
        >
          {METHODS.map((m) => (
            <option key={m.id} value={m.id} disabled={!m.implemented}>
              {m.label}
              {m.implemented ? '' : '（未実装）'}
            </option>
          ))}
        </select>
        <p className="settings-form__hint">
          切替え時は新しいメソッドを初期状態から開始し、資金は引き継がれます
        </p>
      </label>

      {onEditStrategy && (
        <button
          type="button"
          className="settings-form__link"
          onClick={onEditStrategy}
        >
          ストラテジー表を編集 →
        </button>
      )}

      <div className="settings-form__actions">
        <button type="submit" className="settings-form__save">
          保存
        </button>
        <button
          type="button"
          className="settings-form__reset"
          onClick={handleResetToDefaults}
        >
          デフォルトに戻す
        </button>
      </div>

      {savedAt && (
        <p className="settings-form__saved">
          保存しました（{savedAt.toLocaleTimeString('ja-JP')}）
        </p>
      )}
    </form>
  );
}
