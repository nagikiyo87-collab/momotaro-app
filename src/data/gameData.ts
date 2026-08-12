export type Property = {
  id: string;
  name: string;
  price: number;
  rate: number;
  type: 'limit' | 'fixed';
};

export type Mission = {
  id: string;
  name: string;
  description: string;
  type: 'blue' | 'red' | 'green' | 'yellow';
  reward: number;
  penalty: number;
  penaltyType?: 'money' | 'half_money' | 'bomby';
  difficulty: number;
};

export type Item = {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'support' | 'defense' | 'growth';
  rarity: number;
};

// ==========================================
// 🚉 マップ（駅）データ（京王線 全37駅）
// ==========================================
export const STATIONS: string[] = [
  '新宿', '笹塚', '代田橋', '明大前', '下高井戸', '桜上水', '上北沢', '八幡山', 
  '芦花公園', '千歳烏山', '仙川', 'つつじヶ丘', '柴崎', '国領', '布田', '調布', 
  '西調布', '飛田給', '武蔵野台', '多磨霊園', '東府中', '府中', '分倍河原', 
  '中河原', '聖蹟桜ヶ丘', '百草園', '高幡不動', '南平', '平山城址公園', '長沼', 
  '北野', '京王片倉', '山田', 'めじろ台', '狭間', '高尾', '高尾山口'
];

