import { motion } from 'framer-motion';

/**
 * プレイヤーの汽車のイラスト（オリジナル。SVG で描くので軽く、拡大してもきれい）
 * - color：車体の色（プレイヤーごと）
 * - 車輪が回り、煙突から煙が出る。少しだけ上下に揺れて走っているように見せる
 * - bombyImage を渡すと、汽車の後ろに貧乏神がついてきて、ずっとふわふわ動く
 */
type Props = {
  color: string;
  darkColor: string;
  bombyImage?: string | null;
  bombyType?: string;
  running?: boolean;
};

const Wheel = ({ cx, cy, r, spin }: { cx: number; cy: number; r: number; spin: boolean }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#2d3436" />
    <circle cx={cx} cy={cy} r={r * 0.78} fill="#dfe6e9" />
    {/* SVG の中で回すときは transformBox: fill-box にしないと、回転の中心がずれて飛んでいく */}
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      animate={spin ? { rotate: 360 } : { rotate: 0 }}
      transition={spin ? { repeat: Infinity, ease: 'linear', duration: 1.2 } : undefined}
    >
      {[0, 60, 120].map((deg) => (
        <rect key={deg} x={cx - r * 0.72} y={cy - 1.6} width={r * 1.44} height={3.2} rx={1.6} fill="#636e72" transform={`rotate(${deg} ${cx} ${cy})`} />
      ))}
    </motion.g>
    <circle cx={cx} cy={cy} r={r * 0.22} fill="#fdcb6e" stroke="#2d3436" strokeWidth={1.5} />
  </g>
);

const Smoke = ({ delay }: { delay: number }) => (
  <motion.circle
    cx={176}
    cy={22}
    r={7}
    fill="#ffffff"
    stroke="#dfe6e9"
    strokeWidth={2}
    initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
    animate={{ opacity: [0, 0.95, 0], scale: [0.4, 1.2, 1.8], x: [0, -10, -26], y: [0, -14, -26] }}
    transition={{ repeat: Infinity, duration: 2.2, delay, ease: 'easeOut' }}
  />
);

export const TrainIllustration = ({ color, darkColor, bombyImage, bombyType = 'normal', running = true }: Props) => {
  // キングは大きく、プチは小さく
  const bombySize = bombyType === 'king' ? 92 : bombyType === 'petit' ? 58 : 76;
  return (
    <div style={{ position: 'relative', width: '100%', height: 150 }}>
      {/* 貧乏神：汽車の後ろ（左）について、ふわふわ上下＋左右に揺れる */}
      {bombyImage && (
        <motion.img
          src={bombyImage}
          alt="貧乏神"
          draggable={false}
          style={{
            position: 'absolute',
            left: '4%',
            bottom: 40,
            width: bombySize,
            height: bombySize,
            objectFit: 'contain',
            zIndex: 0,
            filter: 'drop-shadow(0 6px 6px rgba(0,0,0,0.25))',
            pointerEvents: 'none',
          }}
          animate={{ y: [0, -12, 0, -6, 0], rotate: [-6, 5, -3, 6, -6], x: [0, 4, 0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
        />
      )}

      <motion.svg
        viewBox="0 0 240 140"
        style={{ position: 'absolute', right: '2%', bottom: 0, width: '78%', height: 'auto', zIndex: 1, overflow: 'visible' }}
        animate={running ? { y: [0, -2, 0] } : undefined}
        transition={running ? { repeat: Infinity, duration: 0.45, ease: 'easeInOut' } : undefined}
      >
        {/* 煙 */}
        {running && [0, 0.7, 1.4].map((d) => <Smoke key={d} delay={d} />)}

        {/* 線路 */}
        <rect x={0} y={128} width={240} height={5} rx={2.5} fill="#b2bec3" />

        {/* 炭水車（後ろの車両） */}
        <rect x={6} y={66} width={58} height={44} rx={10} fill={color} stroke={darkColor} strokeWidth={3} />
        <rect x={12} y={58} width={46} height={14} rx={6} fill="#2d3436" />
        <circle cx={22} cy={60} r={6} fill="#2d3436" />
        <circle cx={36} cy={57} r={7} fill="#2d3436" />
        <circle cx={50} cy={60} r={6} fill="#2d3436" />
        <rect x={14} y={80} width={42} height={6} rx={3} fill="#ffffff" opacity={0.85} />
        <Wheel cx={22} cy={116} r={11} spin={running} />
        <Wheel cx={50} cy={116} r={11} spin={running} />
        {/* 連結器 */}
        <rect x={62} y={100} width={12} height={6} rx={3} fill="#636e72" />

        {/* 運転室 */}
        <rect x={70} y={40} width={50} height={70} rx={10} fill={color} stroke={darkColor} strokeWidth={3} />
        <rect x={64} y={32} width={62} height={12} rx={6} fill={darkColor} />
        <rect x={80} y={50} width={30} height={24} rx={6} fill="#dff9fb" stroke="#ffffff" strokeWidth={3} />
        <rect x={78} y={84} width={34} height={6} rx={3} fill="#ffffff" opacity={0.85} />

        {/* ボイラー（丸い胴） */}
        <rect x={116} y={58} width={88} height={52} rx={24} fill={color} stroke={darkColor} strokeWidth={3} />
        <rect x={124} y={66} width={40} height={8} rx={4} fill="#ffffff" opacity={0.35} />
        {/* 帯 */}
        <rect x={140} y={58} width={7} height={52} fill="#fdcb6e" />
        <rect x={172} y={58} width={7} height={52} fill="#fdcb6e" />
        {/* 正面 */}
        <circle cx={204} cy={84} r={22} fill={darkColor} />
        <circle cx={204} cy={84} r={16} fill={color} stroke="#ffffff" strokeWidth={3} />
        <path d="M204 74 l3 6.5 7 0.8 -5.2 4.8 1.5 7 -6.3 -3.6 -6.3 3.6 1.5 -7 -5.2 -4.8 7 -0.8z" fill="#fdcb6e" />
        {/* 煙突 */}
        <rect x={168} y={30} width={16} height={30} rx={4} fill="#2d3436" />
        <rect x={163} y={24} width={26} height={10} rx={5} fill="#2d3436" />
        {/* 蒸気だめ */}
        <ellipse cx={150} cy={58} rx={10} ry={8} fill="#fdcb6e" stroke={darkColor} strokeWidth={2} />
        {/* ライト */}
        <circle cx={222} cy={66} r={7} fill="#ffeaa7" stroke="#2d3436" strokeWidth={2} />
        {/* 排障器 */}
        <path d="M206 110 L232 110 L238 126 L206 126 Z" fill="#636e72" />
        <path d="M212 112 L216 124 M220 112 L224 124 M228 112 L232 124" stroke="#b2bec3" strokeWidth={2} />

        {/* 動輪 */}
        <Wheel cx={92} cy={112} r={15} spin={running} />
        <Wheel cx={134} cy={112} r={15} spin={running} />
        <Wheel cx={176} cy={112} r={15} spin={running} />
        {/* 連結棒 */}
        {/* 連結棒は車輪に合わせて円を描くように動かす（rect の x・y は framer-motion では位置ずらしになるので g ごと動かす） */}
        <motion.g
          animate={running ? { x: [0, 4, 0, -4, 0], y: [0, -5, 0, 5, 0] } : undefined}
          transition={running ? { repeat: Infinity, duration: 1.2, ease: 'linear' } : undefined}
        >
          <rect x={88} y={110} width={94} height={5} rx={2.5} fill="#b2bec3" stroke="#636e72" strokeWidth={1} />
        </motion.g>
      </motion.svg>
    </div>
  );
};
