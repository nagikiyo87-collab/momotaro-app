// 季節の型
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// 貧乏神（ボンビー）の形態
export type BombyType = 'none' | 'normal' | 'petit' | 'king';

// ターンの進行フェーズ
export type GameStep = 
  | 'dice_roll'     // サイコロを振る
  | 'routing'       // 滞在時間決定＆目的地選び
  | 'mission'       // ミッション実行
  | 'bidding'       // 物件のシークレット入札
  | 'turn_end';     // 決算・ターン終了処理

// マスの種類
export type SquareType = 'blue' | 'red' | 'green' | 'yellow';

// 物件（土地・お店）データ構造
export type Property = {
  id: string;
  name: string;           // 物件名
  category: string;       // ジャンル
  maxPrice: number;       // 上限価格（または固定値）
  isFixedPrice: boolean;  // 公園などの固定値スポットか
  yieldRate: number;      // 収益率（%）
  ownerId?: string;       // 所有者のプレイヤーID
  actualPrice?: number;   // 実際に落札した価格
};

// プレイヤーデータ構造
export type Player = {
  id: string;             // FirebaseのユーザーUID
  name: string;           // プレイヤー名
  money: number;          // ゲーム内所持金
  debt: number;           // 借金額
  bomby: BombyType;       // 現在憑依しているボンビー
  items: string[];        // 所持アイテム（最大3枠）
  properties: Property[]; // 所有物件リスト
  isHost: boolean;        // ホストかどうか
};

// 実行中のミッションデータ構造
export type Mission = {
  id: string;
  title: string;          // ミッション名
  description: string;    // 内容
  type: SquareType;       // マスの種類
  rewardOrPenalty: string;// 報酬 / ペナルティ
  difficulty: number;     // 難易度（★1〜3）
};

// ターンの進行状態データ構造
export type TurnState = {
  step: GameStep;
  diceResult?: number;      // 振ったサイコロの目
  stayTime?: number;        // 30分 / 45分 / 60分
  destinations?: string[];  // 決定した目的地リスト
  currentMission?: Mission; // 現在挑戦中のミッション
  bids?: {                  // 物件入札データ
    [playerId: string]: {
      propertyId: string;
      bidAmount: number;
      diceRoll?: number;
    };
  };
};

// ゲームルーム全体のデータ構造
export type GameRoom = {
  roomId: string;                   // 部屋番号
  status: 'waiting' | 'playing' | 'finished'; // ルーム状態
  currentTurn: number;              // 現在のターン数
  currentSeason: Season;            // 現在の季節
  activePlayerId: string;           // サイコロ権のあるプレイヤーID
  currentStation: string;           // 現在地（駅名）
  players: { [uid: string]: Player };// 2人分のプレイヤー情報
  turnState: TurnState;             // 1ターン内の進行状態
  createdAt: string;                // 作成日時
};