// ==========================================
// 🏢 物件データ（全37駅分を仮設定）
// ==========================================
export const STATION_PROPERTIES: Record<string, Property[]> = {
  '新宿': [
    { id: 'shinjuku_1', name: '駅ナカのカフェ', price: 1500, rate: 50, type: 'limit' },
    { id: 'shinjuku_2', name: 'コンビニスイーツ', price: 500, rate: 100, type: 'limit' },
    { id: 'shinjuku_3', name: '新宿中央公園', price: 2000, rate: 20, type: 'fixed' },
  ],
  '笹塚': [
    { id: 'sasazuka_1', name: '高架下のパン屋', price: 800, rate: 60, type: 'limit' },
    { id: 'sasazuka_2', name: 'ドラッグストア', price: 500, rate: 80, type: 'limit' },
    { id: 'sasazuka_3', name: 'ボウリング場跡地', price: 1500, rate: 30, type: 'fixed' },
  ],
  '代田橋': [
    { id: 'daitabashi_1', name: '沖縄タウンの食堂', price: 1200, rate: 50, type: 'limit' },
    { id: 'daitabashi_2', name: '駅前のコンビニ', price: 500, rate: 80, type: 'limit' },
    { id: 'daitabashi_3', name: '和泉明本公園', price: 1000, rate: 40, type: 'fixed' },
  ],
  '明大前': [
    { id: 'meidaimae_1', name: 'ファストフード', price: 1000, rate: 50, type: 'limit' },
    { id: 'meidaimae_2', name: '商店街のたこ焼き', price: 800, rate: 80, type: 'limit' },
    { id: 'meidaimae_3', name: '玉川上水公園', price: 1000, rate: 40, type: 'fixed' },
  ],
  '下高井戸': [
    { id: 'shimotakaido_1', name: '商店街のたい焼き', price: 500, rate: 100, type: 'limit' },
    { id: 'shimotakaido_2', name: '映画館のチケット', price: 1800, rate: 40, type: 'limit' },
    { id: 'shimotakaido_3', name: '菅原神社', price: 2000, rate: 20, type: 'fixed' },
  ],
  '桜上水': [
    { id: 'sakurajosui_1', name: '駅前のラーメン屋', price: 1000, rate: 60, type: 'limit' },
    { id: 'sakurajosui_2', name: 'ローカルスーパー', price: 1500, rate: 40, type: 'limit' },
    { id: 'sakurajosui_3', name: '桜並木通り', price: 1000, rate: 30, type: 'fixed' },
  ],
  '上北沢': [
    { id: 'kamikitazawa_1', name: 'ベーカリーのパン', price: 800, rate: 70, type: 'limit' },
    { id: 'kamikitazawa_2', name: '薬局の日用品', price: 600, rate: 80, type: 'limit' },
    { id: 'kamikitazawa_3', name: '賀川豊彦記念松沢資料館', price: 1500, rate: 20, type: 'fixed' },
  ],
  '八幡山': [
    { id: 'hachimanyama_1', name: '高架下のカフェ', price: 1000, rate: 50, type: 'limit' },
    { id: 'hachimanyama_2', name: 'ラーメン屋の餃子', price: 600, rate: 80, type: 'limit' },
    { id: 'hachimanyama_3', name: '八幡山公園', price: 1200, rate: 30, type: 'fixed' },
  ],
  '芦花公園': [
    { id: 'rokakoen_1', name: '洋菓子店のクッキー', price: 1000, rate: 60, type: 'limit' },
    { id: 'rokakoen_2', name: 'スーパーの特売品', price: 500, rate: 100, type: 'limit' },
    { id: 'rokakoen_3', name: '蘆花恒春園', price: 3000, rate: 15, type: 'fixed' },
  ],
  '千歳烏山': [
    { id: 'karasuyama_1', name: '和菓子屋さん', price: 1200, rate: 50, type: 'limit' },
    { id: 'karasuyama_2', name: '100円均一ショップ', price: 500, rate: 100, type: 'limit' },
    { id: 'karasuyama_3', name: '烏山神社', price: 1500, rate: 20, type: 'fixed' },
  ],
  '仙川': [
    { id: 'sengawa_1', name: 'おしゃれなカフェランチ', price: 1500, rate: 40, type: 'limit' },
    { id: 'sengawa_2', name: '雑貨屋の小物', price: 1000, rate: 60, type: 'limit' },
    { id: 'sengawa_3', name: '仙川駅前公園', price: 1500, rate: 20, type: 'fixed' },
  ],
  'つつじヶ丘': [
    { id: 'tsutsuji_1', name: '駅前の本屋', price: 1500, rate: 40, type: 'limit' },
    { id: 'tsutsuji_2', name: 'お弁当屋さん', price: 800, rate: 60, type: 'limit' },
    { id: 'tsutsuji_3', name: 'つつじの咲く公園', price: 1000, rate: 30, type: 'fixed' },
  ],
  '柴崎': [
    { id: 'shibasaki_1', name: '老舗の定食屋', price: 1000, rate: 60, type: 'limit' },
    { id: 'shibasaki_2', name: '惣菜屋のコロッケ', price: 500, rate: 100, type: 'limit' },
    { id: 'shibasaki_3', name: '柴崎稲荷神社', price: 1500, rate: 20, type: 'fixed' },
  ],
  '国領': [
    { id: 'kokuryo_1', name: '駅前ビルのレストラン', price: 2000, rate: 40, type: 'limit' },
    { id: 'kokuryo_2', name: 'ケーキ屋さんのケーキ', price: 1200, rate: 50, type: 'limit' },
    { id: 'kokuryo_3', name: '国領神社', price: 2000, rate: 20, type: 'fixed' },
  ],
  '布田': [
    { id: 'fuda_1', name: '蕎麦屋の天ざる', price: 1500, rate: 50, type: 'limit' },
    { id: 'fuda_2', name: '駅前のパン屋', price: 800, rate: 80, type: 'limit' },
    { id: 'fuda_3', name: '布多天神社参道', price: 1500, rate: 20, type: 'fixed' },
  ],
  '調布': [
    { id: 'chofu_1', name: '映画館のポップコーン', price: 1200, rate: 30, type: 'limit' },
    { id: 'chofu_2', name: 'スーパーの惣菜', price: 800, rate: 100, type: 'limit' },
    { id: 'chofu_3', name: '布多天神社', price: 3000, rate: 10, type: 'fixed' },
  ],
  '西調布': [
    { id: 'nishichofu_1', name: '地元のラーメン屋', price: 1000, rate: 60, type: 'limit' },
    { id: 'nishichofu_2', name: '焼肉屋のランチ', price: 2000, rate: 40, type: 'limit' },
    { id: 'nishichofu_3', name: '西光寺', price: 2000, rate: 20, type: 'fixed' },
  ],
  '飛田給': [
    { id: 'tobitakyu_1', name: 'スタジアム前の売店', price: 1500, rate: 60, type: 'limit' },
    { id: 'tobitakyu_2', name: 'スポーツグッズ店', price: 2000, rate: 40, type: 'limit' },
    { id: 'tobitakyu_3', name: '味の素スタジアム外周', price: 5000, rate: 10, type: 'fixed' },
  ],
  '武蔵野台': [
    { id: 'musashinodai_1', name: 'コンビニスイーツ', price: 500, rate: 100, type: 'limit' },
    { id: 'musashinodai_2', name: 'お弁当屋さんの唐揚げ', price: 800, rate: 80, type: 'limit' },
    { id: 'musashinodai_3', name: '車返団地内の公園', price: 1500, rate: 30, type: 'fixed' },
  ],
  '多磨霊園': [
    { id: 'tamareien_1', name: '和菓子屋のお団子', price: 800, rate: 70, type: 'limit' },
    { id: 'tamareien_2', name: '花屋のミニブーケ', price: 1500, rate: 40, type: 'limit' },
    { id: 'tamareien_3', name: '多磨霊園', price: 4000, rate: 10, type: 'fixed' },
  ],
  '東府中': [
    { id: 'higashifuchu_1', name: 'カフェのコーヒー', price: 600, rate: 80, type: 'limit' },
    { id: 'higashifuchu_2', name: 'ファミレスのドリンクバー', price: 500, rate: 100, type: 'limit' },
    { id: 'higashifuchu_3', name: '府中の森公園', price: 3000, rate: 20, type: 'fixed' },
  ],
  '府中': [
    { id: 'fuchu_1', name: '駅ビルのレストラン', price: 2000, rate: 40, type: 'limit' },
    { id: 'fuchu_2', name: '老舗のたい焼き屋', price: 500, rate: 80, type: 'limit' },
    { id: 'fuchu_3', name: '大國魂神社', price: 4000, rate: 15, type: 'fixed' },
  ],
  '分倍河原': [
    { id: 'bubaigawara_1', name: '乗り換え駅の立ち食いそば', price: 600, rate: 80, type: 'limit' },
    { id: 'bubaigawara_2', name: '駅前の居酒屋ランチ', price: 1200, rate: 50, type: 'limit' },
    { id: 'bubaigawara_3', name: '新田義貞の銅像', price: 1500, rate: 30, type: 'fixed' },
  ],
  '中河原': [
    { id: 'nakagawara_1', name: '駅前スーパーのフルーツ', price: 1000, rate: 60, type: 'limit' },
    { id: 'nakagawara_2', name: 'パン屋のサンドイッチ', price: 600, rate: 80, type: 'limit' },
    { id: 'nakagawara_3', name: '多摩川河川敷', price: 2000, rate: 20, type: 'fixed' },
  ],
  '聖蹟桜ヶ丘': [
    { id: 'seiseki_1', name: 'デパートの高級惣菜', price: 2500, rate: 30, type: 'limit' },
    { id: 'seiseki_2', name: 'おしゃれなカフェ', price: 1500, rate: 50, type: 'limit' },
    { id: 'seiseki_3', name: 'いろは坂（耳をすませば）', price: 3000, rate: 20, type: 'fixed' },
  ],
  '百草園': [
    { id: 'mogusaen_1', name: 'ジェラート屋のアイス', price: 600, rate: 80, type: 'limit' },
    { id: 'mogusaen_2', name: '和菓子屋の大福', price: 500, rate: 100, type: 'limit' },
    { id: 'mogusaen_3', name: '京王百草園', price: 2500, rate: 20, type: 'fixed' },
  ],
  '高幡不動': [
    { id: 'takahata_1', name: '参道のソフトクリーム', price: 500, rate: 100, type: 'limit' },
    { id: 'takahata_2', name: '名物のお蕎麦屋さん', price: 1500, rate: 40, type: 'limit' },
    { id: 'takahata_3', name: '高幡不動尊', price: 3500, rate: 15, type: 'fixed' },
  ],
  '南平': [
    { id: 'minamidaira_1', name: '地元のパン屋さん', price: 800, rate: 70, type: 'limit' },
    { id: 'minamidaira_2', name: '駅前のお弁当', price: 1000, rate: 60, type: 'limit' },
    { id: 'minamidaira_3', name: '南平丘陵公園', price: 1500, rate: 30, type: 'fixed' },
  ],
  '平山城址公園': [
    { id: 'hirayama_1', name: 'コンビニのホットスナック', price: 500, rate: 100, type: 'limit' },
    { id: 'hirayama_2', name: 'そば屋のきつねそば', price: 800, rate: 80, type: 'limit' },
    { id: 'hirayama_3', name: '平山城址公園', price: 2500, rate: 20, type: 'fixed' },
  ],
  '長沼': [
    { id: 'naganuma_1', name: 'ラーメン屋の餃子', price: 600, rate: 80, type: 'limit' },
    { id: 'naganuma_2', name: 'スーパーの飲み物', price: 300, rate: 100, type: 'limit' },
    { id: 'naganuma_3', name: '長沼公園', price: 2000, rate: 20, type: 'fixed' },
  ],
  '北野': [
    { id: 'kitano_1', name: '乗り換え駅の売店', price: 500, rate: 60, type: 'limit' },
    { id: 'kitano_2', name: '市場の新鮮フルーツ', price: 1000, rate: 50, type: 'limit' },
    { id: 'kitano_3', name: '北野天満宮', price: 1500, rate: 20, type: 'fixed' },
  ],
  '京王片倉': [
    { id: 'katakura_1', name: 'カフェのモーニング', price: 800, rate: 70, type: 'limit' },
    { id: 'katakura_2', name: 'パン屋のカレーパン', price: 500, rate: 80, type: 'limit' },
    { id: 'katakura_3', name: '片倉城跡公園', price: 2000, rate: 20, type: 'fixed' },
  ],
  '山田': [
    { id: 'yamada_1', name: '地元の洋食屋', price: 1500, rate: 50, type: 'limit' },
    { id: 'yamada_2', name: 'ファミレスのデザート', price: 800, rate: 70, type: 'limit' },
    { id: 'yamada_3', name: '廣園寺', price: 1500, rate: 20, type: 'fixed' },
  ],
  'めじろ台': [
    { id: 'mejirodai_1', name: '学生街のガッツリ定食', price: 1200, rate: 60, type: 'limit' },
    { id: 'mejirodai_2', name: 'コーヒー豆専門店の豆', price: 1500, rate: 40, type: 'limit' },
    { id: 'mejirodai_3', name: '万葉公園', price: 2000, rate: 25, type: 'fixed' },
  ],
  '狭間': [
    { id: 'hazama_1', name: 'スーパーのお惣菜', price: 800, rate: 80, type: 'limit' },
    { id: 'hazama_2', name: 'ドラッグストアの日用品', price: 1000, rate: 60, type: 'limit' },
    { id: 'hazama_3', name: '陵南公園', price: 2500, rate: 20, type: 'fixed' },
  ],
  '高尾': [
    { id: 'takao_1', name: '駅前の定食屋さん', price: 1200, rate: 50, type: 'limit' },
    { id: 'takao_2', name: '登山グッズの自販機', price: 800, rate: 80, type: 'limit' },
    { id: 'takao_3', name: 'みころも霊堂', price: 2000, rate: 20, type: 'fixed' },
  ],
  '高尾山口': [
    { id: 'takaosanguchi_1', name: 'とろろそばのお店', price: 1500, rate: 60, type: 'limit' },
    { id: 'takaosanguchi_2', name: '温泉施設の入浴券', price: 1200, rate: 50, type: 'limit' },
    { id: 'takaosanguchi_3', name: '高尾山ケーブルカー乗り場', price: 5000, rate: 10, type: 'fixed' },
  ]
};
// ==========================================
// 🎯 ミッションデータ（全30種）
// ==========================================
export const MISSIONS: Mission[] = [
  // 🔵 青マス（プラス） 10種
  { id: 'm_blue_1', name: '指定カラー探索', description: '街の中で「真っ黄色な看板」を見つけて写真を撮れ！', type: 'blue', reward: 500, penalty: 0, difficulty: 1 },
  { id: 'm_blue_2', name: '特定オブジェクト探索', description: '「犬」に関するもの（本物、看板、銅像など）の写真を撮れ！', type: 'blue', reward: 1000, penalty: 0, difficulty: 2 },
  { id: 'm_blue_3', name: '万歩計ピッタリ', description: '次の目的地に着くまでに、歩数計アプリの下一桁を「7」にして止めろ！', type: 'blue', reward: 800, penalty: 0, difficulty: 3 },
  { id: 'm_blue_4', name: 'ご当地クイズ', description: 'その駅や街の「名物・歴史・由来」に関するクイズに正解しろ！（スマホ検索なし）', type: 'blue', reward: 800, penalty: 0, difficulty: 2 },
  { id: 'm_blue_5', name: 'レア自販機ハント', description: '「飲料以外のもの」を売っている自販機、または「100円以下」の自販機を見つけて撮影！', type: 'blue', reward: 800, penalty: 0, difficulty: 2 },
  { id: 'm_blue_6', name: '漢字ハンター', description: '今いる「駅名」の漢字が使われている看板（駅の看板以外）を見つけて写真を撮れ！', type: 'blue', reward: 500, penalty: 0, difficulty: 1 },
  { id: 'm_blue_7', name: '鉄道カメラマン', description: '駅に停まる、または通過する「特急」か「急行」の電車の写真を撮れ！', type: 'blue', reward: 500, penalty: 0, difficulty: 1 },
  { id: 'm_blue_8', name: 'ラッキーナンバー', description: '街中で「77」の数字（車のナンバー、番地、値段など）を見つけて撮影！', type: 'blue', reward: 800, penalty: 0, difficulty: 2 },
  { id: 'm_blue_9', name: 'ネイチャーハント', description: '街の中で「赤い花」または「野鳥」を見つけて写真を撮れ！', type: 'blue', reward: 800, penalty: 0, difficulty: 2 },
  { id: 'm_blue_10', name: '巨城の主', description: '現在地から見える「一番高い建物」を背景に、ドヤ顔で自撮りしろ！', type: 'blue', reward: 500, penalty: 0, difficulty: 1 },

  // 🔴 赤マス（マイナスリスク） 10種（🔑 最新データに更新！）
  { id: 'm_red_1', name: '価格ピタリ賞', description: 'コンビニ等で「税込み100円ピッタリ」の商品を見つけて写真を撮れ！', type: 'red', reward: 0, penalty: 1000, penaltyType: 'money', difficulty: 3 },
  { id: 'm_red_2', name: 'ミッション・インポッシブル', description: '相手にバレずに、相手の背中越しに自撮りを成功させろ！', type: 'red', reward: 0, penalty: 500, penaltyType: 'money', difficulty: 2 },
  { id: 'm_red_3', name: '街の歴史学者', description: '駅周辺にある「石碑」や「歴史的な案内板」を見つけて写真を撮れ！', type: 'red', reward: 0, penalty: 0, penaltyType: 'half_money', difficulty: 2 },
  { id: 'm_red_4', name: 'ランキング予想', description: '指定の店で「人気トップ10」に入りそうな商品を買い、ネット検索でトップ10内なら成功！', type: 'red', reward: 0, penalty: 1500, penaltyType: 'money', difficulty: 3 },
  { id: 'm_red_5', name: '激安メニュー探し', description: '現在地から一番近い飲食店の外観・メニュー表から「500円以下」のメニューを見つけて撮影！', type: 'red', reward: 0, penalty: 0, penaltyType: 'half_money', difficulty: 2 },
  { id: 'm_red_6', name: 'シャドウ・ストーカー', description: '相手にバレずに、相手の「影」を踏んでいる状態の足元を自撮りしろ！', type: 'red', reward: 0, penalty: 500, penaltyType: 'money', difficulty: 3 },
  { id: 'm_red_7', name: 'トレンドポーズ', description: '駅の看板の前で、「今流行りのポーズ」を決めて自撮りしろ！（恥ずかしさとの戦い）', type: 'red', reward: 0, penalty: 1000, penaltyType: 'money', difficulty: 3 },
  { id: 'm_red_8', name: '脳トレサバイバル', description: '相手が出題する「3桁＋3桁の暗算」に10秒以内に答えろ！', type: 'red', reward: 0, penalty: 0, penaltyType: 'half_money', difficulty: 2 },
  { id: 'm_red_9', name: '味覚チャレンジ', description: 'コンビニで「激辛」または「酸っぱい」商品を買い、ノーリアクションで食べきれ！', type: 'red', reward: 0, penalty: 1500, penaltyType: 'money', difficulty: 3 },
  { id: 'm_red_10', name: '運命のコイントス', description: 'リアルな硬貨を投げ、表裏を相手に宣言させろ。外れたら失敗！', type: 'red', reward: 0, penalty: 1000, penaltyType: 'money', difficulty: 1 },

  // 🟢 協力マス（協力ボーナス） 10種
  { id: 'm_green_1', name: '体内時計シンクロ', description: '目を閉じて同時にストップウォッチを起動。10秒（±0.5秒）で止めろ！', type: 'green', reward: 1000, penalty: 0, difficulty: 2 },
  { id: 'm_green_2', name: 'トリックアート撮影', description: '遠近法で、片方がもう片方を「手のひらに乗せている」写真を撮れ！', type: 'green', reward: 800, penalty: 0, difficulty: 2 },
  { id: 'm_green_3', name: '以心伝心ゲーム', description: '「おにぎりの具といえば？」を同時に言って答えを合わせろ！（チャンス3回）', type: 'green', reward: 500, penalty: 0, difficulty: 1 },
  { id: 'm_green_4', name: 'テレパシー・ショッピング', description: 'コンビニに別々に入店し、相談なしで「同じジャンルの商品（例：お茶）」を買って合流しろ！', type: 'green', reward: 1500, penalty: 0, difficulty: 3 },
  { id: 'm_green_5', name: 'カタカナ禁止令', description: '次の目的地に着くまで、2人とも「外来語（カタカナ語）」を一切使わずに会話しろ！', type: 'green', reward: 800, penalty: 0, difficulty: 2 },
  { id: 'm_green_6', name: '街のシンボル探し', description: 'その街（駅）の「ご当地キャラクター」や「シンボルマーク」を2人で探して一緒に撮影！', type: 'green', reward: 1000, penalty: 0, difficulty: 2 },
  { id: 'm_green_7', name: '車内広告リサーチ', description: '電車内で「メガネをかけた人物」が写っている広告を見つけ、2人で同時に指を差せ！', type: 'green', reward: 800, penalty: 0, difficulty: 1 },
  { id: 'm_green_8', name: '記憶力シンクロ', description: 'お店の外観を10秒見て背を向け、相手からのクイズに答えろ！', type: 'green', reward: 1000, penalty: 0, difficulty: 2 },
  { id: 'm_green_9', name: '影絵アート', description: '2人の「影」を組み合わせて、地面に「ハートマーク」を作って撮影しろ！', type: 'green', reward: 800, penalty: 0, difficulty: 1 },
  { id: 'm_green_10', name: '振り返りシンクロ', description: '背中合わせで歩き出し、5歩目で同時に振り返って目が合えば成功！（ズレたら失敗）', type: 'green', reward: 1000, penalty: 0, difficulty: 2 },
];
// ==========================================
// 🎒 アイテムデータ（全22種）
// ==========================================
export const ITEMS: Item[] = [
  // 妨害・逆転系
  { id: 'i_money_swap', name: '所持金入れ替え', description: '自分と相手の所持金をまるごと入れ替える', type: 'attack', rarity: 1 },
  { id: 'i_money_split', name: '割り勘カード', description: '2人の所持金を合計し、きっちり半分こにする', type: 'attack', rarity: 2 },
  { id: 'i_money_reset', name: '所持金リセット', description: '相手の所持金を強制的に0にする', type: 'attack', rarity: 1 },
  { id: 'i_mission_swap', name: 'ミッション入れ替え', description: '自分と相手のミッションを強制的に入れ替える', type: 'attack', rarity: 2 },
  { id: 'i_bomby_pass', name: 'ボンビーなすりつけ', description: '持っているボンビーを相手に直接なすりつける', type: 'attack', rarity: 2 },
  { id: 'i_item_steal', name: 'アイテム強奪', description: '相手が持っているアイテムをランダムに1枚奪う', type: 'attack', rarity: 2 },
  { id: 'i_treat', name: '奢りカード', description: '相手にリアルな少額の買い物（ジュース等）を奢らせる', type: 'attack', rarity: 3 },
  { id: 'i_mission_share', name: '道連れカード', description: '自分の赤マスミッションを、相手にも連帯させる', type: 'attack', rarity: 2 },

  // 自身強化・便利系
  { id: 'i_dice_double', name: 'サイコロ2個振り', description: '今回の移動時、サイコロを2個振れる（特急）', type: 'support', rarity: 3 },
  { id: 'i_mission_reroll', name: 'ミッション再抽選', description: '自分のミッションお題を別のものにチェンジする', type: 'support', rarity: 3 },
  { id: 'i_lottery', name: '宝くじカード', description: 'リアルでスクラッチ等を購入。当せん金×100倍をゲット', type: 'support', rarity: 1 },
  { id: 'i_station_skip', name: '駅スキップ', description: '今いる駅のミッションを破棄し、強制的に次の駅へ進む', type: 'support', rarity: 2 },
  { id: 'i_reward_double', name: '報酬2倍カード', description: '次のミッション成功報酬が2倍になる', type: 'support', rarity: 2 },
  { id: 'i_random_box', name: 'ランダムボックス', description: '使用すると、100円〜3,000円のどれかが当たる', type: 'support', rarity: 3 },
  { id: 'i_time_extend', name: '時間増加カード', description: 'ミッション中いつでも使用可能。制限時間を延長できる', type: 'support', rarity: 3 },

  // 防御・回避系
  { id: 'i_dice_plus2', name: 'ダイス+2カード', description: 'サイコロ勝負の際、自分の出目に+2する', type: 'defense', rarity: 2 },
  { id: 'i_dice_minus2', name: 'ダイス-2カード', description: 'サイコロ勝負の際、相手の出目を-2する', type: 'defense', rarity: 2 },
  { id: 'i_shield', name: '防御シールド', description: '相手からのカード攻撃やなすりつけを1回無効化する', type: 'defense', rarity: 2 },
  { id: 'i_mission_pass', name: 'ミッションフリーパス', description: '嫌なミッションを無条件で「クリア扱い」としてパスできる', type: 'defense', rarity: 1 },
  { id: 'i_debt_clear', name: '徳政令カード', description: '自分の借金（マイナス所持金）をゼロにする', type: 'defense', rarity: 2 },
];