import { useMemo } from 'react';
import './SessionChart.css';

const VIEW_W = 320;
const VIEW_H = 160;
const PAD_L = 36;
const PAD_R = 8;
const PAD_T = 12;
const PAD_B = 20;
const PLOT_W = VIEW_W - PAD_L - PAD_R;
const PLOT_H = VIEW_H - PAD_T - PAD_B;

function formatAxisValue(n) {
  return Math.round(n).toLocaleString('ja-JP');
}

function formatYenSigned(n) {
  const v = Math.round(n);
  const sign = v > 0 ? '+' : v < 0 ? '-' : '';
  return `${sign}¥${Math.abs(v).toLocaleString('ja-JP')}`;
}

// hands と initialFund から SVG 描画に必要な座標群を算出。
// 最左端を initialFund とし、以降は hands[].fundAfter を等間隔に並べる。
function buildChart(hands, initialFund, methodSwitches, fundAdjustments) {
  const funds = [initialFund, ...hands.map((h) => h.fundAfter)];
  // 資金編集の after 値も Y 軸範囲に含める（最後のハンド以降に編集された場合などで funds 外になり得る）
  const adjAfters = (fundAdjustments ?? [])
    .map((a) => Number(a?.after))
    .filter((v) => Number.isFinite(v));
  const dataMin = Math.min(...funds, ...adjAfters);
  const dataMax = Math.max(...funds, ...adjAfters);
  let range = dataMax - dataMin;
  if (range === 0) {
    // 平坦線の時に潰れないよう、initialFund の 10% をフォールバックに敷く
    range = Math.max(Math.abs(initialFund) * 0.1, 1);
  }
  const margin = range * 0.1;
  const yMin = dataMin - margin;
  const yMax = dataMax + margin;

  const xOf = (i) => {
    const denom = Math.max(funds.length - 1, 1);
    return PAD_L + (PLOT_W * i) / denom;
  };
  const yOf = (v) => PAD_T + PLOT_H * (1 - (v - yMin) / (yMax - yMin));

  const points = funds.map((v, i) => ({ x: xOf(i), y: yOf(v) }));
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  const lastPoint = hands.length > 0 ? points[points.length - 1] : null;

  // 切替えマーカー: atHandId=N はハンド N の直前の境界 → funds[N-1] と funds[N] の中点に縦線
  const switches = (methodSwitches ?? [])
    .map((sw) => {
      const idx = Number(sw.atHandId) - 1;
      if (!Number.isFinite(idx) || idx < 0 || idx >= funds.length) return null;
      const x =
        idx === funds.length - 1
          ? xOf(idx)
          : (xOf(idx) + xOf(idx + 1)) / 2;
      return {
        x,
        from: sw.from,
        to: sw.to,
        atHandId: sw.atHandId,
        timestamp: sw.timestamp,
      };
    })
    .filter(Boolean);

  // 資金編集マーカー: atHandId=N は N ハンド完了直後の境界。
  // 切替えと同じ位置規則で、最後尾なら funds[N] 位置、中間なら funds[N] と funds[N+1] の中点
  const adjustments = (fundAdjustments ?? [])
    .map((adj) => {
      const idx = Number(adj.atHandId);
      if (!Number.isFinite(idx) || idx < 0 || idx >= funds.length) return null;
      const before = Number(adj.before);
      const after = Number(adj.after);
      if (!Number.isFinite(before) || !Number.isFinite(after)) return null;
      const x =
        idx === funds.length - 1
          ? xOf(idx)
          : (xOf(idx) + xOf(idx + 1)) / 2;
      return {
        x,
        yBefore: yOf(before),
        yAfter: yOf(after),
        before,
        after,
        delta: after - before,
        timestamp: adj.timestamp,
      };
    })
    .filter(Boolean);

  return {
    path,
    lastPoint,
    yInitial: yOf(initialFund),
    yTop: PAD_T,
    yBottom: PAD_T + PLOT_H,
    yMin,
    yMax,
    initialFund,
    finalHandId: hands.length,
    xFirst: xOf(1),
    xLast: xOf(funds.length - 1),
    switches,
    adjustments,
  };
}

