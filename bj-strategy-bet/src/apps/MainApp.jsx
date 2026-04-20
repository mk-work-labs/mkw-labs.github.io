import { useState } from 'react';
import StrategyPanel from '../components/StrategyPanel/StrategyPanel.jsx';
import BettingPanel from '../components/BettingPanel/BettingPanel.jsx';
import SettingsOverlay from '../components/Settings/SettingsOverlay.jsx';
import './MainApp.css';

export default function MainApp() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  // 設定保存のたびに増やして BettingPanel を強制再マウントし、
  // 新しい設定（ベッティング法・ベースベット）を確実に反映させる
  const [bettingVersion, setBettingVersion] = useState(0);

  const handleSettingsSaved = () => {
    setBettingVersion((v) => v + 1);
  };

  return (
    <main className="main-app">
      <header className="main-app__header">
        <h1 className="main-app__title">Blackjack</h1>
      </header>
      <StrategyPanel />
      <BettingPanel key={bettingVersion} />
      <nav className="main-app__nav">
        <button
          type="button"
          className="main-app__nav-btn"
          onClick={() => setSettingsOpen(true)}
        >
          設定
        </button>
        <a href="./history.html">履歴</a>
      </nav>
      <SettingsOverlay
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={handleSettingsSaved}
      />
    </main>
  );
}
