import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dice3D } from '../components/dice/Dice3D';
import type { DiceMode } from '../components/dice/diceScene';

// サイコロのお試し画面（URL に ?lab=dice を付けて開く）
type Count = 'single' | 'double' | 'plus2';

const COUNTS: { id: Count; label: string }[] = [
  { id: 'single', label: '1個振り' },
  { id: 'double', label: '2個振り' },
  { id: 'plus2', label: '+2カード' },
];

const DISPLAYS: { id: DiceMode; label: string }[] = [
  { id: 'stage', label: '大きく（画面いっぱい）' },
  { id: 'tray', label: '盤の上' },
];

const roll = () => Math.floor(Math.random() * 6) + 1;

const chip = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '10px 0',
  borderRadius: 999,
  border: 'none',
  fontWeight: 800,
  fontSize: '0.9rem',
  background: active ? '#ff4757' : 'rgba(255,255,255,0.9)',
  color: active ? '#fff' : '#57606f',
  boxShadow: active ? '0 3px 0 #c0392b' : '0 2px 0 rgba(0,0,0,0.12)',
  cursor: 'pointer',
});

const label: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 700, color: '#747d8c', marginBottom: 6 };

/** 着地後の出目表示（ステージ用の大きな数字） */
const BigResult = ({ total, formula, rollId }: { total: number; formula: string | null; rollId: number }) => (
  <motion.div
    key={rollId}
    initial={{ opacity: 0, scale: 0.3, y: 30 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ type: 'spring', stiffness: 420, damping: 14 }}
    style={{ position: 'absolute', left: 0, right: 0, bottom: '13%', textAlign: 'center', pointerEvents: 'none' }}
  >
    {formula && (
      <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
        {formula}
      </div>
    )}
    <div
      style={{
        fontSize: '6.5rem',
        lineHeight: 1,
        fontWeight: 900,
        color: '#ffd23f',
        WebkitTextStroke: '4px #8a2c00',
        paintOrder: 'stroke fill',
        textShadow: '0 6px 0 #8a2c00, 0 12px 24px rgba(0,0,0,0.5)',
      }}
    >
      {total}
    </div>
    <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 900, textShadow: '0 2px 6px rgba(0,0,0,0.7)' }}>
      マス進む！
    </div>
    <div style={{ marginTop: 18, color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', fontWeight: 700 }}>
      タップで閉じる
    </div>
  </motion.div>
);

export const DiceLab = () => {
  const [display, setDisplay] = useState<DiceMode>('stage');
  const [count, setCount] = useState<Count>('single');
  const [fixed, setFixed] = useState<number | null>(null);
  const [sound, setSound] = useState(true);
  const [values, setValues] = useState<number[]>([1]);
  const [rollId, setRollId] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [landed, setLanded] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const reset = () => {
    setLanded(false);
    setRollId(0); // 投げていない状態に戻して、新しい個数で置き直す
  };

  const changeCount = (c: Count) => {
    if (rolling) return;
    setCount(c);
    setValues(c === 'double' ? [values[0] ?? 1, 1] : [values[0] ?? 1]);
    reset();
  };

  const changeDisplay = (d: DiceMode) => {
    if (rolling) return;
    setDisplay(d);
    reset();
  };

  const handleRoll = () => {
    if (rolling) return;
    const first = fixed ?? roll();
    setValues(count === 'double' ? [first, roll()] : [first]);
    setLanded(false);
    setRolling(true);
    if (display === 'stage') setOverlayOpen(true);
    setRollId((n) => n + 1);
  };

  const sum = values.reduce((a, b) => a + b, 0);
  const total = sum + (count === 'plus2' ? 2 : 0);
  const formula =
    count === 'double' ? `${values[0]} ＋ ${values[1]}` : count === 'plus2' ? `${values[0]} ＋ 2（カード）` : null;

  const onLanded = () => {
    setRolling(false);
    setLanded(true);
  };

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

      {display === 'tray' ? (
        /* 盤：木の枠＋フェルト */
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
            style={{ position: 'relative', height: '100%', borderRadius: 14, overflow: 'hidden', background: '#155a35' }}
          >
            <Dice3D key="tray" mode="tray" values={values} rollId={rollId} sound={sound} onLanded={onLanded} />
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
      ) : (
        /* ステージ表示の説明（実際のゲームではここに路線図などが表示されている想定） */
        <div
          style={{
            height: 300,
            borderRadius: 22,
            background: 'linear-gradient(160deg, #74b9ff, #a29bfe)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            textAlign: 'center',
            gap: 8,
            boxShadow: '0 10px 24px rgba(80, 80, 160, 0.25)',
          }}
        >
          <div style={{ fontSize: '2.4rem' }}>🚃</div>
          <div>（ゲーム画面のつもり）</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>振ると、この上にサイコロが大きく飛び出します</div>
        </div>
      )}

      <section>
        <div style={label}>表示のしかた</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {DISPLAYS.map((d) => (
            <button key={d.id} style={chip(display === d.id)} onClick={() => changeDisplay(d.id)}>
              {d.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div style={label}>振り方</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {COUNTS.map((c) => (
            <button key={c.id} style={chip(count === c.id)} onClick={() => changeCount(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div style={label}>出目の指定（確認用。{count === 'double' ? '1個目だけ' : 'ふだんは「ランダム」'}）</div>
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

      {/* ステージ表示：画面いっぱいに重ねる。WebGL を作り直さないよう、閉じても消さずに隠すだけ */}
      {display === 'stage' && (
        <div
          data-lab="stage"
          onClick={() => {
            if (landed) setOverlayOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            visibility: overlayOpen ? 'visible' : 'hidden',
            opacity: overlayOpen ? 1 : 0,
            transition: 'opacity 0.2s',
            background: 'radial-gradient(ellipse at 50% 42%, rgba(60,30,80,0.82) 0%, rgba(12,6,24,0.94) 70%)',
          }}
        >
          <Dice3D key="stage" mode="stage" values={values} rollId={rollId} sound={sound} onLanded={onLanded} />
          <AnimatePresence>
            {landed && overlayOpen && <BigResult total={total} formula={formula} rollId={rollId} />}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default DiceLab;
