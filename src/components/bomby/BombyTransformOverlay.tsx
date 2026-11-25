import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BOMBY_TRANSFORM_MS } from '../../data/gameData';

/**
 * 貧乏神の変身の演出（画面いっぱい）。以前使っていた画像（public/bomby-*.webp）を使う。
 * 部屋のデータの bombyTransform（{ from, to, key }）の key が変わったら、2 台とも再生する。
 * 画面を開いた時点ですでにあった変身（再読み込みなど）は再生しない。
 *
 * 流れ：変身前の姿が震える → 白く光る → 変身後の姿が飛び出す（後ろで光の線が回る）
 */
type Transform = { from: string; to: string; key: number } | null | undefined;

const IMAGE: Record<string, string> = {
  normal: '/bomby-normal.webp',
  petit: '/bomby-petit.webp',
  king: '/bomby-king.webp',
};

const AFTER_TEXT: Record<string, { title: string; line: string; color: string }> = {
  king: { title: 'キングボンビーに変身した！', line: '「グエッヘッヘ！これからお前に地獄を見せてやるのねん！」', color: '#ff3b3b' },
  petit: { title: 'プチボンビーに変身した！', line: '「ボク、プチボンビーなのねん！よろしくなのねん！」', color: '#ff8fc7' },
  normal: { title: '普通の貧乏神に戻った…', line: '「なんだか元に戻っちゃったのねん…」', color: '#b39ddb' },
};

export const BombyTransformOverlay = ({ transform }: { transform: Transform }) => {
  const [seenAtMount] = useState(transform?.key ?? null);
  const [lastKey, setLastKey] = useState(transform?.key ?? null);
  const [playing, setPlaying] = useState<{ from: string; to: string; key: number } | null>(null);
  const [stage, setStage] = useState<'before' | 'flash' | 'after'>('before');

  // 新しい変身を受け取ったら再生（描画中に前回の値と比べる）
  const key = transform?.key ?? null;
  if (key !== lastKey) {
    setLastKey(key);
    if (transform && key !== null && key !== seenAtMount) {
      setPlaying(transform);
      setStage('before');
    }
  }

  // 段階を進めて、最後に閉じる
  useEffect(() => {
    if (!playing) return;
    const t1 = window.setTimeout(() => setStage('flash'), 1300);
    const t2 = window.setTimeout(() => setStage('after'), 1700);
    const t3 = window.setTimeout(() => setPlaying(null), BOMBY_TRANSFORM_MS - 150);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [playing]);

  const after = playing ? AFTER_TEXT[playing.to] ?? AFTER_TEXT.normal : null;

  return (
    <AnimatePresence>
      {playing && after && (
        <motion.div
          key={playing.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setPlaying(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            background: 'radial-gradient(ellipse at 50% 45%, rgba(60,20,80,0.92) 0%, rgba(10,5,20,0.97) 75%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: 16,
          }}
        >
          <div style={{ position: 'relative', width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* 変身後：後ろで光の線が回る */}
            {stage === 'after' && (
              <motion.div
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 0.8, rotate: 360 }}
                transition={{ rotate: { repeat: Infinity, duration: 6, ease: 'linear' }, opacity: { duration: 0.3 } }}
                style={{
                  position: 'absolute',
                  width: 420,
                  height: 420,
                  background: `repeating-conic-gradient(${after.color}55 0deg 10deg, transparent 10deg 24deg)`,
                  borderRadius: '50%',
                  maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
                  WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
                }}
              />
            )}

            {stage !== 'after' ? (
              // 変身前：震えて、だんだん白っぽく
              <motion.img
                src={IMAGE[playing.from] ?? IMAGE.normal}
                alt="変身前の貧乏神"
                draggable={false}
                animate={{ x: [0, -8, 8, -6, 6, -10, 10, 0], rotate: [0, -4, 4, -3, 3, -5, 5, 0], filter: ['brightness(1)', 'brightness(1.6)'] }}
                transition={{ x: { repeat: Infinity, duration: 0.35 }, rotate: { repeat: Infinity, duration: 0.35 }, filter: { duration: 1.3 } }}
                style={{ width: 200, height: 200, objectFit: 'contain', position: 'relative' }}
              />
            ) : (
              // 変身後：飛び出してくる
              <motion.img
                src={IMAGE[playing.to] ?? IMAGE.normal}
                alt="変身後の貧乏神"
                draggable={false}
                initial={{ scale: 0.2, opacity: 0, rotate: -20 }}
                animate={{ scale: [0.2, 1.25, 1], opacity: 1, rotate: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                style={{ width: playing.to === 'king' ? 240 : playing.to === 'petit' ? 160 : 200, height: 220, objectFit: 'contain', position: 'relative', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}
              />
            )}
          </div>

          <AnimatePresence mode="wait">
            {stage === 'after' ? (
              <motion.div
                key="after"
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                style={{ textAlign: 'center', marginTop: 10 }}
              >
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: after.color, textShadow: '0 3px 0 #000' }}>{after.title}</div>
                <div style={{ marginTop: 8, color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>{after.line}</div>
              </motion.div>
            ) : (
              <motion.div key="before" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem', marginTop: 10 }}>
                …貧乏神の様子がおかしい！
              </motion.div>
            )}
          </AnimatePresence>

          {/* 白い光 */}
          <AnimatePresence>
            {stage === 'flash' && (
              <motion.div
                key="flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: 'absolute', inset: 0, background: '#fff' }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
