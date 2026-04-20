const DEALER_COLS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

function row(...actions) {
  const r = {};
  DEALER_COLS.forEach((col, i) => {
    r[col] = actions[i];
  });
  return Object.freeze(r);
}

// 仕様書 §4.2.4 ハードハンド
export const HARD_STRATEGY = Object.freeze({
  5:  row('H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'),
  6:  row('H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'),
  7:  row('H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'),
  8:  row('H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'),
  9:  row('H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'),
  10: row('D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'),
  11: row('D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H'),
  12: row('H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'),
  13: row('S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'),
  14: row('S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'),
  15: row('S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'),
  16: row('S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'),
  17: row('S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'),
  18: row('S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'),
  19: row('S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'),
  20: row('S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'),
  21: row('S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'),
});

// 仕様書 §4.2.4 ソフトハンド（A+X、合計値でキー）
// 21 は仕様書の表にはないが、A+10 = BJ相当のフォールバックとして S 固定を追加
export const SOFT_STRATEGY = Object.freeze({
  13: row('H',  'H',  'H',  'D',  'D',  'H', 'H', 'H', 'H', 'H'),
  14: row('H',  'H',  'H',  'D',  'D',  'H', 'H', 'H', 'H', 'H'),
  15: row('H',  'H',  'D',  'D',  'D',  'H', 'H', 'H', 'H', 'H'),
  16: row('H',  'H',  'D',  'D',  'D',  'H', 'H', 'H', 'H', 'H'),
  17: row('H',  'D',  'D',  'D',  'D',  'H', 'H', 'H', 'H', 'H'),
  18: row('S',  'Ds', 'Ds', 'Ds', 'Ds', 'S', 'S', 'H', 'H', 'H'),
  19: row('S',  'S',  'S',  'S',  'S',  'S', 'S', 'S', 'S', 'S'),
  20: row('S',  'S',  'S',  'S',  'S',  'S', 'S', 'S', 'S', 'S'),
  21: row('S',  'S',  'S',  'S',  'S',  'S', 'S', 'S', 'S', 'S'),
});

// 仕様書 §4.2.4 ペア（DAS不可の条件）
export const PAIR_STRATEGY = Object.freeze({
  '2':  row('H', 'H', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'),
  '3':  row('H', 'H', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'),
  '4':  row('H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'),
  '5':  row('D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'),
  '6':  row('H', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H', 'H'),
  '7':  row('P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'),
  '8':  row('P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'),
  '9':  row('P', 'P', 'P', 'P', 'P', 'S', 'P', 'P', 'S', 'S'),
  '10': row('S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'),
  'A':  row('P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'),
});
