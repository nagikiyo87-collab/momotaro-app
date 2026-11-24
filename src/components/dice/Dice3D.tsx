import { useEffect, useLayoutEffect, useRef } from 'react';
import './dice.css';

/**
 * 3D サイコロ（CSS 3D ＋ Web Animations API）
 * - values：出す目（1〜6）。2 個振りなら [3, 5] のように渡す。出目は呼び出し側で先に決める
 *   （通信対戦では、振った側が決めた出目を相手に送り、両方の端末で同じ目に着地させるため）
 * - rollId：この数字が変わるたびに投げる。0 のときは投げずに静止表示
 */
type Props = {
  values: number[];
  rollId: number;
  size?: number;
  sound?: boolean;
  onLanded?: () => void;
};

// その面を正面に向けるための立方体の回転（rotateX, rotateY）
// 面の配置：正面=1、上=2、右=3、左=4、下=5、背面=6（向かい合う面の和が 7）
const FACE_ROT: Record<number, [number, number]> = {
  1: [0, 0],
  2: [-90, 0],
  3: [0, -90],
  4: [0, 90],
  5: [90, 0],
  6: [0, 180],
};

// 3×3 のマスのうち、目を置く位置（0〜8、左上から右へ）
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const FACES: { value: number; transform: (h: number) => string }[] = [
  { value: 1, transform: (h) => `translateZ(${h}px)` },
  { value: 6, transform: (h) => `rotateY(180deg) translateZ(${h}px)` },
  { value: 3, transform: (h) => `rotateY(90deg) translateZ(${h}px)` },
  { value: 4, transform: (h) => `rotateY(-90deg) translateZ(${h}px)` },
  { value: 2, transform: (h) => `rotateX(90deg) translateZ(${h}px)` },
  { value: 5, transform: (h) => `rotateX(-90deg) translateZ(${h}px)` },
];

// 着地したときに少しだけ斜めから見えるようにする固定の傾き
const VIEW_TILT = 'rotateX(-16deg) rotateY(22deg)';

const cubeTransform = (x: number, y: number, z: number) =>
  `${VIEW_TILT} rotateZ(${z}deg) rotateX(${x}deg) rotateY(${y}deg)`;

