import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { STATIONS, STATION_PROPERTIES, SQUARE_STYLE, type SquareType } from '../../data/gameData';

/**
 * 路線マップ（すごろくの盤のようなデザイン）
 * - 駅を 1 行 4 つずつ、行ごとに折り返して並べ、線路でつなぐ
 * - 駅のマスはマスの色（青・赤・協力・アイテム）とアイコン
 * - 今いる駅に電車のマーク、次に止まる可能性がある駅は光る、通り過ぎた駅は灰色
 * - 駅で物件を持っていたら、持ち主の色の家マーク
 * - 開いたら今いる駅まで自動でスクロール
 */
type Props = {
  sharedPosition: number;
  squares: SquareType[];
  maxMove: number;
  myPropertyIds: string[];
  opPropertyIds: string[];
  myColor: string;
  opColor: string;
};

const COLS = 4;
const ROW_H = 104; // 1 行の高さ（px）
const TILE = 52; // マスの大きさ（px）

const ICON: Record<SquareType, string> = { blue: '💰', red: '⚠️', green: '🤝', yellow: '🎁' };

/** i 番目の駅の位置（列・行）。偶数行は左→右、奇数行は右→左（すごろくの折り返し） */
const cellOf = (i: number) => {
  const row = Math.floor(i / COLS);
  const k = i % COLS;
  const col = row % 2 === 0 ? k : COLS - 1 - k;
  return { row, col };
};
/** マスの中心（横は %、縦は px） */
const centerOf = (i: number) => {
  const { row, col } = cellOf(i);
  return { x: (col + 0.5) * (100 / COLS), y: row * ROW_H + 40 };
};

/** 線路（枕木の模様つきの棒） */
const Rail = ({ from, to }: { from: number; to: number }) => {
  const a = centerOf(from);
  const b = centerOf(to);
  const sameRow = a.y === b.y;
  const style: React.CSSProperties = sameRow
    ? {
        left: `${Math.min(a.x, b.x)}%`,
        width: `${Math.abs(a.x - b.x)}%`,
        top: a.y - 5,
        height: 10,
        background: 'repeating-linear-gradient(90deg, #8d6e63 0 4px, transparent 4px 12px), linear-gradient(#90a4ae, #90a4ae)',
        backgroundSize: 'auto, 100% 3px',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'repeat, no-repeat',
      }
    : {
        left: `calc(${a.x}% - 5px)`,
        width: 10,
        top: a.y,
        height: b.y - a.y,
        background: 'repeating-linear-gradient(180deg, #8d6e63 0 4px, transparent 4px 12px), linear-gradient(90deg, #90a4ae, #90a4ae)',
        backgroundSize: 'auto, 3px 100%',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'repeat, no-repeat',
      };
  return <div style={{ position: 'absolute', borderRadius: 4, ...style }} />;
};

