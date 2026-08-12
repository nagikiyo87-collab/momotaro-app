import type { ItemFunction } from '../types';
import { MISSIONS } from '../../../data/gameData';

export const executeDiceDouble: ItemFunction = async () => {
  return { updates: {}, activeEffect: 'i_dice_double', message: '🎲 サイコロ2個振りをセット！\n次の移動時、サイコロを2個振れます！' };
};

export const executeMissionReroll: ItemFunction = async ({ userId, roomData }) => {
  const currentSquareType = roomData.squareType || 'blue';
  const targetMissions = MISSIONS.filter(m => m.type === currentSquareType);
  const newMission = targetMissions[Math.floor(Math.random() * targetMissions.length)];
  return {
    updates: { [`currentMissions.${userId}`]: newMission.id },
    message: '🔄 ミッション再抽選発動！\n自分のお題を新しいものに変更しました！'
  };
};

export const executeLottery: ItemFunction = async () => {
  return { updates: {}, message: '🎫 宝くじカード発動！\n現実でスクラッチ等を買い、当たった金額の100倍をゲーム内で獲得できます！（※自己申告制）' };
};

export const executeStationSkip: ItemFunction = async () => {
  return {
    updates: { phase: 'bidding' },
    message: '⏭️ 駅スキップ発動！\nミッションを強制終了し、すぐに入札フェーズへ移動します！'
  };
};

export const executeRewardDouble: ItemFunction = async () => {
  return { updates: {}, activeEffect: 'i_reward_double', message: '💰 報酬2倍カードをセット！\n次のミッション成功時、もらえるお金が2倍になります！' };
};

export const executeRandomBox: ItemFunction = async ({ userId, me }) => {
  const getMoney = Math.floor(Math.random() * 30 + 1) * 100;
  return {
    updates: { [`players.${userId}.money`]: (me?.money || 0) + getMoney },
    message: `🎁 ランダムボックスを開けた！\nなんと【${getMoney}円】を手に入れた！`
  };
};

export const executeTimeExtend: ItemFunction = async ({ roomData }) => {
  return {
    updates: { stayTime: (roomData.stayTime || 0) + 30 },
    message: '⏱️ 時間増加カード発動！\n滞在時間が「30分」延長されました！'
  };
};