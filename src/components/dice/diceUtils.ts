/** 「3 ＋ 5」「4 ＋ 2（カード）」のような式。1 個振りでボーナスなしなら null */
export const diceFormula = (values: number[], bonus: number) => {
  if (values.length > 1) return values.join(' ＋ ') + (bonus ? ` ＋ ${bonus}（カード）` : '');
  if (bonus) return `${values[0]} ＋ ${bonus}（カード）`;
  return null;
};

/** 大きく表示するときの背景（緑のグラデーション） */
export const STAGE_BACKGROUND = 'radial-gradient(ellipse at 50% 35%, rgba(62,128,58,0.97) 0%, rgba(22,64,36,0.98) 80%)';
