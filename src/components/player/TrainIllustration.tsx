import { motion } from 'framer-motion';

/**
 * プレイヤーの電車のイラスト（オリジナル。SVG）
 * 平らな塗りのシンプルな横向きの通勤電車。屋根・上下の色帯・2 つの両開きドア・青い窓・黒い床下。
 * 帯の色でプレイヤーを見分ける（今回の路線＝京王線の車両の配色をイメージ。ロゴなし）。
 * - 少し上下に揺れ、まくら木が流れて走っているように見せる
 * - bombyType を渡すと、貧乏神が憑いているエフェクト（暗い雲と雨・もや）を電車に付ける
 */
type Props = {
  /** 帯の色（プレイヤーの色） */
  color: string;
  /** 細い帯の色 */
  accent: string;
  bombyType?: string | null;
  running?: boolean;
};

/** 青い窓（斜めの光の筋つき） */
const Win = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={1.5} fill="#3d8fd9" />
    <path d={`M${x} ${y + h * 0.55} L${x + w} ${y + h * 0.2} L${x + w} ${y + h * 0.45} L${x} ${y + h * 0.8} Z`} fill="#6fb2ee" />
  </g>
);

/** 両開きのドア（2 枚のドアに縦長の窓） */
const Door = ({ x }: { x: number }) => (
  <g>
    <rect x={x} y={20} width={26} height={46} fill="#dcdcde" stroke="#a9a9ad" strokeWidth={1} />
    <line x1={x + 13} y1={20} x2={x + 13} y2={66} stroke="#a9a9ad" strokeWidth={1} />
    <Win x={x + 3} y={24} w={7} h={20} />
    <Win x={x + 16} y={24} w={7} h={20} />
  </g>
);

const Wheel = ({ cx, spin }: { cx: number; spin: boolean }) => (
  <motion.g
    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
    animate={spin ? { rotate: 360 } : undefined}
    transition={spin ? { repeat: Infinity, ease: 'linear', duration: 0.6 } : undefined}
  >
    <circle cx={cx} cy={77} r={6} fill="#1e1e1e" />
    <circle cx={cx} cy={73.5} r={1.3} fill="#9a9a9a" />
  </motion.g>
);

export const TrainIllustration = ({ color, accent, bombyType = null, running = true }: Props) => (
  // 電車は高さで大きさを決める（画面の幅が狭くても上のタブにかからない）
  <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: '100%', height: bombyType ? 132 : 118, paddingBottom: 4, boxSizing: 'border-box' }}>
    {bombyType && <BombyAura type={bombyType} />}
    <motion.svg
      viewBox="0 0 200 92"
      style={{ height: 92, width: 'auto', maxWidth: '92%', overflow: 'visible', position: 'relative', zIndex: 1 }}
      // キングボンビーのときは、ガタガタ揺れる
      animate={running ? (bombyType === 'king' ? { y: [0, -1.5, 0, -1, 0], x: [0, -1.5, 1.5, -1, 0] } : { y: [0, -1, 0] }) : undefined}
      transition={running ? { repeat: Infinity, duration: bombyType === 'king' ? 0.25 : 0.35, ease: 'easeInOut' } : undefined}
    >
      {/* 屋根と屋根の上の機器 */}
      <rect x={30} y={2} width={36} height={6} rx={2} fill="#b9bcc0" />
      <rect x={124} y={2} width={36} height={6} rx={2} fill="#b9bcc0" />
      <rect x={4} y={7} width={186} height={8} rx={4} fill="#a7abb0" />

      {/* 車体 */}
      <rect x={4} y={12} width={186} height={58} rx={3} fill="#ececee" />
      {/* 上の帯 */}
      <rect x={4} y={14} width={186} height={4} fill={color} />
      {/* 下の帯（ドアのところで切れる） */}
      <rect x={4} y={48} width={186} height={7} fill={color} />
      <rect x={4} y={55.5} width={186} height={2} fill={accent} />

      {/* 窓 */}
      <Win x={10} y={24} w={10} h={18} />
      <Win x={58} y={24} w={20} h={18} />
      <Win x={82} y={24} w={20} h={18} />
      <Win x={106} y={24} w={20} h={18} />
      <Win x={174} y={24} w={10} h={18} />
      {/* ドア */}
      <Door x={26} />
      <Door x={140} />

      {/* 車体の端（連結面） */}
      <rect x={190} y={16} width={4} height={50} rx={1} fill="#1e1e1e" />

      {/* 床下 */}
      <rect x={6} y={69} width={182} height={4} fill="#1e1e1e" />
      <rect x={70} y={72} width={14} height={5} fill="#1e1e1e" />
      <rect x={90} y={72} width={22} height={5} fill="#1e1e1e" />
      <rect x={116} y={72} width={10} height={5} fill="#1e1e1e" />
      <Wheel cx={22} spin={running} />
      <Wheel cx={44} spin={running} />
      <Wheel cx={150} spin={running} />
      <Wheel cx={172} spin={running} />

      {/* 線路（まくら木が流れる） */}
      <rect x={-6} y={84} width={212} height={2.5} fill="#7f8c8d" />
      <motion.g animate={running ? { x: [0, -16] } : undefined} transition={running ? { repeat: Infinity, ease: 'linear', duration: 0.4 } : undefined}>
        {Array.from({ length: 15 }, (_, i) => (
          <rect key={i} x={-6 + i * 16} y={86.5} width={8} height={2.5} fill="#a1887f" />
        ))}
      </motion.g>
    </motion.svg>
  </div>
);

