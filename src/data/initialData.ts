import { type Mission, type Property } from './gameData';

// ==========================================
// 1. ミッション一覧（全30種類）
// ==========================================
export const MISSIONS: Mission[] = [
  // 🔵 青マス（10種）
  { id: 'b1', name: '指定カラー探索', description: '街の中で「真っ黄色な看板」を見つけて写真を撮れ！', type: 'blue', reward: 500, penalty: 0, difficulty: 1 },
  { id: 'b2', name: '特定オブジェクト探索', description: '「犬」に関するもの（本物、看板、銅像など）の写真を撮れ！', type: 'blue', reward: 1000, penalty: 0, difficulty: 2 },
  { id: 'b3', name: '万歩計ピッタリ', description: '次の目的地に着くまで、歩数計の下一桁を「7」にして止めろ！', type: 'blue', reward: 800, penalty: 0, difficulty: 3 },
  { id: 'b4', name: 'ご当地クイズ', description: 'その駅や街の「名物・歴史・由来」のクイズに正解しろ！（検索なし）', type: 'blue', reward: 800, penalty: 0, difficulty: 2 },
  { id: 'b5', name: 'レア自販機ハント', description: '「飲料以外」の自販機、または「100円以下」の自販機を撮影！', type: 'blue', reward: 800, penalty: 0, difficulty: 2 },
  { id: 'b6', name: '漢字ハンター', description: '今いる「駅名」の漢字が使われている看板を見つけて撮影！', type: 'blue', reward: 500, penalty: 0, difficulty: 1 },
  { id: 'b7', name: '鉄道カメラマン', description: '駅に停まる、または通過する「特急」か「急行」の電車の写真を撮れ！', type: 'blue', reward: 500, penalty: 0, difficulty: 1 },
  { id: 'b8', name: 'ラッキーナンバー', description: '街中で「77」の数字（車のナンバー、番地等）を見つけて撮影！', type: 'blue', reward: 800, penalty: 0, difficulty: 2 },
  { id: 'b9', name: 'ネイチャーハント', description: '街の中で「赤い花」または「野鳥」を見つけて写真を撮れ！', type: 'blue', reward: 800, penalty: 0, difficulty: 2 },
  { id: 'b10', name: '巨城の主', description: '現在地から見える「一番高い建物」を背景に、ドヤ顔で自撮りしろ！', type: 'blue', reward: 500, penalty: 0, difficulty: 1 },

  // 🔴 赤マス（10種）
  { id: 'r1', name: '価格ピタリ賞', description: 'コンビニ等で「税込み100円ピッタリ」の商品を見つけて撮影！', type: 'red', reward: 0, penalty: 1000, difficulty: 3 },
  { id: 'r2', name: 'ミッション・インポッシブル', description: '相手にバレずに、相手の背中越しに自撮りを成功させろ！', type: 'red', reward: 0, penalty: 1000, difficulty: 2 },
  { id: 'r3', name: '街の歴史学者', description: '駅周辺にある「石碑」や「歴史的な案内板」を見つけて写真を撮れ！', type: 'red', reward: 0, penalty: 1000, difficulty: 2 },
  { id: 'r4', name: 'ランキング予想', description: '指定店の「人気トップ10」商品を買い、ネット検索で上位なら成功！', type: 'red', reward: 0, penalty: 1500, difficulty: 3 },
  { id: 'r5', name: '激安メニュー探し', description: '最寄り飲食店のメニュー表から「500円以下」のメニューを見つけて撮影！', type: 'red', reward: 0, penalty: 1000, difficulty: 2 },
  { id: 'r6', name: 'シャドウ・ストーカー', description: '相手にバレずに、相手の「影」を踏んでいる足元を自撮りしろ！', type: 'red', reward: 0, penalty: 1000, difficulty: 3 },
  { id: 'r7', name: 'トレンドポーズ', description: '駅の看板の前で、「今流行りのポーズ」を決めて自撮りしろ！', type: 'red', reward: 0, penalty: 1000, difficulty: 3 },
  { id: 'r8', name: '脳トレサバイバル', description: '相手が出題する「3桁＋3桁の暗算」に10秒以内に答えろ！', type: 'red', reward: 0, penalty: 1000, difficulty: 2 },
  { id: 'r9', name: '味覚チャレンジ', description: 'コンビニで「激辛」か「酸っぱい」商品を買い、無表情で食べきれ！', type: 'red', reward: 0, penalty: 1000, difficulty: 3 },
  { id: 'r10', name: '運命のコイントス', description: '硬貨を投げ、表裏を相手に宣言させろ。外れたら失敗！', type: 'red', reward: 0, penalty: 1000, difficulty: 1 },

  // 🟢 協力マス（10種）
  { id: 'g1', name: '体内時計シンクロ', description: '目を閉じて同時にストップウォッチ起動。10秒（±0.5秒）で止めろ！', type: 'green', reward: 1000, penalty: 0, difficulty: 2 },
  { id: 'g2', name: 'トリックアート撮影', description: '遠近法で、片方がもう片方を「手のひらに乗せている」写真を撮れ！', type: 'green', reward: 800, penalty: 0, difficulty: 2 },
  { id: 'g3', name: '以心伝心ゲーム', description: '「おにぎりの具といえば？」を同時に言って合致させろ！（チャンス3回）', type: 'green', reward: 500, penalty: 0, difficulty: 1 },
  { id: 'g4', name: 'テレパシー・ショッピング', description: 'コンビニに別々に入り、相談なしで同じジャンルの商品を買え！', type: 'green', reward: 1500, penalty: 0, difficulty: 3 },
  { id: 'g5', name: 'カタカナ禁止令', description: '次の目的地に着くまで、2人とも「外来語（カタカナ）」禁止で会話しろ！', type: 'green', reward: 800, penalty: 0, difficulty: 2 },
  { id: 'g6', name: '街のシンボル探し', description: '街の「ご当地キャラクター」や「シンボル」を探して一緒に撮影！', type: 'green', reward: 1000, penalty: 0, difficulty: 2 },
  { id: 'g7', name: '車内広告リサーチ', description: '電車内で「メガネをかけた人物」が写っている広告に同時に指を差せ！', type: 'green', reward: 800, penalty: 0, difficulty: 1 },
  { id: 'g8', name: '記憶力シンクロ', description: 'お店の外観を10秒見て背を向け、相手からのクイズに答えろ！', type: 'green', reward: 1000, penalty: 0, difficulty: 2 },
  { id: 'g9', name: '影絵アート', description: '2人の「影」を組み合わせて、地面に「ハートマーク」を作って撮影！', type: 'green', reward: 800, penalty: 0, difficulty: 2 },
  { id: 'g10', name: '振り返りシンクロ', description: '背中合わせで歩き出し、5歩目で同時に振り返って目が合えば成功！', type: 'green', reward: 1000, penalty: 0, difficulty: 2 },
];

