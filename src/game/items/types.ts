import type { ModalContextType } from '../../contexts/ModalContext';

// アイテムを使う時に必要な情報（引数）
export interface ItemContext {
  userId: string;
  opponentId: string;
  roomId: string;
  me: any;
  opponent: any;
  roomData: any;
  modal: ModalContextType; // showAlert, showConfirmなどを呼び出すため
}

// アイテムを使った結果（戻り値）
export interface ItemEffectResult {
  updates: Record<string, any>; // データベース（Firebase）をどう書き換えるか
  activeEffect?: string | null; // ダイス+2など「後で効果が出るもの」の目印
  message?: string;             // 処理完了後に出すメッセージ
}

// すべてのアイテム効果関数はこの形にするというルール
export type ItemFunction = (ctx: ItemContext) => Promise<ItemEffectResult | null>;