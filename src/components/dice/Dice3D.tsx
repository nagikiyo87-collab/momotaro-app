import { useEffect, useLayoutEffect, useRef } from 'react';
import { DiceScene, type DiceMode } from './diceScene';

/**
 * 3D サイコロ（three.js ＋ 物理演算）。置いた場所いっぱいに盤とサイコロを描く
 * - values：出す目（1〜6）。2 個振りなら [3, 5]。出目は呼び出し側で先に決める
 *   （通信対戦では、振った側が決めた出目を相手に送り、両方の端末で同じ目に止める）
 * - rollId：この数字が変わるたびに投げる。0 のときは投げずに置いておく
 * - seed：同じ数字を渡すと同じ転がり方になる（通信対戦で動きまでそろえたいとき用）
 */
type Props = {
  values: number[];
  rollId: number;
  sound?: boolean;
  seed?: number;
  /** tray：緑の盤の上 ／ stage：画面いっぱいに大きく（最初に作るときだけ有効） */
  mode?: DiceMode;
  onLanded?: () => void;
};

export const Dice3D = ({ values, rollId, sound = true, seed, mode = 'stage', onLanded }: Props) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<DiceScene | null>(null);
  const latest = useRef({ values, sound, seed, onLanded });
  useLayoutEffect(() => {
    latest.current = { values, sound, seed, onLanded };
  });

  // 盤を作る（画面から消えたら片付ける）
  useEffect(() => {
    if (!hostRef.current) return;
    const scene = new DiceScene(hostRef.current, { mode });
    scene.setRest(latest.current.values);
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
    // mode は作るときだけ使う
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 投げる
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || rollId === 0) return;
    let cancelled = false;
    const { values: v, sound: s, seed: sd } = latest.current;
    void scene.roll(v, { sound: s, seed: sd }).then(() => {
      if (!cancelled) latest.current.onLanded?.();
    });
    return () => {
      cancelled = true;
    };
  }, [rollId]);

  // 投げていないときに個数や目が変わったら置き直す
  const valuesKey = values.join(',');
  useEffect(() => {
    if (rollId === 0) sceneRef.current?.setRest(latest.current.values);
  }, [valuesKey, rollId]);

  return <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />;
};
