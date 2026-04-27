import { useRef, useState } from 'react';
import {
  METHODS,
  getMethodLabel,
  getMethodDescription,
} from '../../logic/betting/registry.js';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  normalizeMontecarloSequence,
  normalizeMontecarloCycleEndRule,
} from '../../storage/settings-storage.js';
import { loadSession } from '../../storage/session-storage.js';
import './SettingsForm.css';

function parsePositiveInt(value, fallback) {
  const n = Math.trunc(Number(String(value).replace(/[^\d-]/g, '')));
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

// ドラフト配列（{id, value} を持つ）から値だけ取り出して数値配列へ。空・非数値は落とす
function parseSequenceDraft(draft) {
  return draft
    .map((t) => String(t.value).trim())
    .filter((t) => t.length > 0)
    .map((t) => Number(t));
}

// hands 末尾から連続する win(+bj) または loss を数える。push はスキップ。
function computeTailStreak(hands) {
  let length = 0;
  let kind = null;
  for (let i = hands.length - 1; i >= 0; i--) {
    const h = hands[i];
    if (h.result === 'push') continue;
    const k = h.result === 'win' || h.result === 'bj' ? 'win' : 'loss';
    if (kind === null) {
      kind = k;
      length = 1;
    } else if (k === kind) {
      length += 1;
    } else {
      break;
    }
  }
  return { length, kind };
}

// ページ版とオーバーレイ版で共用するフォーム本体。
// onSaved は保存完了時に呼ばれる（親側で再読み込みや閉じる判断に使う）
// onEditStrategy があればストラテジー表編集への導線ボタンを表示する（オーバーレイ用）
export default function SettingsForm({ onSaved, onEditStrategy }) {
  const [form, setForm] = useState(() => loadSettings());
  // 数列要素ごとに安定 ID を持たせる。中間削除時に他の input のフォーカス・値が
  // 隣接エントリへ「ずれ込む」のを防ぐ
  const seqIdCounterRef = useRef(0);
  const makeSeqId = () => `mc-seq-${++seqIdCounterRef.current}`;
  const [mcSequenceDraft, setMcSequenceDraft] = useState(() => {
    const initial = loadSettings().methodOptions?.montecarlo?.sequence ?? [1, 2, 3];
    return initial.map((v) => ({ id: makeSeqId(), value: String(v) }));
  });
  const [savedAt, setSavedAt] = useState(null);

  const mcCycleEndRule = normalizeMontecarloCycleEndRule(
    form.methodOptions?.montecarlo?.cycleEndRule
  );

  const updateMcCycleEndRule = (value) => {
    setForm((prev) => ({
      ...prev,
      methodOptions: {
        ...(prev.methodOptions ?? {}),
        montecarlo: {
          ...(prev.methodOptions?.montecarlo ?? {}),
          cycleEndRule: value,
        },
      },
    }));
    setSavedAt(null);
  };

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedAt(null);
  };

  const updateMcElement = (id, value) => {
    // number input は負号や小数点を含む文字列を渡してくる可能性があるので
    // 入力中は緩く受け、保存時に normalize する
    setMcSequenceDraft((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, value } : entry))
    );
    setSavedAt(null);
  };

  const removeMcElement = (id) => {
    setMcSequenceDraft((prev) => {
      if (prev.length <= 2) return prev; // 最小 2 要素は保持
      return prev.filter((entry) => entry.id !== id);
    });
    setSavedAt(null);
  };

  const addMcElement = () => {
    setMcSequenceDraft((prev) => [...prev, { id: makeSeqId(), value: '' }]);
    setSavedAt(null);
  };

  const handleSave = (event) => {
    event.preventDefault();
    const currentMcSequence =
      form.methodOptions?.montecarlo?.sequence ??
      DEFAULT_SETTINGS.methodOptions.montecarlo.sequence;
    const normalizedSequence = normalizeMontecarloSequence(
      parseSequenceDraft(mcSequenceDraft),
      currentMcSequence
    );
    const normalized = {
      ...form,
      initialFund: parsePositiveInt(form.initialFund, DEFAULT_SETTINGS.initialFund),
      baseBet: parsePositiveInt(form.baseBet, DEFAULT_SETTINGS.baseBet),
      methodOptions: {
        ...(form.methodOptions ?? {}),
        montecarlo: {
          ...(form.methodOptions?.montecarlo ?? {}),
          sequence: normalizedSequence,
          cycleEndRule: normalizeMontecarloCycleEndRule(
            form.methodOptions?.montecarlo?.cycleEndRule
          ),
        },
      },
    };

    // §4.3.4.6: ベッティング法の変更で連勝/連敗中なら誤操作防止の確認を出す
    const current = loadSession();
    const isMethodChanged =
      current &&
      current.currentMethod &&
      current.currentMethod !== normalized.bettingMethod &&
      Array.isArray(current.hands) &&
      current.hands.length > 0;
    if (isMethodChanged) {
      const streak = computeTailStreak(current.hands);
      if (streak.length >= 2) {
        const label = streak.kind === 'win' ? '連勝' : '連敗';
        const ok = window.confirm(
          `現在 ${streak.length} ${label}中です。\n` +
            `「${getMethodLabel(current.currentMethod)}」から「${getMethodLabel(normalized.bettingMethod)}」へ切替えますか？\n` +
            '新しいメソッドは初期状態から開始します（資金は引き継がれます）。'
        );
        if (!ok) return;
      }
    }

    setForm(normalized);
    // 正規化結果を入力欄にも反映（不正入力は既定値に戻る）。ID は再採番して既存 input を入れ替える
    setMcSequenceDraft(normalizedSequence.map((v) => ({ id: makeSeqId(), value: String(v) })));
    saveSettings(normalized);
    setSavedAt(new Date());
    onSaved?.(normalized);
  };

  const handleResetToDefaults = () => {
    const defaultSequence = [
      ...DEFAULT_SETTINGS.methodOptions.montecarlo.sequence,
    ];
    setForm({
      ...DEFAULT_SETTINGS,
      methodOptions: {
        montecarlo: {
          sequence: defaultSequence,
          cycleEndRule: DEFAULT_SETTINGS.methodOptions.montecarlo.cycleEndRule,
        },
      },
    });
    setMcSequenceDraft(defaultSequence.map((v) => ({ id: makeSeqId(), value: String(v) })));
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
        {getMethodDescription(form.bettingMethod) && (
          <p className="settings-form__method-desc">
            {getMethodDescription(form.bettingMethod)}
          </p>
        )}
        <p className="settings-form__hint">
          切替え時は新しいメソッドを初期状態から開始し、資金は引き継がれます
        </p>
      </label>

      {form.bettingMethod === 'montecarlo' && (
        <div className="settings-form__field">
          <span className="settings-form__label">モンテカルロ数列（初期値）</span>
          <div className="settings-form__seq" role="group" aria-label="モンテカルロ数列">
            {mcSequenceDraft.map((entry, i) => (
              <div className="settings-form__seq-item" key={entry.id}>
                <span className="settings-form__seq-index">#{i + 1}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  className="settings-form__seq-input"
                  value={entry.value}
                  onChange={(e) => updateMcElement(entry.id, e.target.value)}
                  aria-label={`${i + 1} 番目の値`}
                />
                <button
                  type="button"
                  className="settings-form__seq-remove"
                  onClick={() => removeMcElement(entry.id)}
                  disabled={mcSequenceDraft.length <= 2}
                  aria-label={`${i + 1} 番目を削除`}
                  title={
                    mcSequenceDraft.length <= 2
                      ? '最低 2 個必要です'
                      : '削除'
                  }
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="settings-form__seq-add"
              onClick={addMcElement}
              aria-label="数列に要素を追加"
              title="要素を追加"
            >
              ＋
            </button>
          </div>
          <p className="settings-form__hint">
            先頭 + 末尾が初期ベット単位になります（例: [1, 2, 3, 4] なら 5u）。
            正の整数 2 個以上。保存時に正規化され、次回サイクル開始から反映されます。
          </p>
        </div>
      )}

      {form.bettingMethod === 'montecarlo' && (
        <div className="settings-form__field">
          <span className="settings-form__label">サイクル終了条件</span>
          <div
            className="settings-form__radio-group"
            role="radiogroup"
            aria-label="モンテカルロ法のサイクル終了条件"
          >
            <label
              className={
                'settings-form__radio' +
                (mcCycleEndRule === 'empty'
                  ? ' settings-form__radio--selected'
                  : '')
              }
            >
              <input
                type="radio"
                name="mcCycleEndRule"
                value="empty"
                checked={mcCycleEndRule === 'empty'}
                onChange={(e) => updateMcCycleEndRule(e.target.value)}
              />
              <span className="settings-form__radio-title">
                数列が空になるまで続ける
              </span>
              <span className="settings-form__radio-desc">
                本来の Labouchère。1 要素になっても 1u をベットし、勝てば空 → 初期化
              </span>
            </label>
            <label
              className={
                'settings-form__radio' +
                (mcCycleEndRule === 'single'
                  ? ' settings-form__radio--selected'
                  : '')
              }
            >
              <input
                type="radio"
                name="mcCycleEndRule"
                value="single"
                checked={mcCycleEndRule === 'single'}
                onChange={(e) => updateMcCycleEndRule(e.target.value)}
              />
              <span className="settings-form__radio-title">
                1 要素になった時点でリセット
              </span>
              <span className="settings-form__radio-desc">
                日本で紹介される簡易版。1 要素でのベットはスキップし、即初期化
              </span>
            </label>
          </div>
        </div>
      )}

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
