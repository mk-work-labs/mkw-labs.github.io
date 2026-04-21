import HistoryView from '../components/History/HistoryView.jsx';
import './HistoryApp.css';

export default function HistoryApp() {
  const handleRestore = () => {
    window.location.href = './index.html';
  };

  return (
    <main className="history-app">
      <header className="history-app__header">
        <h1 className="history-app__title">履歴</h1>
        <a className="history-app__back" href="./index.html">
          ← メインへ戻る
        </a>
      </header>
      <HistoryView onRestore={handleRestore} />
    </main>
  );
}
