import { motion } from 'framer-motion';
import { BombyIllustration } from './BombyIllustration';

/**
 * プレイヤーの電車のイラスト（オリジナル。SVG）
 * 今回の路線（京王線：新宿〜高尾山口）の通勤電車をイメージ。白い車体に色の帯、パンタグラフ、行先表示。
 * 会社のロゴやマークは入れない。帯の色でプレイヤーを見分ける。
 * - 車輪が回り、線路のまくら木が流れて、走っているように見せる
 * - bombyType を渡すと、電車の後ろから貧乏神が追いかけてくる
 */
type Props = {
  /** 太い帯の色（プレイヤーの色） */
  color: string;
  /** 細い帯の色 */
  accent: string;
  /** 行先表示 */
  destination?: string;
  bombyType?: string | null;
  running?: boolean;
};

const Wheel = ({ cx, cy, spin }: { cx: number; cy: number; spin: boolean }) => (
  <g>
    <circle cx={cx} cy={cy} r={6.5} fill="#2d3436" />
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      animate={spin ? { rotate: 360 } : undefined}
      transition={spin ? { repeat: Infinity, ease: 'linear', duration: 0.7 } : undefined}
    >
      <circle cx={cx} cy={cy} r={4.5} fill="#b2bec3" />
      <rect x={cx - 4.5} y={cy - 0.8} width={9} height={1.6} fill="#636e72" />
      <rect x={cx - 0.8} y={cy - 4.5} width={1.6} height={9} fill="#636e72" />
    </motion.g>
  </g>
);

const Bogie = ({ x, spin }: { x: number; spin: boolean }) => (
  <g>
    <rect x={x - 16} y={92} width={32} height={6} rx={2} fill="#4b5563" />
    <Wheel cx={x - 9} cy={100} spin={spin} />
    <Wheel cx={x + 9} cy={100} spin={spin} />
  </g>
);

export const TrainIllustration = ({ color, accent, destination = '高尾山口', bombyType = null, running = true }: Props) => {
  // 窓（車体の横に並ぶ）とドア
  const windows = [44, 82, 130, 168];
  const doors = [62, 110, 150];
  return (
    <div style={{ position: 'relative', width: '100%', height: 150 }}>
      {/* 貧乏神：電車の後ろ（左）から、全身で追いかけてくる */}
      {bombyType && (
        <div style={{ position: 'absolute', left: '1%', bottom: 22, zIndex: 2, pointerEvents: 'none' }}>
          <BombyIllustration type={bombyType} size={bombyType === 'king' ? 74 : bombyType === 'petit' ? 48 : 62} />
        </div>
      )}

      <motion.svg
        viewBox="0 0 260 112"
        style={{ position: 'absolute', right: 0, bottom: 6, width: bombyType ? '80%' : '94%', height: 'auto', zIndex: 1, overflow: 'visible', transition: 'width 0.3s' }}
        animate={running ? { y: [0, -1.2, 0] } : undefined}
        transition={running ? { repeat: Infinity, duration: 0.35, ease: 'easeInOut' } : undefined}
      >
        {/* 架線 */}
        <line x1={0} y1={6} x2={260} y2={6} stroke="#95a5a6" strokeWidth={1} />
        {/* パンタグラフ */}
        <g stroke="#4b5563" strokeWidth={1.8} fill="none" strokeLinejoin="round">
          <motion.path
            d="M96 22 L106 10 L116 22 M100 10 L112 10"
            animate={running ? { d: ['M96 22 L106 10 L116 22 M100 10 L112 10', 'M96 22 L106 9 L116 22 M100 9 L112 9', 'M96 22 L106 10 L116 22 M100 10 L112 10'] } : undefined}
            transition={{ repeat: Infinity, duration: 0.6 }}
          />
        </g>

        {/* 車体（白っぽいステンレス） */}
        <path
          d="M14 30 Q14 22 22 22 L214 22 Q230 22 240 34 L250 52 Q254 60 254 70 L254 84 Q254 90 248 90 L20 90 Q14 90 14 84 Z"
          fill="#f8f9fb"
          stroke="#aab4be"
          strokeWidth={2}
        />
        {/* 屋根 */}
        <path d="M22 22 L214 22 Q228 22 236 30 L20 30 Q16 30 16 27 Q17 22 22 22Z" fill="#dfe4ea" />

        {/* 側面の窓 */}
        {windows.map((x) => (
          <rect key={x} x={x} y={36} width={30} height={20} rx={3} fill="#cfe8ff" stroke="#8fa3b5" strokeWidth={1.2} />
        ))}
        {/* ドア */}
        {doors.map((x) => (
          <g key={x}>
            <rect x={x} y={32} width={16} height={56} rx={2} fill="#eef1f5" stroke="#9aa8b5" strokeWidth={1.2} />
            <rect x={x + 2.5} y={38} width={4.5} height={16} rx={1.5} fill="#cfe8ff" />
            <rect x={x + 9} y={38} width={4.5} height={16} rx={1.5} fill="#cfe8ff" />
          </g>
        ))}

        {/* 帯（プレイヤーの色） */}
        <rect x={15} y={62} width={226} height={7} fill={color} />
        <rect x={15} y={71} width={230} height={3} fill={accent} />

        {/* 前面：大きな窓・行先表示・ライト */}
        <path d="M218 30 Q230 30 238 40 L246 56 L218 56 Z" fill="#2d3e50" />
        <path d="M222 34 L234 34 L242 52 L222 52 Z" fill="#5d7a96" opacity={0.6} />
        <rect x={208} y={25} width={30} height={7} rx={1.5} fill="#1e272e" />
        <text x={223} y={30.6} fontSize={5.2} fill="#ffb142" textAnchor="middle" fontWeight={700} fontFamily="'Hiragino Sans', sans-serif">
          {destination}
        </text>
        <circle cx={248} cy={76} r={3.2} fill="#fff7d6" stroke="#9aa8b5" />
        <rect x={244} y={82} width={10} height={3} rx={1.5} fill="#e74c3c" opacity={0.8} />
        {/* スカート（床下のカバー） */}
        <path d="M236 90 L254 90 L250 96 L236 96 Z" fill="#636e72" />

        {/* 台車と車輪 */}
        <Bogie x={52} spin={running} />
        <Bogie x={200} spin={running} />

        {/* 線路（まくら木が流れて走っているように見える） */}
        <rect x={0} y={106} width={260} height={3} fill="#7f8c8d" />
        <motion.g animate={running ? { x: [0, -20] } : undefined} transition={running ? { repeat: Infinity, ease: 'linear', duration: 0.5 } : undefined}>
          {Array.from({ length: 15 }, (_, i) => (
            <rect key={i} x={i * 20} y={109} width={10} height={3} fill="#a1887f" />
          ))}
        </motion.g>
      </motion.svg>
    </div>
  );
};
