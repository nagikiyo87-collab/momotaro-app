import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * 本物らしい 3D サイコロ（three.js で描画、cannon-es で物理演算）
 *
 * 出目を先に決めるしくみ：
 *  1. 投げ方（位置・速さ・回転）を決めて、物理演算を最後まで先に計算し、毎フレームの位置と向きを記録する
 *  2. 止まったときに上を向いている面を調べる
 *  3. その面に「出したい目」が来るよう、サイコロの絵の貼り方（見た目の向き）だけを回しておく
 *  4. 記録を再生する
 * 物理の動きはそのままなので自然に転がり、必ず指定の目で止まる。
 */

// ---- サイコロの面と目 ----------------------------------------------------
// BoxGeometry の面の順番：+X, -X, +Y, -Y, +Z, -Z（向かい合う面の和が 7）
const FACE_VALUES = [3, 4, 2, 5, 1, 6];
const VALUE_NORMAL: Record<number, THREE.Vector3> = {
  1: new THREE.Vector3(0, 0, 1),
  6: new THREE.Vector3(0, 0, -1),
  2: new THREE.Vector3(0, 1, 0),
  5: new THREE.Vector3(0, -1, 0),
  3: new THREE.Vector3(1, 0, 0),
  4: new THREE.Vector3(-1, 0, 0),
};
const LOCAL_AXES = Object.values(VALUE_NORMAL);
const UP = new THREE.Vector3(0, 1, 0);

// 3×3 のマス（0〜8）のうち目を置く場所
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const TEX = 512;

/** 面の絵（色）と、目のくぼみ（凹凸）の 2 枚を描く */
const drawFace = (value: number) => {
  const color = document.createElement('canvas');
  const bump = document.createElement('canvas');
  color.width = color.height = bump.width = bump.height = TEX;
  const c = color.getContext('2d')!;
  const b = bump.getContext('2d')!;

  // 地の色：わずかにムラのある象牙色
  const g = c.createRadialGradient(TEX * 0.4, TEX * 0.35, TEX * 0.05, TEX / 2, TEX / 2, TEX * 0.75);
  g.addColorStop(0, '#fbf8f1');
  g.addColorStop(1, '#ece5d6');
  c.fillStyle = g;
  c.fillRect(0, 0, TEX, TEX);
  b.fillStyle = '#ffffff';
  b.fillRect(0, 0, TEX, TEX);

  const isOne = value === 1;
  const r = isOne ? TEX * 0.17 : TEX * 0.095;
  for (const cell of PIPS[value]) {
    const cx = TEX * (0.24 + (cell % 3) * 0.26);
    const cy = TEX * (0.24 + Math.floor(cell / 3) * 0.26);

    // 色：くぼみの奥ほど暗く、上側の縁に少し光
    const pg = c.createRadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.1, cx, cy, r);
    if (isOne) {
      pg.addColorStop(0, '#e8323f');
      pg.addColorStop(0.75, '#b5141f');
      pg.addColorStop(1, '#7d0b14');
    } else {
      pg.addColorStop(0, '#2b2b33');
      pg.addColorStop(0.8, '#121217');
      pg.addColorStop(1, '#3a3a40');
    }
    c.fillStyle = pg;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();

    // 凹凸：お椀形のくぼみ
    const bg = b.createRadialGradient(cx, cy, 0, cx, cy, r * 1.08);
    bg.addColorStop(0, '#000000');
    bg.addColorStop(0.7, '#3a3a3a');
    bg.addColorStop(1, '#ffffff');
    b.fillStyle = bg;
    b.beginPath();
    b.arc(cx, cy, r * 1.08, 0, Math.PI * 2);
    b.fill();
  }

  const map = new THREE.CanvasTexture(color);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  const bumpMap = new THREE.CanvasTexture(bump);
  return { map, bumpMap };
};

/** フェルトの布目 */
const drawFelt = () => {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#808080';
  c.fillRect(0, 0, 256, 256);
  const img = c.getImageData(0, 0, 256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 128 + (Math.random() - 0.5) * 60;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
  }
  c.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(12, 12);
  return t;
};

