/**
 * リアル桃鉄 対戦シミュレーター
 *
 * アプリのルール（src/hooks/useTurnActions.ts など）をそのまま再現して、2 人の対戦をたくさん回す。
 * ゲームのデータ（駅・物件・ミッション・アイテム）はアプリと同じファイルを読み込むので、
 * 物件を本決まりのものに差し替えたら、もう一度実行するだけで結果が更新される。
 *
 * 実行：node tools/sim/simulate.ts [1シナリオあたりのゲーム数（既定 10000）]
 * 結果：tools/sim/out/result.json
 *
 * 現実の行動は計算できないので、下の SCENARIOS の数字で仮定する（2026-11-24 ユーザー了承）
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { STATIONS, STATION_PROPERTIES, MISSIONS, ITEMS, SHIELD_ID, RANK_THRESHOLDS, pickItemIndexByRarity, propertyIncome, type Property, type Mission } from '../../src/data/gameData.ts';

// ---------------------------------------------------------------- 仮定
type Scenario = {
  id: string;
  label: string;
  successRate: [number, number, number]; // ミッション難易度 ★1, ★2, ★3 の成功率
  spendMean: number; // 1 駅あたりのリアル出費の平均（円）
  bidMin: number; // 入札額（上限額に対する割合）の下限
  bidMax: number;
  skipBid: number; // 入札しない確率
  useItems: boolean;
  bannedItems: string[];
  // ---- 改善案を試すための設定（既定はアプリの現状）
  diceCount?: number; // 移動のサイコロの個数
  startMoney?: number;
  interestRate?: number;
  interestOnlyWinter?: boolean; // 利息を冬の決算時だけにする
  settleSeasons?: number[]; // 決算する季節（0 春 1 夏 2 秋 3 冬）
  twoDiceFromHalf?: boolean; // 折り返し（全体の半分）を過ぎたらサイコロ 2 個
  chooseTwoInSecondHalf?: number; // 後半は 1 個か 2 個を選べる：2 個を選ぶ確率
  // リアル出費の扱い：deduct＝全額引く（現状）／none＝引かない／allowance＝おこづかい（この額まで引かない）／memory＝引くが同額を「思い出」として資産に数える
  spendMode?: 'deduct' | 'none' | 'allowance' | 'memory';
  allowance?: number;
  firstDestMiss?: number; // 1 番目の目的地に遅れる確率（ペナルティ廃止後は 0）
  overheadMin?: number; // 1 ターンの操作の時間（分）。ルーレット・目的地フェーズ廃止後は短い
  stayTimes?: { min: number; w: number }[]; // 滞在時間と出やすさ（既定は 30/45/60 分が同じ確率）
  missionScale?: number; // ミッションの報酬・ペナルティ（金額のもの）の倍率
  spendSpread?: boolean; // 2 人の使う金額に差をつける（1 駅平均 300〜1,500 円をそれぞれ決める）
  spendAsset?: { ratio: number; cap?: number }; // 使った金額の ratio 倍を資産に足す（1 駅 cap 円まで）
  // 貧乏神の逆転要素：憑かれている人が総資産で gap 円以上負けているとき、prob の確率で
  // jump＝相手に乗り移る（悪行なし）／ gift＝改心してお金をくれる（悪行の代わりに +gift 円）
  bombyComeback?: { gap: number; prob: number; kind: 'jump' | 'gift'; gift?: number };
};

const BASE: Scenario = {
  id: 'base',
  label: '基本（了承済みの前提）',
  successRate: [0.8, 0.6, 0.4],
  spendMean: 500,
  bidMin: 0.6,
  bidMax: 1.0,
  skipBid: 0.1,
  useItems: true,
  bannedItems: [],
};

const SCENARIOS: Scenario[] = [
  BASE,
  { ...BASE, id: 'mission_easy', label: 'ミッション成功率 高め（95/80/60%）', successRate: [0.95, 0.8, 0.6] },
  { ...BASE, id: 'mission_hard', label: 'ミッション成功率 低め（60/40/20%）', successRate: [0.6, 0.4, 0.2] },
  { ...BASE, id: 'spend_low', label: 'リアル出費 少なめ（平均200円）', spendMean: 200 },
  { ...BASE, id: 'spend_high', label: 'リアル出費 多め（平均1,500円）', spendMean: 1500 },
  { ...BASE, id: 'bid_aggressive', label: '入札 強気（上限の90〜100%・必ず入札）', bidMin: 0.9, bidMax: 1.0, skipBid: 0 },
  { ...BASE, id: 'bid_cautious', label: '入札 弱気（上限の40〜70%・30%は見送り）', bidMin: 0.4, bidMax: 0.7, skipBid: 0.3 },
  { ...BASE, id: 'no_items', label: 'アイテムを使わない', useItems: false },
  {
    ...BASE,
    id: 'no_swing_items',
    label: '大逆転系アイテムなし（宝くじ・所持金入れ替え・所持金リセット）',
    bannedItems: ['i_lottery', 'i_money_swap', 'i_money_reset'],
  },
  // ---- 改善案（アプリの現状とは違うルール）
  { ...BASE, id: 'p_half_two_dice', label: '【案】折り返しを過ぎたらサイコロ 2 個', twoDiceFromHalf: true },
  { ...BASE, id: 'p_bomby_jump', label: '【案】貧乏神：5,000 円以上負けていたら 10% で相手に乗り移る', bombyComeback: { gap: 5000, prob: 0.1, kind: 'jump' } },
  { ...BASE, id: 'p_bomby_gift', label: '【案】貧乏神：5,000 円以上負けていたら 10% で改心して +3,000 円', bombyComeback: { gap: 5000, prob: 0.1, kind: 'gift', gift: 3000 } },
  { ...BASE, id: 'p_bomby_jump20', label: '【案】貧乏神：5,000 円以上負けていたら 20% で相手に乗り移る', bombyComeback: { gap: 5000, prob: 0.2, kind: 'jump' } },
  { ...BASE, id: 'p_bomby_jump_3k25', label: '【案】貧乏神：3,000 円以上負けていたら 25% で相手に乗り移る', bombyComeback: { gap: 3000, prob: 0.25, kind: 'jump' } },
  { ...BASE, id: 'p_bomby_gift_3k25', label: '【案】貧乏神：3,000 円以上負けていたら 25% で改心して +3,000 円', bombyComeback: { gap: 3000, prob: 0.25, kind: 'gift', gift: 3000 } },
  { ...BASE, id: 'p_two_dice', label: '【案】移動のサイコロを最初から 2 個', diceCount: 2 },
  { ...BASE, id: 'p_start_10000', label: '【案】最初の所持金 10,000 円', startMoney: 10000 },
  { ...BASE, id: 'p_interest_winter', label: '【案】利息は冬の決算時だけ 10%', interestRate: 0.1, interestOnlyWinter: true },
  { ...BASE, id: 'p_settle_twice', label: '【案】決算を年 2 回（夏・冬）', settleSeasons: [1, 3] },
  {
    ...BASE,
    id: 'p_combo',
    label: '【案】所持金 10,000＋利息は冬だけ 10%＋決算年 2 回',
    startMoney: 10000,
    interestRate: 0.1,
    interestOnlyWinter: true,
    settleSeasons: [1, 3],
  },
  {
    ...BASE,
    id: 'p_combo_bomby',
    label: '【案】お金の改善 3 点＋貧乏神 3,000 円以上負けで 25% 乗り移り',
    startMoney: 10000,
    interestRate: 0.1,
    interestOnlyWinter: true,
    settleSeasons: [1, 3],
    bombyComeback: { gap: 3000, prob: 0.25, kind: 'jump' },
  },
  {
    ...BASE,
    id: 'v2',
    label: '【v2 採用ルール】お金の改善 3 点＋後半は 1 個か 2 個を選べる（半々）＋貧乏神の改心',
    startMoney: 10000,
    interestRate: 0.1,
    interestOnlyWinter: true,
    settleSeasons: [1, 3],
    chooseTwoInSecondHalf: 0.5,
    bombyComeback: { gap: 3000, prob: 0.25, kind: 'gift', gift: 3000 },
  },
  // ---- v3：ルーレット廃止・到達ペナルティ廃止（2026-11-25）と、リアル出費の扱いの案
  ...(() => {
    const V3: Scenario = {
      ...BASE,
      id: 'v3',
      label: '【v3 現状】v2＋到達ペナルティなし（出費は全額引く・平均500円）',
      startMoney: 10000,
      interestRate: 0.1,
      interestOnlyWinter: true,
      settleSeasons: [1, 3],
      chooseTwoInSecondHalf: 0.5,
      bombyComeback: { gap: 3000, prob: 0.25, kind: 'gift', gift: 3000 },
      firstDestMiss: 0,
    };
    return [
      V3,
      { ...V3, id: 'v3_deduct_1000', label: '【v3】出費は全額引く・平均1,000円使う', spendMean: 1000 },
      { ...V3, id: 'v3_none', label: '【案A】出費は引かない（平均1,000円使う）', spendMode: 'none' as const, spendMean: 1000 },
      { ...V3, id: 'v3_allowance', label: '【案B】おこづかい制：1駅1,000円まで引かない（平均1,000円使う）', spendMode: 'allowance' as const, allowance: 1000, spendMean: 1000 },
      { ...V3, id: 'v3_memory', label: '【案C】思い出資産：引くが同額を資産に（平均1,000円使う）', spendMode: 'memory' as const, spendMean: 1000 },
      { ...V3, id: 'v3_none_3000', label: '【案A2】出費は引かない＋最初の所持金3,000円', spendMode: 'none' as const, spendMean: 1000, startMoney: 3000 },
    ];
  })(),
  // ---- v4：2026-11-26 時点の本番のルール
  ...(() => {
    const V4: Scenario = {
      ...BASE,
      id: 'v4',
      label: '【v4 本番】所持金1万・決算年2回・利息は冬だけ10%・後半は1個か2個（半々）・改心ボンビー・出費は引かない・到達ペナルティなし',
      startMoney: 10000,
      interestRate: 0.1,
      interestOnlyWinter: true,
      settleSeasons: [1, 3],
      chooseTwoInSecondHalf: 0.5,
      bombyComeback: { gap: 3000, prob: 0.25, kind: 'gift', gift: 3000 },
      firstDestMiss: 0,
      spendMode: 'none' as const,
      overheadMin: 5,
    };
    return [
      V4,
      // ---- 2026-11-26：所持金 5,000 円と、滞在時間の案
      { ...V4, id: 'v5_money5000', label: '【案】所持金5,000円（滞在は今のまま 30/45/60 分）', startMoney: 5000 },
      { ...V4, id: 'v5_stay_even', label: '【案】所持金5,000円＋滞在 30/40/50/60 分が同じ確率', startMoney: 5000, stayTimes: [{ min: 30, w: 25 }, { min: 40, w: 25 }, { min: 50, w: 25 }, { min: 60, w: 25 }] },
      { ...V4, id: 'v5_stay_3535', label: '【案】所持金5,000円＋滞在 30・40 分 各35%、50・60 分 各15%', startMoney: 5000, stayTimes: [{ min: 30, w: 35 }, { min: 40, w: 35 }, { min: 50, w: 15 }, { min: 60, w: 15 }] },
      { ...V4, id: 'v5_stay_4030', label: '【案】所持金5,000円＋滞在 30分40%・40分30%・50分20%・60分10%', startMoney: 5000, stayTimes: [{ min: 30, w: 40 }, { min: 40, w: 30 }, { min: 50, w: 20 }, { min: 60, w: 10 }] },
      // ---- 2026-11-26：v6＝所持金 5,000＋滞在 30・40 分多め（feature/money5000-stay）を基準にした案
      ...(() => {
        const V6: Scenario = { ...V4, id: 'v6', label: '【v6】所持金5,000＋滞在30・40分多め（2人の出費に差をつける）', startMoney: 5000, stayTimes: [{ min: 30, w: 35 }, { min: 40, w: 35 }, { min: 50, w: 15 }, { min: 60, w: 15 }], spendSpread: true };
        return [
          V6,
          {
            ...V6,
            id: 'v7',
            label: '【v7 実装】v6＋ミッション3倍＋ご当地グルメ＋ジャンル集め＋思い出（1駅1,000円まで）・所持金リセットなし',
            spendAsset: { ratio: 1, cap: 1000 },
          },
          { ...V6, id: 'v6_m2', label: '【案】ミッションの金額 2 倍（※2026-11-26 にアプリ側を 3 倍にしたので、今は元の 6 倍）', missionScale: 2 },
          { ...V6, id: 'v6_m3', label: '【案】ミッションの金額 3 倍（※アプリ側が 3 倍になったので、今は元の 9 倍）', missionScale: 3 },
          { ...V6, id: 'v6_spend_full', label: '【案】使った金額を全額資産に（上限なし）', spendAsset: { ratio: 1 } },
          { ...V6, id: 'v6_spend_cap1000', label: '【案】使った金額を資産に（1駅1,000円まで）', spendAsset: { ratio: 1, cap: 1000 } },
          { ...V6, id: 'v6_spend_half500', label: '【案】使った金額の半分を資産に（1駅500円まで）', spendAsset: { ratio: 0.5, cap: 500 } },
          { ...V6, id: 'v6_m3_cap500', label: '【案】ミッション3倍＋使った金額の半分を資産に（1駅500円まで）', missionScale: 3, spendAsset: { ratio: 0.5, cap: 500 } },
        ];
      })(),
      { ...V4, id: 'v4_mission_easy', label: '【v4】ミッション成功率 高め（95/80/60%）', successRate: [0.95, 0.8, 0.6] as [number, number, number] },
      { ...V4, id: 'v4_mission_hard', label: '【v4】ミッション成功率 低め（60/40/20%）', successRate: [0.6, 0.4, 0.2] as [number, number, number] },
      { ...V4, id: 'v4_bid_aggressive', label: '【v4】入札 強気（上限の90〜100%・必ず入札）', bidMin: 0.9, bidMax: 1.0, skipBid: 0 },
      { ...V4, id: 'v4_bid_cautious', label: '【v4】入札 弱気（上限の40〜70%・30%は見送り）', bidMin: 0.4, bidMax: 0.7, skipBid: 0.3 },
      { ...V4, id: 'v4_always_two', label: '【v4】後半はいつも2個を選ぶ', chooseTwoInSecondHalf: 1 },
      { ...V4, id: 'v4_always_one', label: '【v4】後半もいつも1個を選ぶ', chooseTwoInSecondHalf: 0 },
      { ...V4, id: 'v4_no_items', label: '【v4】アイテムを使わない', useItems: false },
    ];
  })(),
  {
    ...BASE,
    id: 'p_combo_half_bomby',
    label: '【案】お金の改善 3 点＋折り返しから 2 個＋貧乏神 25% 乗り移り',
    startMoney: 10000,
    interestRate: 0.1,
    interestOnlyWinter: true,
    settleSeasons: [1, 3],
    twoDiceFromHalf: true,
    bombyComeback: { gap: 3000, prob: 0.25, kind: 'jump' },
  },
];

// 了承した前提のほかに置いた小さな仮定
const TRAVEL_MIN_PER_STATION = 15; // 1 駅あたりの移動（待ち時間込み）
// 別の見積もり：乗車 1 回につき待ち 5 分＋1 駅 2.5 分（何駅もまとめて乗る場合はこちらが現実に近い）
const ALT_WAIT_MIN = 5;
const ALT_MIN_PER_STATION = 2.5;
const OVERHEAD_MIN_PER_TURN = 10; // ルーレット・目的地入力・出費入力・入札などの操作
const FIRST_DEST_MISS_RATE = 0.1; // 1 番目の目的地に時間内に着けない確率
const TREAT_COST = 150; // 奢り（ジュース）の金額
// 宝くじ：200 円のスクラッチを想定。10% で 200 円、1% で 1,000 円が当たる → ゲーム内では 100 倍
const LOTTERY = [
  { p: 0.01, win: 1000 },
  { p: 0.1, win: 200 },
];

// ---------------------------------------------------------------- 乱数（再現できるよう seed つき）
let seed = 20261124;
const rnd = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T>(a: T[]) => a[Math.floor(rnd() * a.length)];
const dice = () => Math.floor(rnd() * 6) + 1;
// 平均 mean の出費（0 円の日もあれば多い日もある：指数分布、100 円単位）
const spend = (mean: number) => Math.round((-Math.log(1 - rnd()) * mean) / 100) * 100;

// ---------------------------------------------------------------- 状態
type Player = {
  money: number;
  props: (Property & { paid: number })[];
  items: string[];
  // 集計用
  fromMission: number;
  fromSpend: number;
  fromBid: number;
  fromSettle: number;
  fromBomby: number;
  fromItems: number;
  fromInterest: number;
  fromForcedSale: number;
  bombyTurns: number;
  kingHits: number;
  itemsUsed: string[];
  wasInDebt: boolean;
  memories: number; // 思い出資産（spendMode = memory のとき）
  missionWins: number; // ミッション成功の回数
  totalSpent: number; // 現実で使った金額の合計
  spendMean: number; // この人の 1 駅あたりの平均出費
};

const newPlayer = (startMoney = 3000): Player => ({
  money: startMoney,
  props: [],
  items: ['i_dice_plus2'],
  fromMission: 0,
  fromSpend: 0,
  fromBid: 0,
  fromSettle: 0,
  fromBomby: 0,
  fromItems: 0,
  fromInterest: 0,
  fromForcedSale: 0,
  bombyTurns: 0,
  kingHits: 0,
  itemsUsed: [],
  wasInDebt: false,
  memories: 0,
  missionWins: 0,
  totalSpent: 0,
  spendMean: 0,
});

// アプリと同じ：所持金がマイナスなら、安い物件から元値の 50% で売って補う
const applyMoney = (p: Player, change: number, bucket: keyof Player) => {
  p.money += change;
  (p[bucket] as number) += change;
  if (p.money < 0 && p.props.length > 0) {
    p.props.sort((a, b) => a.price - b.price);
    while (p.money < 0 && p.props.length > 0) {
      const sold = p.props.shift()!;
      const v = Math.floor(sold.price * 0.5);
      p.money += v;
      p.fromForcedSale += v;
    }
  }
  if (p.money < 0) p.wasInDebt = true;
};

const assets = (p: Player) => p.money + p.memories + p.props.reduce((s, x) => s + x.price, 0);
// 決算の収益：アプリと同じ（ジャンル集めボーナス込み。2026-11-26〜）
const income = (p: Player) => propertyIncome(p.props).income;

// ご褒美ランク：アプリと同じ基準（gameData.ts の RANK_THRESHOLDS）
const rank = (diff: number) => (diff >= RANK_THRESHOLDS.S ? 'S' : diff >= RANK_THRESHOLDS.A ? 'A' : diff >= RANK_THRESHOLDS.B ? 'B' : 'C');

const takeItem = (p: Player, id: string) => {
  const i = p.items.indexOf(id);
  if (i < 0) return false;
  p.items.splice(i, 1);
  p.itemsUsed.push(id);
  return true;
};

// ---------------------------------------------------------------- 1 ゲーム
type GameResult = {
  turns: number;
  minutes: number;
  minutesAlt: number;
  cashByTurn: number[][]; // ターンごとの所持金 [ターン][プレイヤー]
  settlements: number;
  finalAssets: [number, number];
  winner: 0 | 1 | -1;
  diff: number;
  rank: string;
  leaderAtHalf: 0 | 1 | -1;
  leadChanges: number;
  players: Player[];
  kingEvents: number;
  comebackEvents: number;
  holderLog: number[];
  bombyTurnsTotal: number;
  propertyBuys: { id: string; paid: number }[];
  itemWins: { item: string; won: boolean }[];
};

const playGame = (sc: Scenario): GameResult => {
  const P = [newPlayer(sc.startMoney), newPlayer(sc.startMoney)];
  for (const p of P) p.spendMean = sc.spendSpread ? 300 + rnd() * 1200 : sc.spendMean;
  let pos = 0;
  let turn = 0;
  let rep: 0 | 1 = 0; // 代表者（サイコロを振る人）。最初はホスト
  let seasonIdx = 0; // 0 春 1 夏 2 秋 3 冬
  let bomby: 0 | 1 | -1 = -1;
  let minutes = 0;
  let minutesAlt = 0;
  const cashByTurn: number[][] = [];
  let settlements = 0;
  let kingEvents = 0;
  let comebackEvents = 0;
  const holderLog: number[] = []; // ターンごとに憑かれていた人
  let bombyTurnsTotal = 0;
  let leadChanges = 0;
  let lastLeader: 0 | 1 | -1 = -1;
  let leaderAtHalf: 0 | 1 | -1 = -1;
  const propertyBuys: { id: string; paid: number }[] = [];
  const goal = STATIONS.length - 1;
  const canUse = (id: string) => sc.useItems && !sc.bannedItems.includes(id);
  const other = (i: 0 | 1) => (1 - i) as 0 | 1;

  // アイテムを手に入れる（3 枠を超えたら一番古いものを捨てる）
  const gain = (p: Player) => {
    const pool = ITEMS.filter((it) => !sc.bannedItems.includes(it.id));
    p.items.push(pool[pickItemIndexByRarity(pool, rnd)].id); // アプリと同じく出やすさ（★）に比例
    if (p.items.length > 3) p.items.shift();
  };

  // 防御シールド：相手が持っていれば、妨害カードを 1 回だけ自動で無効化（シールドは消える）
  const shielded = (op: Player) => {
    const k = op.items.indexOf(SHIELD_ID);
    if (k < 0) return false;
    op.items.splice(k, 1);
    return true;
  };

  // 「すぐ使う」系のアイテム（自分の番でなくても使える想定）
  const useInstantItems = (i: 0 | 1) => {
    const me = P[i];
    const op = P[other(i)];
    if (canUse('i_random_box') && takeItem(me, 'i_random_box')) applyMoney(me, (Math.floor(rnd() * 30) + 1) * 100, 'fromItems');
    if (canUse('i_lottery') && takeItem(me, 'i_lottery')) {
      const r = rnd();
      let acc = 0;
      for (const l of LOTTERY) {
        acc += l.p;
        if (r < acc) {
          applyMoney(me, l.win * 100, 'fromItems');
          break;
        }
      }
    }
    if (canUse('i_debt_clear') && me.money < 0 && takeItem(me, 'i_debt_clear')) {
      me.fromItems += -me.money;
      me.money = 0;
    }
    if (canUse('i_money_swap') && op.money > me.money + 1000 && takeItem(me, 'i_money_swap') && !shielded(op)) {
      const d = op.money - me.money;
      me.fromItems += d;
      op.fromItems -= d;
      [me.money, op.money] = [op.money, me.money];
    }
    if (canUse('i_money_split') && me.money >= 0 && op.money > me.money + 1000 && takeItem(me, 'i_money_split') && !shielded(op)) {
      const half = Math.floor((me.money + op.money) / 2);
      me.fromItems += half - me.money;
      op.fromItems += half - op.money;
      me.money = half;
      op.money = half;
    }
    if (canUse('i_money_reset') && op.money > 1000 && takeItem(me, 'i_money_reset') && !shielded(op)) {
      op.fromItems -= op.money;
      op.money = 0;
    }
    if (canUse('i_treat') && takeItem(me, 'i_treat') && !shielded(op)) applyMoney(op, -TREAT_COST, 'fromItems');
    if (canUse('i_bomby_pass') && bomby === i && takeItem(me, 'i_bomby_pass') && !shielded(op)) bomby = other(i);
    if (canUse('i_item_steal') && op.items.length > 0 && takeItem(me, 'i_item_steal') && !shielded(op)) {
      const k = Math.floor(rnd() * op.items.length);
      me.items.push(op.items.splice(k, 1)[0]);
    }
  };

  while (true) {
    turn++;
    // ---- アイテム（すぐ使う系）
    useInstantItems(rep);
    useInstantItems(other(rep));

    // ---- サイコロ（代表者のカードのみ有効。アプリと同じく 1 ターン 1 枚）
    let move: number;
    // 基本の個数：既定 1 個／後半は選べる／折り返しから 2 個 など
    let count = sc.diceCount ?? 1;
    if (sc.twoDiceFromHalf && pos >= goal / 2) count = 2;
    if (sc.chooseTwoInSecondHalf !== undefined && pos >= goal / 2) count = rnd() < sc.chooseTwoInSecondHalf ? 2 : 1;
    // 「サイコロ2個振り」は 1 個増やす。ダイス+2 は出目に +2（アプリと同じく 1 ターン 1 枚）
    let bonus = 0;
    if (canUse('i_dice_double') && takeItem(P[rep], 'i_dice_double')) count += 1;
    else if (canUse('i_dice_plus2') && takeItem(P[rep], 'i_dice_plus2')) bonus = 2;
    move = Array.from({ length: count }, dice).reduce((a, b) => a + b, 0) + bonus;
    const from = pos;
    pos = Math.min(goal, pos + move);
    minutes += (pos - from) * TRAVEL_MIN_PER_STATION;
    minutesAlt += ALT_WAIT_MIN + (pos - from) * ALT_MIN_PER_STATION;

    // ---- ルーレット（滞在時間とマス）
    let stay = pick([30, 45, 60]);
    if (sc.stayTimes) {
      const total = sc.stayTimes.reduce((a, b) => a + b.w, 0);
      let r = rnd() * total;
      for (const t of sc.stayTimes) {
        r -= t.w;
        if (r < 0) {
          stay = t.min;
          break;
        }
      }
    }
    minutes += stay + (sc.overheadMin ?? OVERHEAD_MIN_PER_TURN);
    minutesAlt += stay + (sc.overheadMin ?? OVERHEAD_MIN_PER_TURN);
    const square = pick(['blue', 'red', 'green', 'yellow'] as const);
    const pool = square === 'yellow' ? MISSIONS : MISSIONS.filter((m) => m.type === square);
    const m0 = pick(pool);
    const shared = m0.type === 'green';
    const missions: [Mission, Mission] = shared
      ? [m0, m0]
      : [m0, pick(pool.filter((m) => m.id !== m0.id).length ? pool.filter((m) => m.id !== m0.id) : pool)];
    // 代表者（rep）が「自分」、相手が「あいて」としてアプリの判定を行う
    const myM = missions[0];
    let opM = missions[1];
    const effects: [string | null, string | null] = [null, null];

    // ---- ミッション系アイテム（代表者・相手それぞれ）
    for (const i of [rep, other(rep)] as (0 | 1)[]) {
      const me = P[i];
      const mine = i === rep ? myM : opM;
      if (mine.type === 'red') {
        if (canUse('i_mission_pass') && takeItem(me, 'i_mission_pass')) effects[i] = 'pass';
        else if (canUse('i_station_skip') && takeItem(me, 'i_station_skip')) effects[i] = 'skip';
        else if (canUse('i_mission_share') && !shared && i === rep && takeItem(me, 'i_mission_share') && !shielded(P[other(rep)])) opM = myM; // 相手も同じ赤ミッションに
      } else if ((mine.type === 'blue' || mine.type === 'green') && canUse('i_reward_double') && takeItem(me, 'i_reward_double')) {
        effects[i] = 'double';
      }
    }

    const skipped = effects[rep] === 'skip' || effects[other(rep)] === 'skip'; // 駅スキップは入札フェーズへ直行
    if (!skipped) {
      const succ = (m: Mission) => rnd() < sc.successRate[Math.min(3, Math.max(1, m.difficulty)) - 1];
      let mySuccess = succ(myM);
      const opSuccess = shared ? mySuccess : succ(opM); // 協力は 2 人で 1 つの結果
      // ミッションフリーパスはアプリの現状では「代表者（判定を入力する人）」にしか効かない
      if (!mySuccess && effects[rep] === 'pass') mySuccess = true;
      const r = P[rep];
      const o = P[other(rep)];
      // ミッションの金額の倍率（案）。所持金半減のペナルティはそのまま
      const k = sc.missionScale ?? 1;
      const R = (n: number) => Math.round(n * k);
      let rc = 0;
      let oc = 0;
      if (mySuccess) r.missionWins++;
      if (opSuccess) o.missionWins++;
      if (mySuccess) {
        let reward = R(myM.reward || 0);
        if (effects[rep] === 'double') reward *= 2;
        if (myM.type === 'blue') rc += reward;
        if (myM.type === 'green') {
          rc += reward;
          oc += R(myM.reward);
        }
      } else if (myM.type === 'red') {
        if (myM.penaltyType === 'half_money') rc -= r.money > 0 ? Math.ceil(r.money / 2) : 0;
        else rc -= R(myM.penalty);
      }
      if (opSuccess) {
        if (opM.type === 'blue') oc += R(opM.reward);
        if (opM.type === 'green' && myM.type !== 'green') {
          rc += R(opM.reward);
          oc += R(opM.reward);
        }
      } else if (opM.type === 'red') {
        if (opM.penaltyType === 'half_money') oc -= o.money > 0 ? Math.ceil(o.money / 2) : 0;
        else oc -= R(opM.penalty);
      }
      if (square === 'yellow') {
        if (mySuccess) gain(r);
        if (opSuccess) gain(o);
      }
      if (rnd() < (sc.firstDestMiss ?? FIRST_DEST_MISS_RATE)) rc -= 1000;
      applyMoney(r, rc, 'fromMission');
      applyMoney(o, oc, 'fromMission');
      // 貧乏神の移動（アプリと同じ）
      if (!mySuccess && opSuccess) bomby = rep;
      else if (mySuccess && !opSuccess) bomby = other(rep);
      else if (!mySuccess && !opSuccess) bomby = rnd() < 0.5 ? rep : other(rep);
    }

    // ---- リアル出費
    for (const p of P) {
      const s = spend(p.spendMean);
      p.totalSpent += s;
      // 案：使った金額を資産に足す（上限つき）
      if (sc.spendAsset) p.memories += Math.min(Math.round(s * sc.spendAsset.ratio), sc.spendAsset.cap ?? Infinity);
      const mode = sc.spendMode ?? 'deduct';
      if (mode === 'deduct') applyMoney(p, -s, 'fromSpend');
      else if (mode === 'allowance') applyMoney(p, -Math.max(0, s - (sc.allowance ?? 1000)), 'fromSpend');
      else if (mode === 'memory') {
        applyMoney(p, -s, 'fromSpend');
        p.memories += s;
      }
    }

    // ---- 入札
    const props = STATION_PROPERTIES[STATIONS[pos]] ?? [];
    const bids = P.map((p) => {
      if (props.length === 0 || rnd() < sc.skipBid) return null;
      const prop = pick(props);
      let amount = prop.type === 'fixed' ? prop.price : Math.round((prop.price * (sc.bidMin + rnd() * (sc.bidMax - sc.bidMin))) / 10) * 10;
      if (amount > p.money) return null; // アプリと同じく所持金を超えては買えない
      return { prop, amount };
    });
    const win: (null | { prop: Property; amount: number })[] = [null, null];
    if (bids[0] && bids[1] && bids[0].prop.id === bids[1].prop.id) {
      const w = bids[0].amount > bids[1].amount ? 0 : bids[1].amount > bids[0].amount ? 1 : rnd() < 0.5 ? 0 : 1;
      win[w] = bids[w];
    } else {
      win[0] = bids[0];
      win[1] = bids[1];
    }
    win.forEach((w, i) => {
      if (!w) return;
      const p = P[i];
      p.money -= w.amount;
      p.fromBid -= w.amount;
      p.props.push({ ...w.prop, paid: w.amount });
      propertyBuys.push({ id: w.prop.id, paid: w.amount });
    });

    // ---- 決算（冬）と借金の利息
    if ((sc.settleSeasons ?? [3]).includes(seasonIdx)) {
      settlements++;
      for (const p of P) {
        const inc = income(p);
        p.money += inc;
        p.fromSettle += inc;
      }
    }
    for (const p of P) {
      if (p.money < 0 && (!sc.interestOnlyWinter || seasonIdx === 3)) {
        const interest = Math.floor(Math.abs(p.money) * (sc.interestRate ?? 0.2));
        p.money -= interest;
        p.fromInterest -= interest;
        p.wasInDebt = true;
      }
    }
    seasonIdx = (seasonIdx + 1) % 4;
    cashByTurn.push([P[0].money, P[1].money]);

    // ---- 途中経過（逆転の集計）
    const a0 = assets(P[0]);
    const a1 = assets(P[1]);
    const leader = a0 > a1 ? 0 : a1 > a0 ? 1 : -1;
    if (leader !== -1 && lastLeader !== -1 && leader !== lastLeader) leadChanges++;
    if (leader !== -1) lastLeader = leader;
    if (leaderAtHalf === -1 && pos >= goal / 2) leaderAtHalf = leader;

    if (pos >= goal) break;

    // ---- 貧乏神の悪行（入札の後。ゴールした回はなし）
    if (bomby !== -1) {
      bombyTurnsTotal++;
      holderLog.push(bomby);
      const v = P[bomby];
      v.bombyTurns++;
      const opp = P[other(bomby)];
      const cb = sc.bombyComeback;
      const r = rnd() * 100;
      if (cb && assets(v) <= assets(opp) - cb.gap && rnd() < cb.prob) {
        comebackEvents++;
        if (cb.kind === 'jump') bomby = other(bomby);
        else applyMoney(v, cb.gift ?? 0, 'fromBomby');
      } else if (r < 5) {
        kingEvents++;
        v.kingHits++;
        if (v.props.length > 0) {
          v.props.sort((a, b) => b.price - a.price);
          v.props.shift();
        }
        applyMoney(v, -dice() * 1000, 'fromBomby');
      } else if (r < 25) {
        if (rnd() < 0.5) applyMoney(v, -100, 'fromBomby');
      } else {
        const act = rnd();
        if (act < 0.33) applyMoney(v, -1000, 'fromBomby');
        else if (act < 0.66) applyMoney(v, -TREAT_COST, 'fromBomby');
      }
    }
    rep = other(rep);
  }

  const fa: [number, number] = [assets(P[0]), assets(P[1])];
  const winner = fa[0] > fa[1] ? 0 : fa[1] > fa[0] ? 1 : -1;
  const diff = Math.abs(fa[0] - fa[1]);
  const itemWins: { item: string; won: boolean }[] = [];
  P.forEach((p, i) => p.itemsUsed.forEach((it) => itemWins.push({ item: it, won: winner === i })));
  return {
    turns: turn,
    minutes,
    minutesAlt,
    cashByTurn,
    settlements,
    finalAssets: fa,
    winner,
    diff,
    rank: rank(diff),
    leaderAtHalf,
    leadChanges,
    players: P,
    kingEvents,
    comebackEvents,
    holderLog,
    bombyTurnsTotal,
    propertyBuys,
    itemWins,
  };
};

// ---------------------------------------------------------------- 集計
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const pct = (a: number[], q: number) => {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};
const share = (n: number, d: number) => Math.round((n / d) * 1000) / 10;

const N = Number(process.argv[2] ?? 10000);
const results: Record<string, unknown> = {};

for (const sc of SCENARIOS) {
  const games: GameResult[] = [];
  for (let g = 0; g < N; g++) games.push(playGame(sc));
  const decided = games.filter((g) => g.winner !== -1);
  const players = games.flatMap((g) => g.players);
  const ranks = { S: 0, A: 0, B: 0, C: 0 } as Record<string, number>;
  games.forEach((g) => ranks[g.rank]++);

  // アイテムを使った人の勝率
  const itemStats: Record<string, { used: number; won: number }> = {};
  games.forEach((g) =>
    g.itemWins.forEach(({ item, won }) => {
      itemStats[item] ??= { used: 0, won: 0 };
      itemStats[item].used++;
      if (won) itemStats[item].won++;
    }),
  );

  results[sc.id] = {
    label: sc.label,
    games: N,
    turns: { mean: +mean(games.map((g) => g.turns)).toFixed(2), p10: pct(games.map((g) => g.turns), 0.1), p90: pct(games.map((g) => g.turns), 0.9) },
    hours: {
      mean: +(mean(games.map((g) => g.minutes)) / 60).toFixed(1),
      p10: +(pct(games.map((g) => g.minutes), 0.1) / 60).toFixed(1),
      p90: +(pct(games.map((g) => g.minutes), 0.9) / 60).toFixed(1),
    },
    hoursAltTravel: {
      mean: +(mean(games.map((g) => g.minutesAlt)) / 60).toFixed(1),
      p10: +(pct(games.map((g) => g.minutesAlt), 0.1) / 60).toFixed(1),
      p90: +(pct(games.map((g) => g.minutesAlt), 0.9) / 60).toFixed(1),
    },
    // ターン k 終了時の所持金の平均と、マイナスの人の割合（k 番目まで続いたゲームだけで集計）
    cashByTurn: Array.from({ length: 12 }, (_, k) => {
      const xs = games.filter((g) => g.cashByTurn.length > k).flatMap((g) => g.cashByTurn[k]);
      return xs.length < 50 ? null : { turn: k + 1, mean: Math.round(mean(xs)), negative: share(xs.filter((x) => x < 0).length, xs.length) };
    }).filter(Boolean),
    settlements: { mean: +mean(games.map((g) => g.settlements)).toFixed(2), zero: share(games.filter((g) => g.settlements === 0).length, N) },
    firstPlayerWinRate: share(decided.filter((g) => g.winner === 0).length, decided.length),
    comebackRate: share(games.filter((g) => g.leaderAtHalf !== -1 && g.winner !== -1 && g.leaderAtHalf !== g.winner).length, N),
    leadChangesMean: +mean(games.map((g) => g.leadChanges)).toFixed(2),
    finalAssets: {
      mean: Math.round(mean(players.map(assets))),
      p10: pct(players.map(assets), 0.1),
      p90: pct(players.map(assets), 0.9),
      negativeRate: share(players.filter((p) => assets(p) < 0).length, players.length),
    },
    diff: { mean: Math.round(mean(games.map((g) => g.diff))), median: pct(games.map((g) => g.diff), 0.5), p90: pct(games.map((g) => g.diff), 0.9), p35: pct(games.map((g) => g.diff), 0.35), p75: pct(games.map((g) => g.diff), 0.75), p95: pct(games.map((g) => g.diff), 0.95) },
    rankRate: Object.fromEntries(Object.entries(ranks).map(([k, v]) => [k, share(v, N)])),
    // 1 人あたり・1 ゲームあたりの平均の増減（何がお金を動かしているか）
    moneyFlowPerPlayer: {
      mission: Math.round(mean(players.map((p) => p.fromMission))),
      realSpending: Math.round(mean(players.map((p) => p.fromSpend))),
      propertyPurchase: Math.round(mean(players.map((p) => p.fromBid))),
      settlementIncome: Math.round(mean(players.map((p) => p.fromSettle))),
      bomby: Math.round(mean(players.map((p) => p.fromBomby))),
      items: Math.round(mean(players.map((p) => p.fromItems))),
      debtInterest: Math.round(mean(players.map((p) => p.fromInterest))),
      forcedSale: Math.round(mean(players.map((p) => p.fromForcedSale))),
    },
    // お金の動きの大きさ（プラスマイナス関係なく）。勝敗への効き方の目安
    absMoneyFlowPerPlayer: {
      mission: Math.round(mean(players.map((p) => Math.abs(p.fromMission)))),
      items: Math.round(mean(players.map((p) => Math.abs(p.fromItems)))),
      bomby: Math.round(mean(players.map((p) => Math.abs(p.fromBomby)))),
      settlementIncome: Math.round(mean(players.map((p) => p.fromSettle))),
    },
    propertiesOwnedAtEnd: +mean(players.map((p) => p.props.length)).toFixed(2),
    bomby: {
      turnsPerGame: +mean(games.map((g) => g.bombyTurnsTotal)).toFixed(2),
      kingPerGame: +mean(games.map((g) => g.kingEvents)).toFixed(3),
      gamesWithKing: share(games.filter((g) => g.kingEvents > 0).length, N),
      // 同じ人に憑き続けた最長ターン数（平均）
      longestStreak: +mean(
        games.map((g) => {
          let best = 0;
          let run = 0;
          g.holderLog.forEach((h, k) => {
            run = k > 0 && g.holderLog[k - 1] === h ? run + 1 : 1;
            best = Math.max(best, run);
          });
          return best;
        }),
      ).toFixed(2),
      // 貧乏神が憑いていたターンのうち、最終的に負けた人に憑いていた割合
      loserShare: share(
        games.reduce((s, g) => s + g.holderLog.filter((h) => g.winner !== -1 && h !== g.winner).length, 0),
        games.reduce((s, g) => s + g.holderLog.length, 0),
      ),
      comebackEventsPerGame: +mean(games.map((g) => g.comebackEvents)).toFixed(2),
    },
    // 現実で多く使った人の勝率（50% なら使った金額は勝敗に関係ない）
    higherSpenderWinRate: share(
      games.filter((g) => g.winner !== -1 && g.players[0].totalSpent !== g.players[1].totalSpent && g.players[g.winner].totalSpent > g.players[1 - g.winner].totalSpent).length,
      games.filter((g) => g.winner !== -1 && g.players[0].totalSpent !== g.players[1].totalSpent).length,
    ),
    // ミッションの成功が多かった人の勝率（高いほどミッションが勝敗に効いている）
    moreMissionWinsWinRate: share(
      games.filter((g) => g.winner !== -1 && g.players[0].missionWins !== g.players[1].missionWins && g.players[g.winner].missionWins > g.players[1 - g.winner].missionWins).length,
      games.filter((g) => g.winner !== -1 && g.players[0].missionWins !== g.players[1].missionWins).length,
    ),
    debtEverRate: share(players.filter((p) => p.wasInDebt).length, players.length),
    itemsUsedPerPlayer: +mean(players.map((p) => p.itemsUsed.length)).toFixed(2),
    itemWinRate: Object.fromEntries(
      Object.entries(itemStats)
        .sort((a, b) => b[1].won / b[1].used - a[1].won / a[1].used)
        .map(([k, v]) => [ITEMS.find((i) => i.id === k)?.name ?? k, { used: v.used, winRate: share(v.won, v.used) }]),
    ),
  };
  console.log(`✔ ${sc.label}: ${N} ゲーム`);
}

// ---- 物件ごとの分析（シミュレーションと関係なく計算できるもの）
const propertyTable = STATIONS.flatMap((st, idx) =>
  (STATION_PROPERTIES[st] ?? []).map((p) => {
    const inc = Math.floor(p.price * (p.rate / 100));
    return {
      station: st,
      stationIndex: idx,
      name: p.name,
      type: p.type,
      price: p.price,
      rate: p.rate,
      incomePerSettlement: inc,
      // 上限の 80% で落札した場合：資産は上限額で数えられるので、買った瞬間の資産の増え方
      instantAssetGainAt80: p.type === 'limit' ? Math.round(p.price * 0.2) : 0,
    };
  }),
);

mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
writeFileSync(new URL('./out/result.json', import.meta.url), JSON.stringify({ assumptions: { TRAVEL_MIN_PER_STATION, OVERHEAD_MIN_PER_TURN, FIRST_DEST_MISS_RATE, TREAT_COST, LOTTERY }, results, propertyTable }, null, 2));
console.log('→ tools/sim/out/result.json');
