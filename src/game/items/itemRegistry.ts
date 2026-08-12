import type { ItemFunction } from './types';

// 系統ごとのフォルダから処理をインポート
import {
  executeMoneySwap, executeMoneySplit, executeMoneyReset,
  executeMissionSwap, executeBombyPass, executeItemSteal,
  executeTreat, executeMissionShare
} from './attack';

import {
  executeDiceDouble, executeMissionReroll, executeLottery,
  executeStationSkip, executeRewardDouble, executeRandomBox,
  executeTimeExtend
} from './support';

import {
  executeDicePlus2, executeDiceMinus2, executeShield,
  executeMissionPass, executeDebtClear
} from './defense';

// ==========================================
// 📖 アイテム辞書（全20種に変更）
// ==========================================
export const ITEM_REGISTRY: Record<string, ItemFunction> = {
  // --- 妨害・逆転系 ---
  'i_money_swap': executeMoneySwap,
  'i_money_split': executeMoneySplit,
  'i_money_reset': executeMoneyReset,
  'i_mission_swap': executeMissionSwap,
  'i_bomby_pass': executeBombyPass,
  'i_item_steal': executeItemSteal,
  'i_treat': executeTreat,
  'i_mission_share': executeMissionShare,

  // --- 自身強化・便利系 ---
  'i_dice_double': executeDiceDouble,
  'i_mission_reroll': executeMissionReroll,
  'i_lottery': executeLottery,
  'i_station_skip': executeStationSkip,
  'i_reward_double': executeRewardDouble,
  'i_random_box': executeRandomBox,
  'i_time_extend': executeTimeExtend,

  // --- 防御・回避系 ---
  'i_dice_plus2': executeDicePlus2,
  'i_dice_minus2': executeDiceMinus2,
  'i_shield': executeShield,
  'i_mission_pass': executeMissionPass,
  'i_debt_clear': executeDebtClear,
};