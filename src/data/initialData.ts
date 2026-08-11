import { Mission, Property } from '../types/game';

// ==========================================
// 1. ミッション一覧（全30種類）
// ==========================================
export const MISSIONS: Mission[] = [
  // 🔵 青マス（10種）
  { id: 'b1', title: '指定カラー探索', description: '街の中で「真っ黄色な看板」を見つけて写真を撮れ！', type: 'blue', rewardOrPenalty: '成功: +500円', difficulty: 1 },
  { id: 'b2', title: '特定オブジェクト探索', description: '「犬」に関するもの（本物、看板、銅像など）の写真を撮れ！', type: 'blue', rewardOrPenalty: '成功: +1,000円', difficulty: 2 },
  { id: 'b3', title: '万歩計ピッタリ', description: '次の目的地に着くまで、歩数計の下一桁を「7」にして止めろ！', type: 'blue', rewardOrPenalty: '成功: +800円', difficulty: 3 },
  { id: 'b4', title: 'ご当地クイズ', description: 'その駅や街の「名物・歴史・由来」のクイズに正解しろ！（検索なし）', type: 'blue', rewardOrPenalty: '成功: +800円', difficulty: 2 },
  { id: 'b5', title: 'レア自販機ハント', description: '「飲料以外」の自販機、または「100円以下」の自販機を撮影！', type: 'blue', rewardOrPenalty: '成功: +800円', difficulty: 2 },
  { id: 'b6', title: '漢字ハンター', description: '今いる「駅名」の漢字が使われている看板を見つけて撮影！', type: 'blue', rewardOrPenalty: '成功: +500円', difficulty: 1 },
  { id: 'b7', title: '鉄道カメラマン', description: '駅に停まる、または通過する「特急」か「急行」の電車の写真を撮れ！', type: 'blue', rewardOrPenalty: '成功: +500円', difficulty: 1 },
  { id: 'b8', title: 'ラッキーナンバー', description: '街中で「77」の数字（車のナンバー、番地等）を見つけて撮影！', type: 'blue', rewardOrPenalty: '成功: +800円', difficulty: 2 },
  { id: 'b9', title: 'ネイチャーハント', description: '街の中で「赤い花」または「野鳥」を見つけて写真を撮れ！', type: 'blue', rewardOrPenalty: '成功: +800円', difficulty: 2 },
  { id: 'b10', title: '巨城の主', description: '現在地から見える「一番高い建物」を背景に、ドヤ顔で自撮りしろ！', type: 'blue', rewardOrPenalty: '成功: +500円', difficulty: 1 },

  // 🔴 赤マス（10種）
  { id: 'r1', title: '価格ピタリ賞', description: 'コンビニ等で「税込み100円ピッタリ」の商品を見つけて撮影！', type: 'red', rewardOrPenalty: '失敗: -1,000円', difficulty: 3 },
  { id: 'r2', title: 'ミッション・インポッシブル', description: '相手にバレずに、相手の背中越しに自撮りを成功させろ！', type: 'red', rewardOrPenalty: '失敗: ボンビー憑依', difficulty: 2 },
  { id: 'r3', title: '街の歴史学者', description: '駅周辺にある「石碑」や「歴史的な案内板」を見つけて写真を撮れ！', type: 'red', rewardOrPenalty: '失敗: 所持金半減', difficulty: 2 },
  { id: 'r4', title: 'ランキング予想', description: '指定店の「人気トップ10」商品を買い、ネット検索で上位なら成功！', type: 'red', rewardOrPenalty: '失敗: -1,500円', difficulty: 3 },
  { id: 'r5', title: '激安メニュー探し', description: '最寄り飲食店のメニュー表から「500円以下」のメニューを見つけて撮影！', type: 'red', rewardOrPenalty: '失敗: 所持金半減', difficulty: 2 },
  { id: 'r6', title: 'シャドウ・ストーカー', description: '相手にバレずに、相手の「影」を踏んでいる足元を自撮りしろ！', type: 'red', rewardOrPenalty: '失敗: ボンビー憑依', difficulty: 3 },
  { id: 'r7', title: 'トレンドポーズ', description: '駅の看板の前で、「今流行りのポーズ」を決めて自撮りしろ！', type: 'red', rewardOrPenalty: '失敗: -1,000円', difficulty: 3 },
  { id: 'r8', title: '脳トレサバイバル', description: '相手が出題する「3桁＋3桁の暗算」に10秒以内に答えろ！', type: 'red', rewardOrPenalty: '失敗: 所持金半減', difficulty: 2 },
  { id: 'r9', title: '味覚チャレンジ', description: 'コンビニで「激辛」か「酸っぱい」商品を買い、無表情で食べきれ！', type: 'red', rewardOrPenalty: '失敗: ボンビー憑依', difficulty: 3 },
  { id: 'r10', title: '運命のコイントス', description: '硬貨を投げ、表裏を相手に宣言させろ。外れたら失敗！', type: 'red', rewardOrPenalty: '失敗: -1,000円', difficulty: 1 },

  // 🟢 協力マス（10種）
  { id: 'g1', title: '体内時計シンクロ', description: '目を閉じて同時にストップウォッチ起動。10秒（±0.5秒）で止めろ！', type: 'green', rewardOrPenalty: '成功: 2人に+1,000円', difficulty: 2 },
  { id: 'g2', title: 'トリックアート撮影', description: '遠近法で、片方がもう片方を「手のひらに乗せている」写真を撮れ！', type: 'green', rewardOrPenalty: '成功: 2人に+800円', difficulty: 2 },
  { id: 'g3', title: '以心伝心ゲーム', description: '「おにぎりの具といえば？」を同時に言って合致させろ！（チャンス3回）', type: 'green', rewardOrPenalty: '成功: 2人に+500円', difficulty: 1 },
  { id: 'g4', title: 'テレパシー・ショッピング', description: 'コンビニに別々に入り、相談なしで同じジャンルの商品を買え！', type: 'green', rewardOrPenalty: '成功: 2人に+1,500円', difficulty: 3 },
  { id: 'g5', title: 'カタカナ禁止令', description: '次の目的地に着くまで、2人とも「外来語（カタカナ）」禁止で会話しろ！', type: 'green', rewardOrPenalty: '成功: 2人に+800円', difficulty: 2 },
  { id: 'g6', title: '街のシンボル探し', description: '街の「ご当地キャラクター」や「シンボル」を探して一緒に撮影！', type: 'green', rewardOrPenalty: '成功: 2人に+1,000円', difficulty: 2 },
  { id: 'g7', title: '車内広告リサーチ', description: '電車内で「メガネをかけた人物」が写っている広告に同時に指を差せ！', type: 'green', rewardOrPenalty: '成功: 2人に+800円', difficulty: 1 },
  { id: 'g8', title: '記憶力シンクロ', description: 'お店の外観を10秒見て背を向け、相手からのクイズに答えろ！', type: 'green', rewardOrPenalty: '成功: 2人に+1,000円', difficulty: 2 },
  { id: 'g9', title: '影絵アート', description: '2人の「影」を組み合わせて、地面に「ハートマーク」を作って撮影！', type: 'green', rewardOrPenalty: '成功: 2人に+800円', difficulty: 2 },
  { id: 'g10', title: '振り返りシンクロ', description: '背中合わせで歩き出し、5歩目で同時に振り返って目が合えば成功！', type: 'green', rewardOrPenalty: '成功: 2人に+1,000円', difficulty: 2 },
];

