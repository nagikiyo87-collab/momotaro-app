import type { ItemFunction } from '../types';

// ① 所持金入れ替え
export const executeMoneySwap: ItemFunction = async ({ userId, opponentId, me, opponent }) => {
  return {
    updates: {
      [`players.${userId}.money`]: opponent?.money || 0,
      [`players.${opponentId}.money`]: me?.money || 0,
    },
    message: '💥 所持金入れ替え発動！\n自分と相手の所持金をそっくりそのまま入れ替えました！'
  };
};

// ② 割り勘カード（🔑借金時は使えないように修正！）
export const executeMoneySplit: ItemFunction = async ({ userId, opponentId, me, opponent, modal }) => {
  const myMoney = me?.money || 0;
  
  if (myMoney < 0) {
    await modal.showAlert('⚠️ 自分が借金している状態では、割り勘カードは使えません！');
    return null; // 発動キャンセル
  }

  const total = myMoney + (opponent?.money || 0);
  const half = Math.floor(total / 2);
  return {
    updates: {
      [`players.${userId}.money`]: half,
      [`players.${opponentId}.money`]: half,
    },
    message: `🤝 割り勘カード発動！\n2人の所持金を合計して、きっちり半分こ（${half}円ずつ）にしました！`
  };
};

// ③ 所持金リセット
export const executeMoneyReset: ItemFunction = async ({ opponentId }) => {
  return {
    updates: {
      [`players.${opponentId}.money`]: 0,
    },
    message: '💸 所持金リセット発動！\n相手の所持金を強制的に0円にしました！'
  };
};

// ④ ミッション入れ替え
export const executeMissionSwap: ItemFunction = async ({ userId, opponentId, roomData }) => {
  const myMission = roomData.currentMissions?.[userId];
  const opMission = roomData.currentMissions?.[opponentId];
  if (!myMission || !opMission) return null;

  return {
    updates: {
      [`currentMissions.${userId}`]: opMission,
      [`currentMissions.${opponentId}`]: myMission,
    },
    message: '🔄 ミッション入れ替え発動！\nお互いのミッションお題を入れ替えました！'
  };
};

// ⑤ ボンビーなすりつけ
export const executeBombyPass: ItemFunction = async ({ userId, opponentId, roomData, modal }) => {
  if (roomData.bombyPossessedId !== userId) {
    await modal.showAlert('⚠️ あなたにはボンビーが憑依していないため、なすりつけられません！');
    return null;
  }
  return {
    updates: {
      bombyPossessedId: opponentId,
    },
    message: '😈 ボンビーなすりつけ発動！\n自分のボンビーを相手になすりつけました！'
  };
};

// ⑥ アイテム強奪（🔑使用したカード自体は消えるように修正！）
export const executeItemSteal: ItemFunction = async ({ userId, opponentId, me, opponent, modal }) => {
  const opItems: string[] = opponent?.items || [];
  if (opItems.length === 0) {
    await modal.showAlert('⚠️ 相手はアイテムを持っていません！');
    return null; 
  }
  
  const myItems: string[] = me?.items || [];
  // ※使うと強奪カード自体が消えて枠が1つ空くため、3個満タンでも使用可能になります。
  // （ただしバグ等で4個以上持っている場合はエラーメッセージを出します）
  if (myItems.length > 3) {
    await modal.showAlert('⚠️ カバンがいっぱいで奪えません！（先にアイテムを捨ててください）');
    return null;
  }

  // ランダムに1つ奪う
  const stealIdx = Math.floor(Math.random() * opItems.length);
  const stolenItem = opItems[stealIdx];
  const newOpItems = [...opItems];
  newOpItems.splice(stealIdx, 1);
  
  // 自分のアイテムリストから「使った強奪カード」を消し、「奪ったアイテム」を追加する
  const newMyItems = [...myItems];
  const useIdx = newMyItems.indexOf('i_item_steal');
  if (useIdx !== -1) {
    newMyItems.splice(useIdx, 1);
  }
  newMyItems.push(stolenItem);
  
  return {
    updates: {
      [`players.${userId}.items`]: newMyItems,
      [`players.${opponentId}.items`]: newOpItems,
    },
    message: `🥷 アイテム強奪発動！\n相手から「${stolenItem}」を奪い取りました！`
  };
};

// ⑦ 奢りカード
export const executeTreat: ItemFunction = async ({ opponentId, opponent }) => {
  const input = window.prompt('相手に奢らせたジュース等の金額（円）を半角数字で入力してください。', '150');
  const cost = parseInt(input || '0', 10);

  if (isNaN(cost) || cost <= 0) {
    return {
      updates: {},
      message: '金額が正しく入力されなかったため、奢りカードは不発に終わりました…'
    };
  }

  return {
    updates: {
      [`players.${opponentId}.money`]: (opponent?.money || 0) - cost
    },
    message: `🍹 奢りカード発動！\n「相手」は「あなた」に、現実で買い物を奢ってください！\n（ゲーム内でも相手の所持金から ${cost}円 を徴収しました）`
  };
};

// ⑧ 道連れカード
export const executeMissionShare: ItemFunction = async ({ userId, opponentId, roomData }) => {
  const myMission = roomData.currentMissions?.[userId];
  if (!myMission) return null;

  return {
    updates: {
      [`currentMissions.${opponentId}`]: myMission,
    },
    message: '⛓️ 道連れカード発動！\n相手のミッションを、自分と同じものに上書きして連帯させました！'
  };
};