const restTransform = (value: number, z = 0) => {
  const [fx, fy] = FACE_ROT[value] ?? FACE_ROT[1];
  return cubeTransform(fx, fy, z);
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// 弾みの高さ（0〜1 の時間 → 床からの高さ px）。着地の瞬間も返す
const BOUNCES = [
  { start: 0, end: 0.36, peak: 1, fromTop: true },
  { start: 0.36, end: 0.6, peak: 0.32 },
  { start: 0.6, end: 0.75, peak: 0.1 },
  { start: 0.75, end: 0.83, peak: 0.03 },
];
const LANDINGS = BOUNCES.map((b) => b.end);

const heightAt = (t: number, h0: number) => {
  for (const b of BOUNCES) {
    if (t >= b.start && t <= b.end) {
      const u = (t - b.start) / (b.end - b.start);
      if (b.fromTop) return h0 * (1 - u * u); // 最初は上から落ちてくるだけ
      return h0 * b.peak * 4 * u * (1 - u); // 放物線
    }
  }
  return 0;
};

// 木の盤にサイコロが当たる「コツッ」という音を合成する
const playClack = (ctx: AudioContext, when: number, volume: number) => {
  const len = Math.floor(ctx.sampleRate * 0.05);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = rand(1800, 2600);
  band.Q.value = 1.4;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.connect(band).connect(gain).connect(ctx.destination);
  src.start(when);
};

let sharedAudio: AudioContext | null = null;
const getAudio = () => {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  if (!sharedAudio) sharedAudio = new AudioContext();
  if (sharedAudio.state === 'suspended') void sharedAudio.resume();
  return sharedAudio;
};

const Face = ({ value, transform }: { value: number; transform: string }) => (
  <div className={`dice-face dice-face-${value}`} style={{ transform }}>
    {Array.from({ length: 9 }, (_, i) => (
      <span key={i} className={PIPS[value].includes(i) ? 'dice-pip' : 'dice-pip-empty'} />
    ))}
  </div>
);

type DieRefs = { mover: HTMLDivElement | null; cube: HTMLDivElement | null; shadow: HTMLDivElement | null };

export const Dice3D = ({ values, rollId, size = 84, sound = true, onLanded }: Props) => {
  const refs = useRef<DieRefs[]>([]);
  const onLandedRef = useRef(onLanded);
  useLayoutEffect(() => {
    onLandedRef.current = onLanded;
  });

  useEffect(() => {
    if (rollId === 0) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animations: Animation[] = [];
    const timers: number[] = [];
    const audio = sound ? getAudio() : null;
    let longest = 0;

    values.forEach((value, i) => {
      const r = refs.current[i];
      if (!r?.mover || !r.cube || !r.shadow) return;

      const duration = reduced ? 250 : rand(1450, 1750);
      const delay = reduced ? 0 : i * rand(60, 140);
      longest = Math.max(longest, duration + delay);

      // 投げ始めの位置（画面の右下＝手元から）と高さ
      const x0 = rand(110, 170) * (i % 2 === 0 ? 1 : -0.6);
      const y0 = rand(150, 210);
      const h0 = rand(150, 200);

      // 回転：最後は指定の目が正面。途中は 2〜3 回転ずつ転がる
      const [fx, fy] = FACE_ROT[value];
      const endX = fx + 360 * pick([2, 3]) * pick([1, -1]);
      const endY = fy + 360 * pick([2, 3]) * pick([1, -1]);
      const endZ = rand(-12, 12);
      const startX = endX - pick([1, -1]) * rand(500, 800);
      const startY = endY - pick([1, -1]) * rand(500, 800);
      const startZ = endZ + rand(-200, 200);

      const STEPS = reduced ? 2 : 60;
      const moveFrames: Keyframe[] = [];
      const cubeFrames: Keyframe[] = [];
      const shadowFrames: Keyframe[] = [];
      for (let s = 0; s <= STEPS; s++) {
        const t = s / STEPS;
        const p = easeOutCubic(Math.min(t / 0.9, 1)); // 床の上の進み具合
        const gx = x0 * (1 - p);
        const gy = y0 * (1 - p);
        const h = reduced ? 0 : heightAt(t, h0);
        const rp = easeOutCubic(Math.min(t / 0.86, 1)); // 回転の進み具合
        moveFrames.push({ transform: `translate(${gx}px, ${gy - h}px) scale(${1 + h / 420})` });
        cubeFrames.push({
          transform: cubeTransform(
            startX + (endX - startX) * rp,
            startY + (endY - startY) * rp,
            startZ + (endZ - startZ) * rp,
          ),
        });
        shadowFrames.push({
          transform: `translate(${gx}px, ${gy}px) scale(${Math.max(0.45, 1 - h / 320)})`,
          opacity: Math.max(0.12, 0.5 - h / 450),
        });
      }

      const opts: KeyframeAnimationOptions = { duration, delay, easing: 'linear', fill: 'both' };
      animations.push(r.mover.animate(moveFrames, opts));
      animations.push(r.cube.animate(cubeFrames, opts));
      animations.push(r.shadow.animate(shadowFrames, opts));

      if (audio && !reduced) {
        LANDINGS.forEach((lt, k) => {
          playClack(audio, audio.currentTime + (delay + duration * lt) / 1000, 0.9 / (k + 1));
        });
      }
    });

    timers.push(window.setTimeout(() => onLandedRef.current?.(), longest + 30));

    return () => {
      animations.forEach((a) => a.cancel());
      timers.forEach((t) => window.clearTimeout(t));
    };
    // values は rollId と同時に変わる前提なので、rollId だけで投げ直す
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollId]);

  const half = size / 2;
  return (
    <div className="dice-row" style={{ gap: size * 0.5 }}>
      {values.map((value, i) => (
        <div key={i} className="dice-slot" style={{ width: size, height: size }}>
          <div
            className="dice-shadow"
            ref={(el) => {
              refs.current[i] = { ...refs.current[i], shadow: el };
            }}
          />
          <div
            className="dice-mover"
            style={{ perspective: size * 9 }}
            ref={(el) => {
              refs.current[i] = { ...refs.current[i], mover: el };
            }}
          >
            <div
              className="dice-cube"
              style={{ width: size, height: size, transform: restTransform(value) }}
              ref={(el) => {
                refs.current[i] = { ...refs.current[i], cube: el };
              }}
            >
              {/* 角を丸めたときにできるすき間を埋める芯 */}
              <div className="dice-core" style={{ transform: 'rotateY(90deg)' }} />
              <div className="dice-core" style={{ transform: 'rotateX(90deg)' }} />
              <div className="dice-core" />
              {FACES.map((f) => (
                <Face key={f.value} value={f.value} transform={f.transform(half)} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
