import { motion } from 'framer-motion';

/** サイコロが止まったあとに出す、大きな出目の数字 */
export const DiceResult = ({
  total,
  formula,
  rollId,
  hint = 'タップで閉じる',
}: {
  total: number;
  formula: string | null;
  rollId: number;
  hint?: string;
}) => (
  <motion.div
    key={rollId}
    initial={{ opacity: 0, scale: 0.3, y: 30 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, transition: { duration: 0.1 } }}
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
    {hint && (
      <div style={{ marginTop: 18, color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', fontWeight: 700 }}>{hint}</div>
    )}
  </motion.div>
);