// ==========================================
// 2. 初期駅・物件データ
// ==========================================
export const INITIAL_PROPERTIES: { [stationName: string]: Property[] } = {
  '新宿駅': [
    { id: 'p_sj_1', name: '駅ナカのカフェ', price: 1500, rate: 50, type: 'limit' },
    { id: 'p_sj_2', name: 'コンビニスイーツ', price: 500, rate: 100, type: 'limit' },
    { id: 'p_sj_3', name: '新宿中央公園', price: 2000, rate: 20, type: 'fixed' },
  ],
  '明大前駅': [
    { id: 'p_md_1', name: 'ファストフード', price: 1000, rate: 50, type: 'limit' },
    { id: 'p_md_2', name: '商店街のたこ焼き', price: 800, rate: 80, type: 'limit' },
    { id: 'p_md_3', name: '玉川上水公園', price: 1000, rate: 40, type: 'fixed' },
  ],
  '調布駅': [
    { id: 'p_cf_1', name: '映画館のポップコーン', price: 1200, rate: 30, type: 'limit' },
    { id: 'p_cf_2', name: 'スーパーの惣菜', price: 800, rate: 100, type: 'limit' },
    { id: 'p_cf_3', name: '布多天神社', price: 3000, rate: 10, type: 'fixed' },
  ],
};