/**
 * 貧乏神が憑いているエフェクト。電車の上に雲と雨、まわりにもや。
 * normal：紫がかった灰色の雲と雨／petit：小さいピンクの雲と小雨／king：赤黒い雷雲・稲妻・赤いもや
 */
const AURA = {
  normal: { cloud: '#6c5b7b', cloudDark: '#4a3f57', haze: 'rgba(120, 80, 160, 0.35)', rain: '#9fa8da', drops: 7, scale: 1 },
  petit: { cloud: '#f8a5c2', cloudDark: '#e77fa6', haze: 'rgba(248, 165, 194, 0.35)', rain: '#ffc1dc', drops: 4, scale: 0.7 },
  king: { cloud: '#3d1f2b', cloudDark: '#1e0d14', haze: 'rgba(220, 40, 40, 0.38)', rain: '#ff8a80', drops: 9, scale: 1.2 },
};

const BombyAura = ({ type }: { type: string }) => {
  const a = AURA[(type === 'king' || type === 'petit' ? type : 'normal') as keyof typeof AURA];
  const isKing = type === 'king';
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* 電車のまわりのもや（ゆっくり明るさが変わる） */}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.97, 1.03, 0.97] }}
        transition={{ repeat: Infinity, duration: isKing ? 0.9 : 2.2 }}
        style={{ position: 'absolute', left: '6%', right: '6%', bottom: 4, height: 96, borderRadius: '50%', background: `radial-gradient(ellipse, ${a.haze} 0%, transparent 70%)`, filter: 'blur(4px)' }}
      />
      {/* 雲と雨（電車の上で左右にゆらゆら） */}
      <motion.svg
        viewBox="0 0 120 60"
        width={120 * a.scale}
        height={60 * a.scale}
        animate={{ x: [-8, 8, -8] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: 0, left: '50%', marginLeft: (-60 * a.scale), zIndex: 2, overflow: 'visible' }}
      >
        {/* 雨 */}
        {Array.from({ length: a.drops }, (_, i) => (
          <motion.line
            key={i}
            x1={22 + (i * 76) / Math.max(1, a.drops - 1)}
            x2={18 + (i * 76) / Math.max(1, a.drops - 1)}
            y1={34}
            y2={42}
            stroke={a.rain}
            strokeWidth={2}
            strokeLinecap="round"
            animate={{ y: [0, 22], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: (i % 3) * 0.25 }}
          />
        ))}
        {/* 雲 */}
        <g>
          <ellipse cx={60} cy={30} rx={46} ry={13} fill={a.cloudDark} />
          <circle cx={38} cy={24} r={15} fill={a.cloud} />
          <circle cx={60} cy={17} r={19} fill={a.cloud} />
          <circle cx={83} cy={24} r={14} fill={a.cloud} />
          <ellipse cx={60} cy={28} rx={42} ry={10} fill={a.cloud} />
          {/* 困った顔 */}
          <path d="M50 22 q3 2 6 0 M64 22 q3 2 6 0" stroke="#fff" strokeWidth={1.8} fill="none" strokeLinecap="round" opacity={0.85} />
          <path d="M55 30 q5 -3 10 0" stroke="#fff" strokeWidth={1.8} fill="none" strokeLinecap="round" opacity={0.85} />
        </g>
        {/* キング：稲妻 */}
        {isKing && (
          <motion.path
            d="M66 36 L56 50 L63 50 L54 64 L72 46 L64 46 L72 36 Z"
            fill="#ffe066"
            stroke="#ff9f1a"
            strokeWidth={1}
            animate={{ opacity: [0, 0, 1, 0, 1, 0, 0] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
          />
        )}
      </motion.svg>
    </div>
  );
};