// ---- 乱数（seed を渡すと同じ投げ方を再現できる） ---------------------------
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ---- 音 ---------------------------------------------------------------
let sharedAudio: AudioContext | null = null;
const getAudio = () => {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  if (!sharedAudio) sharedAudio = new AudioContext();
  if (sharedAudio.state === 'suspended') void sharedAudio.resume();
  return sharedAudio;
};

/** 樹脂のサイコロが布の盤や木の枠に当たる「コツッ」 */
const playClack = (ctx: AudioContext, when: number, volume: number, hard: boolean) => {
  const len = Math.floor(ctx.sampleRate * (hard ? 0.06 : 0.04));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 5);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = (hard ? 2600 : 1500) + Math.random() * 600;
  band.Q.value = 1.6;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.connect(band).connect(gain).connect(ctx.destination);
  src.start(when);
};

// ---- 本体 --------------------------------------------------------------
type Recording = {
  frames: number;
  pos: Float32Array[]; // サイコロごと：frames × 3
  quat: Float32Array[]; // サイコロごと：frames × 4
  hits: { frame: number; volume: number; hard: boolean }[];
};

const DIE = 1; // サイコロの一辺
const FPS = 60;

export class DiceScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  private geometry = new RoundedBoxGeometry(DIE, DIE, DIE, 5, 0.13);
  private materials: THREE.MeshPhysicalMaterial[];
  private dice: { group: THREE.Group; mesh: THREE.Mesh }[] = [];
  private disposables: { dispose: () => void }[] = [];
  private raf = 0;
  private resizeObserver: ResizeObserver;
  private bounds = { xMin: -2, xMax: 2, zMin: -1.5, zMax: 1.5 };

  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    // 映り込み用の部屋の光（艶を出す）
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.scene.environmentIntensity = 0.55;
    pmrem.dispose();
    this.disposables.push(envTex);

    this.camera.position.set(0, 5.9, 3.5);
    this.camera.lookAt(0, 0, 0.25);

    // 照明：左上から太陽のような光（影を落とす）＋全体の柔らかい光
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.4);
    sun.position.set(-3.5, 9, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -6;
    sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6;
    sun.shadow.camera.bottom = -6;
    sun.shadow.radius = 4;
    sun.shadow.bias = -0.0008;
    this.scene.add(sun);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x1a3a26, 0.35));

    // フェルトの盤
    const felt = drawFelt();
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x155a35,
      roughness: 0.95,
      bumpMap: felt,
      bumpScale: 0.6,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.disposables.push(felt, floorMat, floor.geometry);

    // サイコロの材質：艶のある樹脂
    this.materials = FACE_VALUES.map((v) => {
      const { map, bumpMap } = drawFace(v);
      this.disposables.push(map, bumpMap);
      return new THREE.MeshPhysicalMaterial({
        map,
        bumpMap,
        bumpScale: 2.2,
        roughness: 0.32,
        clearcoat: 0.7,
        clearcoatRoughness: 0.18,
      });
    });
    this.disposables.push(this.geometry, ...this.materials);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
  }

  /** 画面の大きさに合わせる。カメラに映る範囲から、サイコロが出てはいけない壁の位置も計算する */
  private resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    // 画面の四隅から、サイコロの中心の高さ（y = DIE/2）の面に光線を飛ばして範囲を求める
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DIE / 2);
    const ray = new THREE.Raycaster();
    const hit = (x: number, y: number) => {
      ray.setFromCamera(new THREE.Vector2(x, y), this.camera);
      return ray.ray.intersectPlane(plane, new THREE.Vector3()) ?? new THREE.Vector3();
    };
    const tl = hit(-1, 1);
    const bl = hit(-1, -1);
    const margin = DIE * 0.75;
    const xHalf = Math.min(Math.abs(tl.x), Math.abs(bl.x)) - margin;
    this.bounds = { xMin: -xHalf, xMax: xHalf, zMin: tl.z + margin, zMax: bl.z - margin };
    this.render();
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  private ensureDice(count: number) {
    while (this.dice.length < count) {
      const mesh = new THREE.Mesh(this.geometry, this.materials);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const group = new THREE.Group();
      group.add(mesh);
      this.scene.add(group);
      this.dice.push({ group, mesh });
    }
    this.dice.forEach((d, i) => (d.group.visible = i < count));
  }

  /** 投げずに、指定の目を上にして置く */
  setRest(values: number[]) {
    this.ensureDice(values.length);
    const gap = DIE * 1.6;
    values.forEach((v, i) => {
      const { group, mesh } = this.dice[i];
      group.position.set((i - (values.length - 1) / 2) * gap, DIE / 2, 0.2);
      group.quaternion.setFromAxisAngle(UP, (i === 0 ? 1 : -1) * 0.35);
      mesh.quaternion.setFromUnitVectors(VALUE_NORMAL[v], UP);
    });
    this.render();
  }

  /** 物理演算を最後まで先に計算する */
  private simulate(count: number, rand: () => number): Recording | null {
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -42, 0) });
    world.allowSleep = true;
    const diceMat = new CANNON.Material('dice');
    const floorMat = new CANNON.Material('floor');
    const wallMat = new CANNON.Material('wall');
    world.addContactMaterial(new CANNON.ContactMaterial(diceMat, floorMat, { friction: 0.4, restitution: 0.35 }));
    world.addContactMaterial(new CANNON.ContactMaterial(diceMat, wallMat, { friction: 0.05, restitution: 0.55 }));
    world.addContactMaterial(new CANNON.ContactMaterial(diceMat, diceMat, { friction: 0.1, restitution: 0.5 }));

    const floor = new CANNON.Body({ mass: 0, material: floorMat, shape: new CANNON.Plane() });
    floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(floor);

    // 見えている範囲の端に見えない壁を置く
    const { xMin, xMax, zMin, zMax } = this.bounds;
    // [x, z, Y 軸の回転]。Plane の表（法線）は +Z なので、内側を向くよう回す
    const walls: [number, number, number][] = [
      [xMin - DIE / 2, 0, Math.PI / 2], // 左の壁（内側 = +X）
      [xMax + DIE / 2, 0, -Math.PI / 2], // 右の壁（内側 = -X）
      [0, zMin - DIE / 2, 0], // 奥の壁（内側 = +Z）
      [0, zMax + DIE / 2, Math.PI], // 手前の壁（内側 = -Z）
    ];
    for (const [x, z, ry] of walls) {
      const wall = new CANNON.Body({ mass: 0, material: wallMat, shape: new CANNON.Plane() });
      wall.position.set(x, 0, z);
      wall.quaternion.setFromEuler(0, ry, 0);
      world.addBody(wall);
    }

    const hits: Recording['hits'] = [];
    let frame = 0;
    const bodies: CANNON.Body[] = [];
    for (let i = 0; i < count; i++) {
      const body = new CANNON.Body({
        mass: 1,
        material: diceMat,
        shape: new CANNON.Box(new CANNON.Vec3(DIE / 2, DIE / 2, DIE / 2)),
        linearDamping: 0.12,
        angularDamping: 0.12,
        sleepSpeedLimit: 0.15,
        sleepTimeLimit: 0.25,
      });
      // 右の手前寄りから、左へ向かって横に投げる（盤の真ん中あたりで止まりやすい）
      // 高い位置から始めるので、画面の外から飛び込んでくるように見える
      const zMid = (zMin + zMax) / 2;
      body.position.set(xMax - 0.2, 2.6 + rand() * 1.0 + i * 0.5, zMid + (i - 0.5) * 1.3 + (rand() - 0.5) * 0.8);
      body.velocity.set(-(4.5 + rand() * 2.5), 0.5 + rand() * 1.5, (rand() - 0.5) * 2.5);
      body.angularVelocity.set((rand() - 0.5) * 40, (rand() - 0.5) * 40, (rand() - 0.5) * 40);
      body.quaternion.setFromEuler(rand() * 6.28, rand() * 6.28, rand() * 6.28);
      let lastHit = -10;
      body.addEventListener('collide', (e: { body: CANNON.Body; contact: CANNON.ContactEquation }) => {
        const v = Math.abs(e.contact.getImpactVelocityAlongNormal());
        if (v < 1.2 || frame - lastHit < 4) return;
        lastHit = frame;
        hits.push({ frame, volume: Math.min(1, v / 12), hard: e.body.material === wallMat || e.body.material === diceMat });
      });
      world.addBody(body);
      bodies.push(body);
    }

    const MAX = FPS * 6;
    const pos = bodies.map(() => new Float32Array(MAX * 3));
    const quat = bodies.map(() => new Float32Array(MAX * 4));
    let still = 0;
    for (frame = 0; frame < MAX; frame++) {
      world.step(1 / FPS);
      bodies.forEach((bd, i) => {
        pos[i].set([bd.position.x, bd.position.y, bd.position.z], frame * 3);
        quat[i].set([bd.quaternion.x, bd.quaternion.y, bd.quaternion.z, bd.quaternion.w], frame * 4);
      });
      const moving = bodies.some((bd) => bd.velocity.length() > 0.05 || bd.angularVelocity.length() > 0.05);
      still = moving ? 0 : still + 1;
      if (still > 8 || bodies.every((bd) => bd.sleepState === CANNON.Body.SLEEPING)) {
        frame++;
        break;
      }
    }

    // 斜めに立てかかって止まった（どの面も真上を向いていない）ときは投げ直し
    for (let i = 0; i < count; i++) {
      if (this.topAxis(quat[i], frame - 1).dot < 0.95) return null;
    }
    return { frames: frame, pos, quat, hits };
  }

  /** 止まったときに真上を向いている面（サイコロから見た向き） */
  private topAxis(q: Float32Array, f: number) {
    const quat = new THREE.Quaternion(q[f * 4], q[f * 4 + 1], q[f * 4 + 2], q[f * 4 + 3]);
    let best = LOCAL_AXES[0];
    let dot = -2;
    for (const a of LOCAL_AXES) {
      const d = a.clone().applyQuaternion(quat).dot(UP);
      if (d > dot) {
        dot = d;
        best = a;
      }
    }
    return { axis: best, dot };
  }

  /** 投げる。止まったら resolve する */
  roll(values: number[], opts: { sound?: boolean; seed?: number } = {}): Promise<void> {
    cancelAnimationFrame(this.raf);
    this.ensureDice(values.length);
    const rand = mulberry32(opts.seed ?? Math.floor(Math.random() * 2 ** 31));

    let rec: Recording | null = null;
    for (let tries = 0; tries < 12 && !rec; tries++) rec = this.simulate(values.length, rand);
    if (!rec) {
      this.setRest(values);
      return Promise.resolve();
    }
    const recording = rec;

    // 上を向く面に、出したい目が来るよう見た目だけ回す
    values.forEach((v, i) => {
      const { axis } = this.topAxis(recording.quat[i], recording.frames - 1);
      this.dice[i].mesh.quaternion.setFromUnitVectors(VALUE_NORMAL[v], axis);
    });

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const audio = opts.sound && !reduced ? getAudio() : null;
    if (audio) {
      for (const h of recording.hits) playClack(audio, audio.currentTime + h.frame / FPS, h.volume, h.hard);
    }

    const apply = (f: number) => {
      values.forEach((_, i) => {
        const p = recording.pos[i];
        const q = recording.quat[i];
        this.dice[i].group.position.set(p[f * 3], p[f * 3 + 1], p[f * 3 + 2]);
        this.dice[i].group.quaternion.set(q[f * 4], q[f * 4 + 1], q[f * 4 + 2], q[f * 4 + 3]);
      });
      this.render();
    };

    if (reduced) {
      apply(recording.frames - 1);
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const start = performance.now();
      const tick = (now: number) => {
        const f = Math.min(recording.frames - 1, Math.floor(((now - start) / 1000) * FPS));
        apply(f);
        if (f >= recording.frames - 1) {
          resolve();
          return;
        }
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    });
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
