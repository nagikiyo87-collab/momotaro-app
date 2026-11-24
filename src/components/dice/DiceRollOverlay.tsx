import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Dice3D } from './Dice3D';
import { DiceResult } from './DiceResult';
import { STAGE_BACKGROUND, diceFormula } from './diceUtils';

/**
 * ゲーム画面の上に重ねる、画面いっぱいのサイコロ演出。
 * Firestore の部屋データの rollKey（振った回の番号）が変わったら、2 台とも同じ演出を再生する。
 * - values / bonus / seed は振った側が決めて部屋データに書いたもの（両方の端末で同じ値）
 * - 画面を開いた時点ですでに振られていた回（再読み込みなど）は再生しない
 */
type Props = {
  rollKey: number | null;
  values: number[] | null;
  bonus: number;
  seed?: number;
  sound?: boolean;
  /** 止まってから自動で閉じるまでの時間（ミリ秒） */
  autoCloseMs?: number;
};

export const DiceRollOverlay = ({ rollKey, values, bonus, seed, sound = true, autoCloseMs = 3000 }: Props) => {
  // 画面を開いた時点の回（これは再生しない）
  const [seenAtMount] = useState(rollKey);
  const [rollId, setRollId] = useState(0);
  const [shown, setShown] = useState<number[]>([1]);
  const [open, setOpen] = useState(false);
  const [landed, setLanded] = useState(false);

  // 新しい回を受け取ったら投げる（React の推奨に沿って、描画中に前回の値と比べて更新する）
  const [lastKey, setLastKey] = useState(rollKey);
  if (rollKey !== lastKey) {
    setLastKey(rollKey);
    if (rollKey !== null && rollKey !== seenAtMount && values && values.length > 0) {
      setShown(values);
      setLanded(false);
      setOpen(true);
      setRollId((n) => n + 1);
    }
  }

  // 止まってしばらくしたら自動で閉じる
  useEffect(() => {
    if (!landed || !open) return;
    const t = window.setTimeout(() => setOpen(false), autoCloseMs);
    return () => window.clearTimeout(t);
  }, [landed, open, autoCloseMs]);

  const total = shown.reduce((a, b) => a + b, 0) + bonus;

  return (
    <div
      onClick={() => {
        if (landed) setOpen(false);
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        visibility: open ? 'visible' : 'hidden',
        opacity: open ? 1 : 0,
        transition: 'opacity 0.2s',
        background: STAGE_BACKGROUND,
      }}
    >
      {/* WebGL を作り直さないよう、閉じても消さずに隠すだけ */}
      <Dice3D mode="stage" values={shown} rollId={rollId} seed={seed} sound={sound} onLanded={() => setLanded(true)} />
      <AnimatePresence>
        {landed && open && <DiceResult total={total} formula={diceFormula(shown, bonus)} rollId={rollId} />}
      </AnimatePresence>
    </div>
  );
};

export default DiceRollOverlay;