export default function SessionChart({
  hands,
  initialFund,
  methodSwitches,
  fundAdjustments,
}) {
  const chart = useMemo(
    () => buildChart(hands, initialFund, methodSwitches, fundAdjustments),
    [hands, initialFund, methodSwitches, fundAdjustments]
  );

  const isEmpty = hands.length === 0;

  return (
    <section className="session-chart">
      <header className="session-chart__header">
        <span className="session-chart__title">資金推移</span>
        <span className="session-chart__subtitle">{hands.length} ハンド</span>
      </header>
      <svg
        className="session-chart__svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={`現在のセッションの資金推移（${hands.length} ハンド）`}
      >
        {/* プロット領域の枠線（下辺・左辺のみ） */}
        <line
          x1={PAD_L}
          y1={chart.yTop}
          x2={PAD_L}
          y2={chart.yBottom}
          stroke="#d4d4d4"
          strokeWidth="1"
        />
        <line
          x1={PAD_L}
          y1={chart.yBottom}
          x2={VIEW_W - PAD_R}
          y2={chart.yBottom}
          stroke="#d4d4d4"
          strokeWidth="1"
        />

        {/* initialFund の水平破線（損益ゼロライン） */}
        <line
          x1={PAD_L}
          y1={chart.yInitial}
          x2={VIEW_W - PAD_R}
          y2={chart.yInitial}
          stroke="#9ca3af"
          strokeDasharray="4 4"
          strokeWidth="1"
        />

        {/* ベッティング法の切替え地点（§4.3.4.5） */}
        {chart.switches.map((sw, i) => (
          <line
            key={`switch-${i}-${sw.timestamp ?? sw.atHandId}`}
            x1={sw.x}
            y1={chart.yTop}
            x2={sw.x}
            y2={chart.yBottom}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="2 3"
          >
            <title>
              {`ハンド${sw.atHandId} 切替え: ${sw.from ?? '?'} → ${sw.to ?? '?'}`}
            </title>
          </line>
        ))}

        {/* 資金編集の地点。垂直バーで before→after を可視化し、after 位置に菱形マーカー */}
        {chart.adjustments.map((adj, i) => (
          <g key={`adj-${i}-${adj.timestamp ?? i}`}>
            <line
              x1={adj.x}
              y1={adj.yBefore}
              x2={adj.x}
              y2={adj.yAfter}
              stroke="#8b5cf6"
              strokeWidth="1.25"
            >
              <title>
                {`資金編集: ${formatAxisValue(adj.before)} → ${formatAxisValue(adj.after)}（${formatYenSigned(adj.delta)}）`}
              </title>
            </line>
            <circle
              cx={adj.x}
              cy={adj.yAfter}
              r="2.5"
              fill="#8b5cf6"
            >
              <title>
                {`資金編集: ${formatAxisValue(adj.before)} → ${formatAxisValue(adj.after)}（${formatYenSigned(adj.delta)}）`}
              </title>
            </circle>
          </g>
        ))}

        {/* 折れ線 */}
        {!isEmpty && (
          <path
            d={chart.path}
            fill="none"
            stroke="#2563eb"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* 最終点マーカー */}
        {chart.lastPoint && (
          <circle
            cx={chart.lastPoint.x}
            cy={chart.lastPoint.y}
            r="3"
            fill="#2563eb"
          />
        )}

        {/* Y 軸ラベル（最上・最下・initialFund） */}
        <text
          x={PAD_L - 4}
          y={chart.yTop + 3}
          textAnchor="end"
          fontSize="10"
          fill="#666"
        >
          {formatAxisValue(chart.yMax)}
        </text>
        <text
          x={PAD_L - 4}
          y={chart.yBottom}
          textAnchor="end"
          fontSize="10"
          fill="#666"
        >
          {formatAxisValue(chart.yMin)}
        </text>
        <text
          x={PAD_L - 4}
          y={chart.yInitial + 3}
          textAnchor="end"
          fontSize="10"
          fill="#9ca3af"
        >
          {formatAxisValue(chart.initialFund)}
        </text>

        {/* X 軸ラベル（1・最終ハンド番号） */}
        {!isEmpty && (
          <>
            <text
              x={chart.xFirst}
              y={chart.yBottom + 12}
              textAnchor="middle"
              fontSize="10"
              fill="#666"
            >
              1
            </text>
            {chart.finalHandId > 1 && (
              <text
                x={chart.xLast}
                y={chart.yBottom + 12}
                textAnchor="middle"
                fontSize="10"
                fill="#666"
              >
                {chart.finalHandId}
              </text>
            )}
          </>
        )}

        {/* 空状態メッセージ */}
        {isEmpty && (
          <text
            x={VIEW_W / 2}
            y={VIEW_H / 2}
            textAnchor="middle"
            fontSize="11"
            fill="#888"
          >
            セッションを開始するとここに資金推移が表示されます
          </text>
        )}
      </svg>
    </section>
  );
}
