import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  EdgesGeometry,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Vector3,
  WebGLRenderer,
  WireframeGeometry,
} from "three";

/** nodes = 실제 프로필 수, edges = 실제 보증(vouch) 관계(프로필 인덱스 쌍). */
export type Graph = { nodes: number; edges: [number, number][] };

const R = 2;
/** 장면 수 (page.tsx의 장(chapter) 수와 같다): 0 구 · 1 주장→증거→검증 · 2 기준 7개 · 3 두 갈래 · 4 다시 구. */
const STAGES = 5;
const BARS = 7;
const BEACONS = 5; // 장면 0: 커밋처럼 깜빡이는 노드 수
const FLOW = 24; // 장면 1: 주장→링크→검증을 흐르는 빛 알갱이 수
const TIES = 5; // 장면 4: 새 노드가 잇는 이웃 수

const smooth = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);
/** a초부터 d초 동안 0→1. */
const ramp = (x: number, a: number, d: number) => smooth(clamp01((x - a) / d));
const frac = (x: number) => x - Math.floor(x);
const hash = (n: number) => frac(Math.sin(n * 12.9898) * 43758.5453);
/** 장면 k에 얼마나 가까운지 (0~1). */
const near = (s: number, k: number) => smooth(Math.max(0, 1 - Math.abs(s - k)));

/** 위치 n개 + 점마다 RGBA(알파로 하나씩 밝기 조절) 버퍼. */
const rgbaGeo = (n: number) => {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute("color", new BufferAttribute(new Float32Array(n * 4).fill(1), 4));
  return g;
};

/** 시작 페이지 스크롤 스토리의 배경. 격자 구의 꼭짓점들이 장면마다 다른 모양으로 모이고,
 *  장면마다 그 장의 내용을 몸짓으로 보여 준다 (커밋 맥박 · 증거 흐름 · 기준 막대 · 두 갈래 · 새 자리).
 *  장 사이 전환은 스크롤 진행도로, 장 안의 반복은 시간으로 움직인다.
 *  진행도는 host를 감싼 [data-story] 요소를 얼마나 지나왔는지로 정한다.
 *  still(움직임 줄이기)이면 각 장면이 다 자리 잡은 정지 프레임만 그린다.
 *  WebGL이 없으면 WebGLRenderer가 throw 하고, 호출 쪽이 잡아 빈 배경으로 둔다. */
