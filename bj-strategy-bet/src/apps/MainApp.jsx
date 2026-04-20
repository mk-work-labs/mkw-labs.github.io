import StrategyPanel from '../components/StrategyPanel/StrategyPanel.jsx';
import BettingPanel from '../components/BettingPanel/BettingPanel.jsx';
import './MainApp.css';

export default function MainApp() {
  return (
    <main className="main-app">
      <header className="main-app__header">
        <h1 className="main-app__title">Blackjack</h1>
      </header>
      <StrategyPanel />
      <BettingPanel />
      <nav className="main-app__nav">
        <a href="./settings.html">設定</a>
        <a href="./history.html">履歴</a>
      </nav>
    </main>
  );
}
