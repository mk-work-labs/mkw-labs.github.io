// ランク（'A'・'2'..'9'・'10'）からブラックジャックの点数を算出。
// '10' は 10/J/Q/K を兼ねるため 10 固定。A は呼び出し側で 1/11 を決める。
export function rankBaseValue(rank) {
  if (rank === 'A') return 11;
  return parseInt(rank, 10);
}

// 手札の合計値と、A を 11 のまま保てているか（ソフトか）を返す。
// 仕様書 §4.2.3 のエース自動判定に従い、バストする場合のみ A を 1 に降格。
export function handTotal(cards) {
  let total = 0;
  let softAces = 0;
  for (const c of cards) {
    if (c === 'A') {
      total += 11;
      softAces += 1;
    } else {
      total += parseInt(c, 10);
    }
  }
  while (total > 21 && softAces > 0) {
    total -= 10;
    softAces -= 1;
  }
  return { total, isSoft: softAces > 0 };
}

// 2枚の初期ハンドを分類してストラテジー表の参照キーを返す。
// pair を最優先し、次にソフト、最後にハードで判定（仕様書 §4.2.6）。
export function classifyHand(playerCards) {
  if (!Array.isArray(playerCards)) return null;
  if (playerCards.some((c) => c === null || c === undefined)) return null;

  if (playerCards.length === 2 && playerCards[0] === playerCards[1]) {
    return { type: 'pair', key: playerCards[0] };
  }

  const { total, isSoft } = handTotal(playerCards);
  return { type: isSoft ? 'soft' : 'hard', key: total };
}
