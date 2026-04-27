import { useCallback, useEffect, useMemo, useState } from 'react';
import StrategyPanel from '../components/StrategyPanel/StrategyPanel.jsx';
import BettingPanel from '../components/BettingPanel/BettingPanel.jsx';
import SessionChart from '../components/SessionChart/SessionChart.jsx';
import SettingsOverlay from '../components/Settings/SettingsOverlay.jsx';
import HistoryOverlay from '../components/History/HistoryOverlay.jsx';
import { loadSession } from '../storage/session-storage.js';
import { loadSettings } from '../storage/settings-storage.js';
import { subscribeStorage } from '../storage/local-storage.js';
import './MainApp.css';

const SETTINGS_KEY = 'bj-strategy-bet:settings';
const SESSION_KEY = 'bj-strategy-bet:current-session';

export default function MainApp() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  // 設定保存や履歴復元のたびに増やして BettingPanel を強制再マウントし、
  // 新しい設定・セッションを確実に反映させる
  const [bettingVersion, setBettingVersion] = useState(0);
  // ストラテジー表編集後、この state を更新することで MainApp が再レンダリングされ、
  // 子の StrategyPanel も再評価されて judgeAction がカスタム表を読み直す。
  // カード選択状態を保持するため key による再マウントは避ける
  const [, setStrategyRevision] = useState(0);

  // SessionChart 用に hands / methodSwitches / fundAdjustments と settings（initialFund）を保持。
  // BettingPanel から callback で同期、settings は保存直後に再読込する。
  const [hands, setHands] = useState(() => loadSession()?.hands ?? []);
  const [methodSwitches, setMethodSwitches] = useState(
    () => loadSession()?.methodSwitches ?? []
  );
  const [fundAdjustments, setFundAdjustments] = useState(
    () => loadSession()?.fundAdjustments ?? []
  );
  const settings = useMemo(() => loadSettings(), [bettingVersion]);

  const handleSettingsSaved = () => {
    setBettingVersion((v) => v + 1);
  };

  const handleStrategyChanged = () => {
    setStrategyRevision((v) => v + 1);
  };

  const handleSessionChange = useCallback(
    ({ hands, methodSwitches, fundAdjustments }) => {
      setHands(hands);
      setMethodSwitches(methodSwitches ?? []);
      setFundAdjustments(fundAdjustments ?? []);
    },
    []
  );

  const handleHistoryRestored = useCallback(() => {
    // 復元後に current-session と settings を読み直すため bettingVersion を bump。
    // hands は先に同期更新してフリッカーを避ける。
    const restored = loadSession();
    setHands(restored?.hands ?? []);
    setMethodSwitches(restored?.methodSwitches ?? []);
    setFundAdjustments(restored?.fundAdjustments ?? []);
    setBettingVersion((v) => v + 1);
  }, []);

  const reloadFromSession = useCallback(() => {
    const restored = loadSession();
    setHands(restored?.hands ?? []);
    setMethodSwitches(restored?.methodSwitches ?? []);
    setFundAdjustments(restored?.fundAdjustments ?? []);
    setBettingVersion((v) => v + 1);
  }, []);

  // 他タブの変更（storage イベント）と bfcache 復元（pageshow persisted=true）に追従する。
  // 同じタブ内の保存ではイベントが発火しないため、自タブの操作とは干渉しない。
  useEffect(() => {
    const unsubSettings = subscribeStorage(SETTINGS_KEY, () => {
      setBettingVersion((v) => v + 1);
    });
    const unsubSession = subscribeStorage(SESSION_KEY, () => {
      const ok = window.confirm(
        '他のタブで現在のセッションが変更されました。\nこのタブを再読み込みしますか？\n（再読み込みしないと未保存の操作で他タブの変更が上書きされる可能性があります）'
      );
      if (ok) reloadFromSession();
    });
    const handlePageShow = (e) => {
      if (e.persisted) reloadFromSession();
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      unsubSettings();
      unsubSession();
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [reloadFromSession]);

  return (
    <main className="main-app">
      <header className="main-app__header">
        <h1 className="main-app__title">Blackjack</h1>
      </header>
      <StrategyPanel />
      <BettingPanel key={bettingVersion} onSessionChange={handleSessionChange} />
      <SessionChart
        hands={hands}
        initialFund={settings.initialFund}
        methodSwitches={methodSwitches}
        fundAdjustments={fundAdjustments}
      />
      <nav className="main-app__nav">
        <button
          type="button"
          className="main-app__nav-btn"
          onClick={() => setSettingsOpen(true)}
        >
          設定
        </button>
        <button
          type="button"
          className="main-app__nav-btn"
          onClick={() => setHistoryOpen(true)}
        >
          履歴
        </button>
      </nav>
      <SettingsOverlay
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={handleSettingsSaved}
        onStrategyChanged={handleStrategyChanged}
      />
      <HistoryOverlay
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRestored={handleHistoryRestored}
      />
    </main>
  );
}
