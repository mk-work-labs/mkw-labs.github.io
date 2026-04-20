import SettingsForm from '../components/Settings/SettingsForm.jsx';
import './SettingsApp.css';

export default function SettingsApp() {
  return (
    <main className="settings-app">
      <header className="settings-app__header">
        <h1 className="settings-app__title">設定</h1>
        <a className="settings-app__back" href="./index.html">
          ← メインへ戻る
        </a>
      </header>

      <div className="settings-app__card">
        <SettingsForm />
      </div>
    </main>
  );
}
