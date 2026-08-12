import type { ItemFunction } from '../types';

export const executeDicePlus2: ItemFunction = async () => {
  return { updates: {}, activeEffect: 'i_dice_plus2', message: '🛡️ ダイス+2カードをセット！\n次のサイコロの出目が「+2」されます！' };
};

export const executeDiceMinus2: ItemFunction = async () => {
  return { updates: {}, activeEffect: 'i_dice_minus2', message: '🗡️ ダイス-2カードをセット！\n次のサイコロ勝負時、相手の出目を「-2」します！' };
};

export const executeShield: ItemFunction = async () => {
  return { updates: {}, activeEffect: 'i_shield', message: '🛡️ 防御シールドをセット！\n次に相手から攻撃やなすりつけを受けた時、1度だけ無効化します！' };
};

export const executeMissionPass: ItemFunction = async () => {
  return { updates: {}, activeEffect: 'i_mission_pass', message: '🎟️ ミッションフリーパスをセット！\n次のミッションで失敗しても、無条件でクリア扱いになります！' };
};

export const executeDebtClear: ItemFunction = async ({ userId, me, modal }) => {
  if ((me?.money || 0) >= 0) {
    await modal.showAlert('⚠️ 借金がないため、徳政令カードは使えません！');
    return null;
  }
  return {
    updates: { [`players.${userId}.money`]: 0 },
    message: '🕊️ 徳政令カード発動！\nなんと、あなたの借金がすべて「0円」になりました！'
  };
};