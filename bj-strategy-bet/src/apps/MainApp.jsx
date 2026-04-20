export default function MainApp() {
  return (
    <main style={{ padding: '1.5rem 1rem' }}>
      <h1>Blackjack</h1>
      <p>メイン画面（ストラテジー＋ベッティング）のプレースホルダ</p>
      <nav style={{ marginTop: '1rem' }}>
        <ul style={{ listStyle: 'none', display: 'flex', gap: '1rem' }}>
          <li><a href="./settings.html">設定</a></li>
          <li><a href="./history.html">履歴</a></li>
        </ul>
      </nav>
    </main>
  );
}