export function mount(host: HTMLElement, graph: Graph, still: boolean): () => void {
  const story = host.closest<HTMLElement>("[data-story]") ?? host;
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity .9s ease";
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 60);
  const world = new Group(); // 위치·포인터 기울기
  const spin = new Group(); // 느린 자전
  world.add(spin);
  scene.add(world);

  const dotCanvas = document.createElement("canvas");
  dotCanvas.width = dotCanvas.height = 64;
  const ctx = dotCanvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  grad.addColorStop(0, "#fff");
  grad.addColorStop(0.5, "rgba(255,255,255,.9)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const dot = new CanvasTexture(dotCanvas);
  const pointMat = (size: number, vertexColors = false) =>
    new PointsMaterial({ size, map: dot, transparent: true, depthWrite: false, vertexColors });
  const lineMat = () => new LineBasicMaterial({ transparent: true, depthWrite: false });

  // 장면 0·4: 격자 구 + 실제 프로필 점 + 보증 호
  const ico = new IcosahedronGeometry(R, 3);
  const wire = new WireframeGeometry(ico);
  const latticeMat = lineMat();
  const globe = new Group();
  globe.add(new LineSegments(wire, latticeMat));

  const uniq = new Map<string, Vector3>();
  const pos = ico.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const v = new Vector3().fromBufferAttribute(pos, i);
    uniq.set(v.toArray().map((n) => n.toFixed(3)).join(), v);
  }
  const verts = [...uniq.values()];
  const N = verts.length;

  const members: Vector3[] = [];
  for (let i = 0; i < graph.nodes; i++) {
    const y = 1 - (2 * (i + 0.5)) / graph.nodes;
    const r = Math.sqrt(1 - y * y);
    const a = i * Math.PI * (3 - Math.sqrt(5)) + 0.6;
    members.push(new Vector3(Math.cos(a) * r, y, Math.sin(a) * r).multiplyScalar(R * 1.02));
  }
  const arcs: Vector3[] = [];
  for (const [a, b] of graph.edges) {
    const u = members[a]?.clone().normalize();
    const w = members[b]?.clone().normalize();
    if (!u || !w) continue;
    let prev = u.clone().multiplyScalar(R * 1.02);
    for (let s = 1; s <= 32; s++) {
      const t = s / 32;
      const p = u.clone().lerp(w, t).normalize().multiplyScalar(R * (1.02 + 0.18 * Math.sin(Math.PI * t)));
      arcs.push(prev, p);
      prev = p;
    }
  }
  const memberGeo = new BufferGeometry().setFromPoints(members);
  const memberMat = pointMat(0.22);
  const haloMat = pointMat(0.6);
  const arcGeo = new BufferGeometry().setFromPoints(arcs);
  const arcMat = lineMat();
  globe.add(new Points(memberGeo, haloMat), new Points(memberGeo, memberMat), new LineSegments(arcGeo, arcMat));
  spin.add(globe);

  // 모든 장면을 잇는 입자 구름: 꼭짓점마다 장면별 목표 위치가 있고, 점마다 색·밝기를 따로 준다.
  const cloudGeo = rgbaGeo(N);
  const cloud = cloudGeo.attributes.position.array as Float32Array;
  const cloudCol = cloudGeo.attributes.color.array as Float32Array;
  const cloudMat = pointMat(0.1, true);
  spin.add(new Points(cloudGeo, cloudMat));

  // 장면 1: 세 무리(주장 · 증거 링크 · 검증). 검증 무리는 도착 뒤 4×4×4 격자로 정렬한다.
  const centers3 = [-1.9, 0, 1.9].map((x) => new Vector3(x, 0, 0));
  const blob1 = verts.map((v, i) => v.clone().normalize().multiplyScalar(0.55).add(centers3[i % 3]));
  const grid1 = verts.map((_, i) => {
    const j = Math.floor(i / 3);
    return new Vector3((j % 4) - 1.5, (Math.floor(j / 4) % 4) - 1.5, Math.floor(j / 16) - 1.5)
      .multiplyScalar(0.26)
      .add(centers3[2]);
  });
  const linkGeo = new BufferGeometry().setFromPoints([centers3[0], centers3[1], centers3[1], centers3[2]]);
  const linkMat = lineMat();
  spin.add(new LineSegments(linkGeo, linkMat));
  const flowGeo = rgbaGeo(FLOW);
  const flowMat = pointMat(0.16, true);
  spin.add(new Points(flowGeo, flowMat));

  // 장면 2: 기준 7개 = 고리 위의 막대 7개. 값이 아니라 같은 높이로 차례로 차오르는 연출 (실제 점수는 프로필에서).
  const barH = 2.4;
  const perBar = Math.ceil(N / BARS);
  const barAng = Array.from({ length: BARS }, (_, b) => (b / BARS) * Math.PI * 2);
  const box = new BoxGeometry(0.34, barH, 0.34);
  const boxEdges = new EdgesGeometry(box);
  const barMats = barAng.map(() => lineMat());
  const bars = new Group();
  barAng.forEach((ang, b) => {
    const e = new LineSegments(boxEdges, barMats[b]);
    e.position.set(Math.cos(ang) * 1.7, 0, Math.sin(ang) * 1.7);
    bars.add(e);
  });
  spin.add(bars);
  const fill = new Array<number>(BARS).fill(0);
  const front = new Array<number>(BARS).fill(0);

  // 장면 3: 한 줄기가 위에서 내려와 좌(기업·투자자)·우(개발자) 두 흐름으로 갈라진다.
  const src = new Vector3(0, 1.5, 0);
  const fork = new Vector3(0, 0.3, 0);
  const ends = [new Vector3(-2.3, -1.4, 0), new Vector3(2.3, -1.4, 0)];
  const jitter = verts.map((v) => v.clone().normalize().multiplyScalar(0.22));
  const forkMats = [lineMat(), lineMat()];
  const forkGeos = ends.map((e) => new BufferGeometry().setFromPoints([src, fork, fork, e]));
  forkGeos.forEach((g, d) => spin.add(new LineSegments(g, forkMats[d])));
  const side = [0.5, 0.5];

  // 장면 4: 구에서 프로필과 가장 먼 빈 자리 하나에 새 노드(당신의 자리)가 나타나 이웃과 이어진다.
  let slot = 0;
  let far = -1;
  verts.forEach((v, i) => {
    const d = members.length ? Math.min(...members.map((m) => m.distanceTo(v))) : 0;
    if (d > far) [far, slot] = [d, i];
  });
  const seat = verts[slot].clone().normalize().multiplyScalar(R * 1.02);
  const nbrs = [...verts.filter((_, i) => i !== slot), ...members]
    .sort((a, b) => a.distanceTo(seat) - b.distanceTo(seat))
    .slice(0, TIES);
  const seatGeo = new BufferGeometry().setFromPoints([seat]);
  const seatMat = pointMat(0.26);
  const seatHalo = pointMat(0.9);
  const tieGeo = new BufferGeometry().setFromPoints(nbrs.flatMap(() => [seat, seat]));
  const tie = tieGeo.attributes.position.array as Float32Array;
  const tieMat = lineMat();
  globe.add(new Points(seatGeo, seatHalo), new Points(seatGeo, seatMat), new LineSegments(tieGeo, tieMat));

  // 장면 0: 노드가 커밋처럼 하나씩 켜졌다 꺼진다.
  const beaconGeo = rgbaGeo(BEACONS);
  const beaconMat = pointMat(0.34, true);
  spin.add(new Points(beaconGeo, beaconMat));

  // 뼈대(격자·막대·갈래)는 파랑, 움직이며 빛나는 것(보증 호·깜빡이는 노드·흐름·당신의 자리)은 주황.
  const brandMats = [latticeMat, linkMat, ...barMats, forkMats[1]];
  const accentMats = [memberMat, arcMat, tieMat, forkMats[0], haloMat, flowMat, seatMat, seatHalo, beaconMat];
  const ink = new Color();
  const proof = new Color();
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  const paint = () => {
    const css = getComputedStyle(document.documentElement);
    const brand = css.getPropertyValue("--brand").trim() || "#8ab0ff";
    ink.set(css.getPropertyValue("--ink").trim() || "#eceef4");
    proof.set(css.getPropertyValue("--proof").trim() || "#6fcf8f");
    for (const m of brandMats) m.color.set(brand);
    const accent = css.getPropertyValue("--accent").trim() || "#ff9f5a";
    for (const m of accentMats) m.color.set(accent);
  };
  paint();

  let wide = true;
  let camZ = 9;
  let px = 0, py = 0, tx = 0, ty = 0;
  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    wide = w >= 900;
    // 넓은 화면: 장면을 오른쪽에 두어 글을 가리지 않는다. 좁은 화면: 가운데, 작게.
    world.position.set(wide ? 2.4 : 0, wide ? 0 : 0.4, 0);
    world.scale.setScalar(wide ? 1 : 0.75);
    camZ = wide ? 8.5 : 12;
    camera.updateProjectionMatrix();
  };

  const A = new Vector3();
  const B = new Vector3();
  let settle = 0;
  /** 꼭짓점 i의 장면 k 위치 (장 안의 시간 t 반영). */
  const at = (k: number, i: number, t: number, o: Vector3) => {
    if (k === 1) return i % 3 === 2 ? o.lerpVectors(blob1[i], grid1[i], settle) : o.copy(blob1[i]);
    if (k === 2) {
      const b = i % BARS;
      const y = -barH / 2 + (Math.floor(i / BARS) / perBar) * barH * fill[b];
      return o.set(Math.cos(barAng[b]) * 1.7, y, Math.sin(barAng[b]) * 1.7);
    }
    if (k === 3) {
      const u = frac(t * 0.12 + hash(i));
      const e = ends[i % 2];
      if (u < 0.3) o.lerpVectors(src, fork, u / 0.3);
      else o.lerpVectors(fork, e, (u - 0.3) / 0.7);
      return o.add(jitter[i]);
    }
    return o.copy(verts[i]);
  };

  /** s = 0..STAGES-1 의 연속값, t = 초, clk[k] = 장면 k에 들어온 뒤 지난 초. */
  const pose = (s: number, t: number, clk: number[]) => {
    const w = Array.from({ length: STAGES }, (_, k) => near(s, k));
    settle = ramp(clk[1], 2.4, 1);
    for (let b = 0; b < BARS; b++) {
      fill[b] = ramp(clk[2], 0.2 + b * 0.28, 0.6);
      // 카메라 쪽(+z)으로 돌아온 막대일수록 1
      front[b] = Math.max(0, Math.sin(barAng[b] - spin.rotation.y)) ** 2;
    }
    const right = smooth(clamp01(px * 3 + 0.5));
    side[0] = 0.3 + 0.7 * (1 - right);
    side[1] = 0.3 + 0.7 * right;

    const a = Math.min(Math.floor(s), STAGES - 2);
    const f = smooth(clamp01(s - a));
    for (let i = 0; i < N; i++) {
      at(a, i, t, A);
      at(a + 1, i, t, B);
      A.lerp(B, f).toArray(cloud, i * 3);
      const green = i % 3 === 2 ? w[1] * settle : 0;
      let alpha = 0.85;
      alpha *= 1 - w[2] * (1 - (0.45 + 0.55 * front[i % BARS]));
      const u = frac(t * 0.12 + hash(i));
      alpha *= 1 - w[3] * (1 - side[i % 2] * Math.min(1, u * 8, (1 - u) * 8));
      if (i === slot) alpha *= 1 - w[4];
      cloudCol[i * 4] = ink.r + (proof.r - ink.r) * green;
      cloudCol[i * 4 + 1] = ink.g + (proof.g - ink.g) * green;
      cloudCol[i * 4 + 2] = ink.b + (proof.b - ink.b) * green;
      cloudCol[i * 4 + 3] = alpha;
    }
    cloudGeo.attributes.position.needsUpdate = true;
    cloudGeo.attributes.color.needsUpdate = true;
    cloudMat.size = 0.1 + 0.05 * (1 - Math.max(w[0], w[4])) + 0.03 * w[1] * settle;

    // 0: 커밋 맥박. 1.8초마다 꼭짓점 하나가 켜졌다 꺼지고, 다섯 개가 엇갈려 돈다.
    const bp = beaconGeo.attributes.position.array as Float32Array;
    const bc = beaconGeo.attributes.color.array as Float32Array;
    for (let k = 0; k < BEACONS; k++) {
      const c = t / 1.8 + k / BEACONS;
      const idx = Math.floor(hash(Math.floor(c) * 7.13 + k * 3.7) * N);
      bp.set(cloud.subarray(idx * 3, idx * 3 + 3), k * 3);
      bc[k * 4 + 3] = Math.sin(Math.PI * frac(c)) ** 2;
    }
    beaconGeo.attributes.position.needsUpdate = true;
    beaconGeo.attributes.color.needsUpdate = true;
    beaconMat.opacity = w[0];

    // 1: 빛 알갱이가 주장 → 링크 → 검증 순서로 흐른다. 장에 들어오면 빈 선에서 시작한다.
    const fp = flowGeo.attributes.position.array as Float32Array;
    const fc = flowGeo.attributes.color.array as Float32Array;
    for (let j = 0; j < FLOW; j++) {
      const raw = clk[1] * 0.4 - j / FLOW;
      const u = frac(raw);
      if (u < 0.5) A.lerpVectors(centers3[0], centers3[1], u * 2);
      else A.lerpVectors(centers3[1], centers3[2], (u - 0.5) * 2);
      A.toArray(fp, j * 3);
      fc[j * 4 + 3] = raw < 0 ? 0 : Math.min(1, u * 10, (1 - u) * 10);
    }
    flowGeo.attributes.position.needsUpdate = true;
    flowGeo.attributes.color.needsUpdate = true;
    flowMat.opacity = w[1];
    linkMat.opacity = 0.5 * w[1];

    // 2: 막대가 차례로 차오르고, 고리가 돌며 앞에 온 막대가 밝아진다.
    bars.children.forEach((c, b) => {
      c.scale.y = Math.max(0.001, fill[b]);
      c.position.y = (-barH / 2) * (1 - fill[b]);
      barMats[b].opacity = w[2] * (0.25 + 0.75 * front[b]);
    });

    // 3: 포인터가 있는 쪽 흐름이 밝아진다.
    forkMats.forEach((m, d) => (m.opacity = 0.7 * w[3] * side[d]));

    // 0·4: 구
    const g = Math.max(w[0], w[4]);
    latticeMat.opacity = 0.34 * g;
    arcMat.opacity = 0.8 * g;
    memberMat.opacity = g;
    haloMat.opacity = 0.18 * g;
    globe.scale.setScalar(0.6 + 0.4 * g);

    // 4: 빈 자리에 새 노드가 톡 나타나고, 이웃으로 선이 뻗는다.
    const pop = ramp(clk[4], 0.4, 0.6);
    const grow = ramp(clk[4], 1, 0.9);
    seatMat.opacity = w[4] * pop;
    seatMat.size = 0.26 * (1 + 0.6 * Math.sin(Math.PI * pop));
    seatHalo.opacity = w[4] * pop * (0.2 + 0.1 * Math.sin(t * 2.4));
    nbrs.forEach((n, k) => A.lerpVectors(seat, n, grow).toArray(tie, k * 6 + 3));
    tieGeo.attributes.position.needsUpdate = true;
    tieMat.opacity = 0.9 * w[4];

    // 장면마다 카메라가 조금씩 다른 각도로: 1·3은 정면, 2는 위에서 내려다본다.
    spin.rotation.x = 0.5 * w[2];
    // 넓은 첫 화면: 오른쪽엔 실제 프로필 카드가 있으니 카메라를 물려 구를 작게, 카드와 겹치지 않게.
    camera.position.set(0, 0.6 * w[2], camZ + 1.2 * w[4] + (wide ? 4.5 : -0.8) * w[0]);
    camera.lookAt(world.position.x, world.position.y, 0);
  };

  const progress = () => {
    const r = story.getBoundingClientRect();
    const span = Math.max(r.height - window.innerHeight, 1);
    return Math.min(Math.max(-r.top / span, 0), 1) * (STAGES - 1);
  };

  let raf = 0;
  let visible = true;
  let s = 0;
  const since = new Array<number>(STAGES).fill(-1);
  const clk = new Array<number>(STAGES).fill(0);
  const render = () => {
    renderer.render(scene, camera);
    canvas.style.opacity = "1";
  };
  const tick = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const t = now / 1000;
    px += (tx - px) * 0.04;
    py += (ty - py) * 0.04;
    s += (progress() - s) * 0.08;
    // 장 안의 시계: 장면에 반쯤 들어오면 0부터 세고, 거의 벗어나면 되돌린다.
    for (let k = 0; k < STAGES; k++) {
      const w = near(s, k);
      if (w > 0.5 && since[k] < 0) since[k] = t;
      else if (w < 0.05) since[k] = -1;
      clk[k] = since[k] < 0 ? 0 : t - since[k];
    }
    // 처음 구는 돌고, 기준 고리는 천천히 돌고, 1·3은 정면을 보고 선다. 마지막 구는 새 자리가 보이게 느리게.
    const flat = Math.min(near(s, 1) + near(s, 3), 1);
    const step = 0.0012 + 0.0045 * near(s, 0) + 0.006 * near(s, 2);
    const y = (((spin.rotation.y + step + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    spin.rotation.y = y - y * 0.08 * flat;
    world.rotation.set(0.18 + py * 0.2, px * 0.3, 0.08 * Math.max(near(s, 0), near(s, 4)));
    pose(s, t, clk);
    render();
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (!still && !raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const redraw = () => {
    resize();
    if (still) {
      // 정지 프레임: 장 안의 연출이 다 끝난 모습 (움직임 줄이기에서는 첫 장 뒤에만 보인다).
      pose(Math.round(s), 0, clk.fill(99));
      render();
    } else start();
  };
  const onScheme = () => {
    paint();
    redraw();
  };
  const onPointer = (e: PointerEvent) => {
    tx = e.clientX / window.innerWidth - 0.5;
    ty = e.clientY / window.innerHeight - 0.5;
  };

  world.rotation.set(0.18, 0, 0.08);
  spin.rotation.y = 0.8;
  s = still ? 0 : progress();
  const ro = new ResizeObserver(redraw);
  ro.observe(host);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    start();
  });
  io.observe(host);
  document.addEventListener("visibilitychange", start);
  scheme.addEventListener("change", onScheme);
  if (!still) window.addEventListener("pointermove", onPointer, { passive: true });
  redraw();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    document.removeEventListener("visibilitychange", start);
    scheme.removeEventListener("change", onScheme);
    window.removeEventListener("pointermove", onPointer);
    for (const g of [ico, wire, memberGeo, arcGeo, cloudGeo, linkGeo, flowGeo, box, boxEdges, ...forkGeos, seatGeo, tieGeo, beaconGeo])
      g.dispose();
    for (const m of [...brandMats, ...accentMats, cloudMat]) m.dispose();
    dot.dispose();
    renderer.dispose();
    canvas.remove();
  };
}
