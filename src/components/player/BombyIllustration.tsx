import { motion } from 'framer-motion';

/**
 * 貧乏神のイラスト（このアプリのオリジナルキャラクター。SVG）
 * ボロボロの衣を着て、空っぽのお財布を持ち、ふわふわ浮いて列車を追いかけてくる。
 * - normal：紫の衣
 * - petit ：小さくて丸い、ピンクの子分
 * - king  ：大きくて赤黒い衣、金の冠、怒り顔
 * 全体がふわふわ上下に揺れ、腕と衣のすそも動き続ける
 */
type Props = { type?: string; size?: number };

const PALETTE = {
  normal: { robe: '#8e7cc3', robeDark: '#5e4b8b', skin: '#f3e3c3', cheek: '#e8a598' },
  petit: { robe: '#f8a5c2', robeDark: '#e77fa6', skin: '#fff1dc', cheek: '#ff9eb5' },
  king: { robe: '#7b1e2b', robeDark: '#3d0d14', skin: '#e9d2a8', cheek: '#d9826f' },
};

export const BombyIllustration = ({ type = 'normal', size = 84 }: Props) => {
  const kind = (type === 'king' || type === 'petit' ? type : 'normal') as keyof typeof PALETTE;
  const c = PALETTE[kind];
  const isKing = kind === 'king';
  const isPetit = kind === 'petit';

  return (
    <motion.svg
      viewBox="0 0 100 110"
      width={size}
      height={size * 1.1}
      style={{ overflow: 'visible', filter: 'drop-shadow(0 6px 5px rgba(0,0,0,0.22))' }}
      // 全体：ふわふわ浮きながら、列車を追いかけるように少し前後する
      animate={{ y: [0, -9, 0, -4, 0], x: [0, 5, 0, -3, 0], rotate: [-4, 3, -2, 4, -4] }}
      transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
    >
      {/* キングのオーラ */}
      {isKing && (
        <motion.ellipse
          cx={50}
          cy={60}
          rx={46}
          ry={50}
          fill="#ff4d4d"
          opacity={0.18}
          animate={{ opacity: [0.1, 0.3, 0.1], scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      )}

      {/* 衣（すそはギザギザ。ひらひら動く） */}
      <motion.path
        d={
          isPetit
            ? 'M30 52 Q50 40 70 52 L74 88 L66 82 L58 90 L50 82 L42 90 L34 82 L26 88 Z'
            : 'M26 50 Q50 36 74 50 L80 96 L70 88 L62 100 L52 90 L42 100 L32 88 L20 96 Z'
        }
        fill={c.robe}
        stroke={c.robeDark}
        strokeWidth={2.5}
        strokeLinejoin="round"
        animate={{ skewX: [0, 6, 0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'top' }}
      />
      {/* つぎはぎ */}
      <rect x={56} y={68} width={10} height={9} rx={1.5} fill={c.robeDark} opacity={0.55} transform="rotate(12 61 72)" />
      <path d="M57 70 l8 6 M64 69 l-6 7" stroke="#fff" strokeWidth={1} opacity={0.6} />

      {/* 左腕（お財布を持つ） */}
      <motion.g
        animate={{ rotate: [10, -15, 10] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'right center' }}
      >
        <path d="M30 60 Q18 62 12 54" stroke={c.robeDark} strokeWidth={6} strokeLinecap="round" fill="none" />
        {/* 空っぽのお財布（ガマ口） */}
        <rect x={2} y={44} width={16} height={12} rx={4} fill="#c8a165" stroke="#7a5a2b" strokeWidth={1.5} />
        <circle cx={7} cy={44} r={2} fill="#f1c40f" />
        <circle cx={13} cy={44} r={2} fill="#f1c40f" />
        {/* 飛んでいくハエ（お金がない印） */}
        <motion.text x={-2} y={38} fontSize={9} animate={{ x: [-2, -10, -4], y: [38, 30, 26], opacity: [1, 1, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          ·
        </motion.text>
      </motion.g>
      {/* 右腕（おいでおいで） */}
      <motion.path
        d="M70 60 Q84 58 88 48"
        stroke={c.robeDark}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
        animate={{ rotate: [-10, 20, -10] }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'left center' }}
      />

      {/* 頭 */}
      <ellipse cx={50} cy={isPetit ? 36 : 32} rx={isPetit ? 17 : 19} ry={isPetit ? 16 : 18} fill={c.skin} stroke="#8d6e4a" strokeWidth={2} />
      {/* ちょろっと毛 */}
      {!isKing && <path d={isPetit ? 'M48 20 q2 -8 6 -4' : 'M46 14 q3 -10 9 -5 M52 14 q4 -8 8 -2'} stroke="#555" strokeWidth={2} fill="none" strokeLinecap="round" />}
      {/* キングの冠 */}
      {isKing && (
        <path d="M33 18 L36 4 L44 13 L50 1 L56 13 L64 4 L67 18 Z" fill="#f6c343" stroke="#9c7412" strokeWidth={2} strokeLinejoin="round" />
      )}
      {/* 眉・目 */}
      {isKing ? (
        <>
          <path d="M38 26 l9 4 M62 26 l-9 4" stroke="#3d0d14" strokeWidth={3} strokeLinecap="round" />
          <circle cx={43} cy={33} r={3.2} fill="#222" />
          <circle cx={57} cy={33} r={3.2} fill="#222" />
          <path d="M42 44 q8 -6 16 0" stroke="#3d0d14" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </>
      ) : isPetit ? (
        <>
          <circle cx={44} cy={36} r={3} fill="#222" />
          <circle cx={56} cy={36} r={3} fill="#222" />
          <circle cx={45} cy={35} r={1} fill="#fff" />
          <circle cx={57} cy={35} r={1} fill="#fff" />
          <path d="M45 43 q5 4 10 0" stroke="#7a3b3b" strokeWidth={2} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M38 26 q5 -3 9 0 M53 26 q5 -3 9 0" stroke="#555" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M39 32 q4 3 8 0 M53 32 q4 3 8 0" stroke="#222" strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M44 42 q6 -4 12 0" stroke="#7a3b3b" strokeWidth={2} fill="none" strokeLinecap="round" />
          {/* 汗 */}
          <motion.path
            d="M68 26 q3 5 0 7 q-3 -2 0 -7z"
            fill="#74b9ff"
            animate={{ y: [0, 6, 0], opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
          />
        </>
      )}
      {/* ほっぺ */}
      <ellipse cx={39} cy={39} rx={3.5} ry={2} fill={c.cheek} opacity={0.7} />
      <ellipse cx={61} cy={39} rx={3.5} ry={2} fill={c.cheek} opacity={0.7} />
    </motion.svg>
  );
};
