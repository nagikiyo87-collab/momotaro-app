import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dice3D } from '../components/dice/Dice3D';

// サイコロのお試し画面（URL に ?lab=dice を付けて開く）
type Mode = 'single' | 'double' | 'plus2';

const MODES: { id: Mode; label: string }[] = [
  { id: 'single', label: '1個振り' },
  { id: 'double', label: '2個振り' },
  { id: 'plus2', label: '+2カード' },
];

const roll = () => Math.floor(Math.random() * 6) + 1;

const chip = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '10px 0',
  borderRadius: 999,
  border: 'none',
  fontWeight: 800,
  fontSize: '0.95rem',
  background: active ? '#ff4757' : 'rgba(255,255,255,0.9)',
  color: active ? '#fff' : '#57606f',
  boxShadow: active ? '0 3px 0 #c0392b' : '0 2px 0 rgba(0,0,0,0.12)',
  cursor: 'pointer',
});

export const DiceLab = () => {
  const [mode, setMode] = useState<Mode>('single');
  const [fixed, setFixed] = useState<number | null>(null);
  const [sound, setSound] = useState(true);
  const [values, setValues] = useState<number[]>([1]);
  const [rollId, setRollId] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [landed, setLanded] = useState(false);

  const changeMode = (m: Mode) => {
    if (rolling) return;
    setMode(m);
    setValues(m === 'double' ? [values[0] ?? 1, 1] : [values[0] ?? 1]);
    setLanded(false);
    setRollId(0); // 投げていない状態に戻して、新しい個数で置き直す
  };

  const handleRoll = () => {
    if (rolling) return;
    const first = fixed ?? roll();
    setValues(mode === 'double' ? [first, roll()] : [first]);
    setLanded(false);
    setRolling(true);
    setRollId((n) => n + 1);
  };

  const sum = values.reduce((a, b) => a + b, 0);
  const bonus = mode === 'plus2' ? 2 : 0;
  const total = sum + bonus;
  const formula =
    mode === 'double' ? `${values[0]} ＋ ${values[1]}` : mode === 'plus2' ? `${values[0]} ＋ 2` : null;

  return (
    <div
      style={{
        minHeight: '100dvh',
        boxSizing: 'border-box',
        padding: 'max(16px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom))',
        background: 'linear-gradient(180deg, #ffe3ea 0%, #fff5f7 100%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: 'system-ui, -apple-system, "Hiragino Sans", sans-serif',
        userSelect: 'none',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ color: '#ff4757', fontWeight: 800, textDecoration: 'none' }}>
          ← タイトル
        </a>
        <h1 style={{ margin: 0, fontSize: '1.1rem', color: '#2f3542', fontWeight: 900 }}>🎲 サイコロ試作</h1>
        <button
          onClick={() => setSound((s) => !s)}
          style={{ border: 'none', background: 'none', fontSize: '1.3rem', cursor: 'pointer' }}
          aria-label={sound ? '音を消す' : '音を出す'}
        >
          {sound ? '🔊' : '🔇'}
        </button>
      </header>

      {/* 盤：木の枠＋フェルト */}
      <div
        style={{
          position: 'relative',
          height: 300,
          borderRadius: 22,
          padding: 12,
          background: 'linear-gradient(145deg, #a8743f, #6e4520)',
          boxShadow: '0 10px 24px rgba(110, 69, 32, 0.35), inset 0 2px 0 rgba(255,255,255,0.25)',
        }}
      >
        <div
          data-lab="tray"
          style={{
            position: 'relative',
            height: '100%',
            borderRadius: 14,
            overflow: 'hidden',
            background: 'radial-gradient(ellipse at 50% 40%, #2f8f5b 0%, #1d6b42 60%, #124a2d 100%)',
            boxShadow: 'inset 0 6px 18px rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Dice3D
            values={values}
            rollId={rollId}
            sound={sound}
            onLanded={() => {
              setRolling(false);
              setLanded(true);
            }}
          />
          {/* 盤の縁の陰（奥行きを出す） */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              boxShadow: 'inset 0 6px 18px rgba(0,0,0,0.5)',
              background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)',
            }}
          />
          <AnimatePresence>
            {landed && (
              <motion.div
                key={rollId}
                initial={{ opacity: 0, scale: 0.4, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 16 }}
                style={{
                  position: 'absolute',
                  bottom: 14,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  color: '#fff',
                  textShadow: '0 2px 6px rgba(0,0,0,0.5)',
                }}
              >
                {formula && <div style={{ fontSize: '0.95rem', fontWeight: 700, opacity: 0.9 }}>{formula}</div>}
                <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.1 }}>
                  {total}
                  <span style={{ fontSize: '1rem', marginLeft: 4 }}>マス進む</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <section style={{ display: 'flex', gap: 8 }}>
        {MODES.map((m) => (
          <button key={m.id} style={chip(mode === m.id)} onClick={() => changeMode(m.id)}>
            {m.label}
          </button>
        ))}
      </section>

      <section>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#747d8c', marginBottom: 6 }}>
          出目の指定（確認用。{mode === 'double' ? '1個目だけ' : 'ふだんは「ランダム」'}）
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[null, 1, 2, 3, 4, 5, 6].map((v) => (
            <button
              key={String(v)}
              style={{ ...chip(fixed === v), flex: v === null ? 2 : 1, fontSize: '0.85rem' }}
              onClick={() => setFixed(v)}
            >
              {v === null ? 'ランダム' : v}
            </button>
          ))}
        </div>
      </section>

      <motion.button
        whileTap={{ scale: 0.95, y: 4 }}
        onClick={handleRoll}
        disabled={rolling}
        style={{
          marginTop: 'auto',
          padding: '18px 0',
          borderRadius: 18,
          border: 'none',
          fontSize: '1.3rem',
          fontWeight: 900,
          letterSpacing: 2,
          color: '#fff',
          background: rolling ? '#ffa3ad' : 'linear-gradient(180deg, #ff6b81, #ff4757)',
          boxShadow: rolling ? 'none' : '0 6px 0 #c0392b',
          cursor: rolling ? 'default' : 'pointer',
        }}
      >
        {rolling ? 'コロコロ…' : 'サイコロを振る'}
      </motion.button>
    </div>
  );
};

export default DiceLab;