// ==========================================
// 2. 初期駅・物件データ（ダミー初期配置）
// ==========================================
export const INITIAL_PROPERTIES: { [stationName: string]: Property[] } = {
  '新宿駅': [
    { id: 'p_sj_1', name: '駅ナカのカフェ', category: 'カフェ', maxPrice: 1500, isFixedPrice: false, yieldRate: 50 },
    { id: 'p_sj_2', name: 'コンビニスイーツ', category: '食品', maxPrice: 500, isFixedPrice: false, yieldRate: 100 },
    { id: 'p_sj_3', name: '新宿中央公園', category: '名所', maxPrice: 2000, isFixedPrice: true, yieldRate: 20 },
  ],
  '明大前駅': [
    { id: 'p_md_1', name: 'ファストフード', category: '飲食店', maxPrice: 1000, isFixedPrice: false, yieldRate: 50 },
    { id: 'p_md_2', name: '商店街のたこ焼き', category: '軽食', maxPrice: 800, isFixedPrice: false, yieldRate: 80 },
    { id: 'p_md_3', name: '玉川上水公園', category: '名所', maxPrice: 1000, isFixedPrice: true, yieldRate: 40 },
  ],
  '調布駅': [
    { id: 'p_cf_1', name: '映画館のポップコーン', category: '娯楽', maxPrice: 1200, isFixedPrice: false, yieldRate: 30 },
    { id: 'p_cf_2', name: 'スーパーの惣菜', category: '食品', maxPrice: 800, isFixedPrice: false, yieldRate: 100 },
    { id: 'p_cf_3', name: '布多天神社', category: '名所', maxPrice: 3000, isFixedPrice: true, yieldRate: 10 },
  ],
};