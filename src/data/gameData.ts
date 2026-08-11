// 🚉 マス目（駅）のリスト
export const STATIONS = [
    "新宿", "笹塚", "明大前", "調布", "府中", 
    "聖蹟桜ヶ丘", "高幡不動", "北野", "高尾", "高尾山口"
  ];
  
  // 🏠 物件の型定義
  export type Property = {
    id: string;
    name: string;
    type: 'limit' | 'fixed'; 
    price: number;           
    rate: number;            
  };
  
  // 🔑 修正：すべての駅に仮の「物件1, 物件2, 物件3」を自動セットする！
  export const STATION_PROPERTIES: Record<string, Property[]> = {};
  STATIONS.forEach((station, index) => {
    STATION_PROPERTIES[station] = [
      { id: `prop_${index}_1`, name: "物件1", type: "limit", price: 1000, rate: 50 },
      { id: `prop_${index}_2`, name: "物件2", type: "limit", price: 500, rate: 100 },
      { id: `prop_${index}_3`, name: "物件3", type: "fixed", price: 2000, rate: 20 },
    ];
  });
  
  // 🎯 ミッションの型定義
  export type Mission = {
    id: string;
    type: 'blue' | 'red' | 'green' | 'yellow';
    name: string;
    description: string;
    condition: string; 
    reward: number;  
    penalty: number; 
  };
  
  // 🎲 ミッションデータ
  export const MISSIONS: Mission[] = [
    // 🔵 青マス（プラス効果）
    { id: 'b1', type: 'blue', name: '指定カラー探索', description: '街の中で「真っ黄色な看板」を見つけて写真を撮れ！', condition: '成功: +500円', reward: 500, penalty: 0 },
    { id: 'b2', type: 'blue', name: '万歩計ピッタリ', description: '次の目的地に着くまでに、歩数計アプリの下一桁を「7」にして止めろ！', condition: '成功: +800円', reward: 800, penalty: 0 },
    { id: 'b3', type: 'blue', name: 'ご当地クイズ', description: 'その駅や街の「名物・歴史・由来」に関するクイズに正解しろ！', condition: '成功: +800円', reward: 800, penalty: 0 },
    
    // 🔴 赤マス（マイナス効果）
    { id: 'r1', type: 'red', name: '価格ピタリ賞', description: 'コンビニ等で「税込み100円ピッタリ」の商品を見つけて写真を撮れ！', condition: '失敗: -1,000円', reward: 0, penalty: 1000 },
    { id: 'r2', type: 'red', name: 'ミッション・インポッシブル', description: '相手にバレずに、相手の背中越しに自撮りを成功させろ！', condition: '失敗: 所持金-1,000円', reward: 0, penalty: 1000 },
    { id: 'r3', type: 'red', name: '運命のコイントス', description: 'リアルな硬貨を投げ、表裏を相手に宣言させろ。外れたら失敗！', condition: '失敗: -1,000円', reward: 0, penalty: 1000 },
  
    // 🟢 協力マス（2人で成功すればプラス）
    { id: 'g1', type: 'green', name: '体内時計シンクロ', description: '目を閉じて同時にストップウォッチを起動。10秒（±0.5秒）で止めろ！', condition: '成功: 2人に+1,000円', reward: 1000, penalty: 0 },
    { id: 'g2', type: 'green', name: '以心伝心ゲーム', description: '「おにぎりの具といえば？」を同時に言って答えを合わせろ！', condition: '成功: 2人に+500円', reward: 500, penalty: 0 },
  
    // 🟡 アイテムマス（クリアでアイテムゲット）
    { id: 'y1', type: 'yellow', name: 'レア自販機ハント', description: '「飲料以外のもの」または「100円以下」の自販機を見つけて撮影！', condition: '成功: アイテム1個GET', reward: 0, penalty: 0 },
    { id: 'y2', type: 'yellow', name: '漢字ハンター', description: '今いる「駅名」の漢字が使われている看板を見つけて写真を撮れ！', condition: '成功: アイテム1個GET', reward: 0, penalty: 0 },
  ];
// 🃏 アイテムの型定義
export type Item = {
    id: string;
    name: string;
    description: string;
    type: 'attack' | 'boost' | 'defense' | 'growth';
  };
  
  // 🃏 アイテムデータ（テスト用にいくつか抜粋）
  export const ITEMS: Item[] = [
    { id: 'i_dice_plus2', name: 'ダイス+2カード', description: 'サイコロの出目に+2される。', type: 'defense' },
    { id: 'i_dice_double', name: 'サイコロ2個振り', description: '今回の移動時、サイコロを2個振れる。', type: 'boost' },
    { id: 'i_money_swap', name: '所持金入れ替え', description: '自分と相手の所持金をまるごと入れ替える。', type: 'attack' },
    { id: 'i_random_box', name: 'ランダムボックス', description: '使用すると、100円〜3,000円のどれかが当たる。', type: 'boost' },
  ];