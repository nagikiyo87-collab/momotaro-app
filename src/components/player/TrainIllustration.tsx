import { motion } from 'framer-motion';
import { BombyIllustration } from './BombyIllustration';

/**
 * プレイヤーの電車のイラスト（オリジナル。SVG）
 * 平らな塗りのシンプルな横向きの通勤電車。屋根・上下の色帯・2 つの両開きドア・青い窓・黒い床下。
 * 帯の色でプレイヤーを見分ける（今回の路線＝京王線の車両の配色をイメージ。ロゴなし）。
 * - 少し上下に揺れ、まくら木が流れて走っているように見せる
 * - bombyType を渡すと、電車の後ろから貧乏神が追いかけてくる
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
  // 横に並べる：［貧乏神］［電車］。電車は高さで大きさを決める（画面の幅が狭くても上のタブにかからない）
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 2, width: '100%', height: 118, paddingBottom: 4, boxSizing: 'border-box' }}>
    {/* 貧乏神：電車の後ろ（左）から、全身で追いかけてくる */}
    {bombyType && (
      <div style={{ marginBottom: 12, pointerEvents: 'none', flexShrink: 0 }}>
        <BombyIllustration type={bombyType} size={bombyType === 'king' ? 64 : bombyType === 'petit' ? 42 : 54} />
      </div>
    )}
    <motion.svg
      viewBox="0 0 200 92"
      style={{ height: 92, width: 'auto', maxWidth: bombyType ? '74%' : '92%', overflow: 'visible' }}
      animate={running ? { y: [0, -1, 0] } : undefined}
      transition={running ? { repeat: Infinity, duration: 0.35, ease: 'easeInOut' } : undefined}
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