export const RouteMap = ({ sharedPosition, squares, maxMove, myPropertyIds, opPropertyIds, myColor, opColor }: Props) => {
  const hereRef = useRef<HTMLDivElement>(null);
  const rows = Math.ceil(STATIONS.length / COLS);
  const goal = STATIONS.length - 1;

  // 開いたら今いる駅まで自動でスクロール
  useEffect(() => {
    hereRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [sharedPosition]);

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        padding: '16px 10px 24px',
        borderRadius: 20,
        border: '4px solid #badc58',
        background: 'radial-gradient(circle at 20% 10%, #f1f9df 0%, #dff0c4 45%, #cfe8b0 100%)',
        position: 'relative',
      }}
    >
      {/* 見出しと凡例 */}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <span style={{ background: '#fff', padding: '8px 16px', borderRadius: 999, fontWeight: 900, color: '#27ae60', border: '3px solid #27ae60', fontSize: '1rem', boxShadow: '0 4px 0 rgba(39,174,96,0.3)' }}>
          📍 {STATIONS[sharedPosition]}　ゴールまであと {goal - sharedPosition} 駅
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 10px', margin: '12px 0 4px', fontSize: '0.75rem', fontWeight: 800, color: '#2c3e50' }}>
        {(Object.keys(SQUARE_STYLE) as SquareType[]).map((t) => (
          <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: SQUARE_STYLE[t].color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>{ICON[t]}</span>
            {SQUARE_STYLE[t].label}
          </span>
        ))}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: myColor }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: opColor }} />
          物件の持ち主
        </span>
      </div>
      <p style={{ textAlign: 'center', margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 800, color: '#e67e22' }}>✨ 光っている駅：次に止まる可能性がある駅（{maxMove}マス先まで）</p>

      {/* 盤 */}
      <div style={{ position: 'relative', height: rows * ROW_H + 10 }}>
        {/* 線路 */}
        {STATIONS.slice(0, -1).map((_, i) => (
          <Rail key={`r${i}`} from={i} to={i + 1} />
        ))}

        {/* 駅のマス */}
        {STATIONS.map((name, i) => {
          const { x, y } = centerOf(i);
          const isHere = i === sharedPosition;
          const isPassed = i < sharedPosition;
          const isStart = i === 0;
          const isGoal = i === goal;
          const reachable = i > sharedPosition && i <= sharedPosition + maxMove;
          const sq = squares[i];
          const sqStyle = sq ? SQUARE_STYLE[sq] : null;
          const ids = (STATION_PROPERTIES[name] ?? []).map((p) => p.id);
          const mine = ids.filter((id) => myPropertyIds.includes(id)).length;
          const theirs = ids.filter((id) => opPropertyIds.includes(id)).length;
          const bg = isStart ? '#ffffff' : isGoal ? 'linear-gradient(135deg, #ffe082, #ffb300)' : isPassed ? '#cfd8dc' : sqStyle?.color ?? '#fff';

          return (
            <div
              key={name}
              ref={isHere ? hereRef : undefined}
              style={{ position: 'absolute', left: `${x}%`, top: y - TILE / 2, width: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: isHere ? 3 : 2 }}
            >
              <motion.div
                animate={reachable ? { boxShadow: ['0 0 0 3px #fff, 0 0 0 5px #f39c12', '0 0 0 3px #fff, 0 0 0 8px rgba(243,156,18,0.35)', '0 0 0 3px #fff, 0 0 0 5px #f39c12'] } : undefined}
                transition={reachable ? { repeat: Infinity, duration: 1.4 } : undefined}
                style={{
                  width: TILE,
                  height: TILE,
                  flexShrink: 0,
                  borderRadius: 14,
                  background: bg,
                  border: isHere ? '4px solid #f39c12' : '3px solid #fff',
                  boxShadow: reachable ? undefined : '0 4px 0 rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  // 通過した駅は灰色に（半透明にすると下の線路が透けるので、不透明のまま色だけ落とす）
                  filter: isPassed ? 'grayscale(0.7) brightness(1.05)' : undefined,
                  position: 'relative',
                }}
              >
                {isStart ? '🚩' : isGoal ? '🏁' : sq ? ICON[sq] : ''}
                {/* 物件の持ち主（家のマーク） */}
                {(mine > 0 || theirs > 0) && (
                  <div style={{ position: 'absolute', right: -8, top: -8, display: 'flex', gap: 2 }}>
                    {Array.from({ length: mine }, (_, k) => (
                      <span key={`m${k}`} style={{ width: 16, height: 16, borderRadius: '50%', background: myColor, border: '2px solid #fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏠</span>
                    ))}
                    {Array.from({ length: theirs }, (_, k) => (
                      <span key={`o${k}`} style={{ width: 16, height: 16, borderRadius: '50%', background: opColor, border: '2px solid #fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏠</span>
                    ))}
                  </div>
                )}
              </motion.div>
              {/* 今いる駅：電車のマーク */}
              {isHere && (
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 0.9 }}
                  style={{ position: 'absolute', top: -30, fontSize: 26, filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.3))' }}
                >
                  🚃
                </motion.div>
              )}
              {/* 駅名とマスの種類 */}
              <div
                style={{
                  marginTop: 4,
                  whiteSpace: 'nowrap',
                  fontSize: name.length > 5 ? '0.62rem' : '0.72rem',
                  fontWeight: 900,
                  color: isPassed ? '#78909c' : '#263238',
                  background: isHere ? '#fff3cd' : 'rgba(255,255,255,0.9)',
                  border: isHere ? '2px solid #f39c12' : '1px solid rgba(0,0,0,0.06)',
                  padding: '1px 6px',
                  borderRadius: 8,
                }}
              >
                {name}
              </div>
              {reachable && (
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#e67e22', marginTop: 1, whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.85)', borderRadius: 6, padding: '0 4px' }}>{i - sharedPosition}マス先</div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
