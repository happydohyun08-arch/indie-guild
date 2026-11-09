import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
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

const smooth = (x: number) => x * x * (3 - 2 * x);
/** 장면 k에 얼마나 가까운지 (0~1). */
const near = (s: number, k: number) => smooth(Math.max(0, 1 - Math.abs(s - k)));

/** 시작 페이지 스크롤 스토리의 배경. 격자 구의 꼭짓점들이 장면마다 다른 모양으로 모였다 흩어진다.
 *  진행도는 host를 감싼 [data-story] 요소를 얼마나 지나왔는지로 정한다.
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

  // 장면 0·4: 격자 구 + 실제 프로필 점 + 보증 호
  const ico = new IcosahedronGeometry(R, 3);
  const wire = new WireframeGeometry(ico);
  const latticeMat = new LineBasicMaterial({ transparent: true, depthWrite: false });
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
  const memberMat = new PointsMaterial({ size: 0.22, map: dot, transparent: true, depthWrite: false });
  const haloMat = new PointsMaterial({ size: 0.6, map: dot, transparent: true, depthWrite: false });
  const arcGeo = new BufferGeometry().setFromPoints(arcs);
  const arcMat = new LineBasicMaterial({ transparent: true, depthWrite: false });
  globe.add(new Points(memberGeo, haloMat), new Points(memberGeo, memberMat), new LineSegments(arcGeo, arcMat));
  spin.add(globe);

  // 모든 장면을 잇는 입자: 구의 꼭짓점이 장면마다 다른 목표 위치로 옮겨 간다.
  const targets: Float32Array[] = Array.from({ length: STAGES }, () => new Float32Array(N * 3));
  const put = (k: number, i: number, v: Vector3) => v.toArray(targets[k], i * 3);
  const centers3 = [-1.9, 0, 1.9].map((x) => new Vector3(x, 0, 0));
  const centers2 = [-1.4, 1.4].map((x) => new Vector3(x, 0, 0));
  const barH = 2.4;
  const perBar = Math.ceil(N / BARS);
  verts.forEach((v, i) => {
    const dir = v.clone().normalize();
    put(0, i, v);
    put(1, i, dir.clone().multiplyScalar(0.55).add(centers3[i % 3]));
    const b = i % BARS;
    const ang = (b / BARS) * Math.PI * 2;
    const k = Math.floor(i / BARS);
    put(2, i, new Vector3(Math.cos(ang) * 1.7, (k / perBar) * barH - barH / 2, Math.sin(ang) * 1.7));
    put(3, i, dir.clone().multiplyScalar(0.8).add(centers2[i % 2]));
    put(4, i, v);
  });
  const cloud = new Float32Array(targets[0]);
  const cloudGeo = new BufferGeometry();
  cloudGeo.setAttribute("position", new BufferAttribute(cloud, 3));
  const cloudMat = new PointsMaterial({ size: 0.1, map: dot, transparent: true, depthWrite: false });
  spin.add(new Points(cloudGeo, cloudMat));

  // 장면 1: 주장 → 증거 → 검증을 잇는 선
  const linkGeo = new BufferGeometry().setFromPoints([centers3[0], centers3[1], centers3[1], centers3[2]]);
  const linkMat = new LineBasicMaterial({ transparent: true, depthWrite: false });
  spin.add(new LineSegments(linkGeo, linkMat));

  // 장면 2: 기준 7개 = 고리 위의 막대 7개 (값 없이 틀만: 실제 점수는 프로필에서)
  const box = new BoxGeometry(0.34, barH, 0.34);
  const boxEdges = new EdgesGeometry(box);
  const barMat = new LineBasicMaterial({ transparent: true, depthWrite: false });
  const bars = new Group();
  for (let b = 0; b < BARS; b++) {
    const ang = (b / BARS) * Math.PI * 2;
    const e = new LineSegments(boxEdges, barMat);
    e.position.set(Math.cos(ang) * 1.7, 0, Math.sin(ang) * 1.7);
    bars.add(e);
  }
  spin.add(bars);

  // 장면 3: 두 갈래를 잇는 선
  const forkGeo = new BufferGeometry().setFromPoints([centers2[0], centers2[1]]);
  const forkMat = new LineBasicMaterial({ transparent: true, depthWrite: false });
  spin.add(new LineSegments(forkGeo, forkMat));

  const lineMats = [latticeMat, arcMat, linkMat, barMat, forkMat];
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  const paint = () => {
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--ink").trim() || "#eceef4";
    const brand = css.getPropertyValue("--brand").trim() || "#8ab0ff";
    const proof = css.getPropertyValue("--proof").trim() || "#6fcf8f";
    for (const m of [...lineMats, memberMat, haloMat]) m.color.set(brand);
    linkMat.color.set(proof);
    cloudMat.color.set(ink);
  };
  paint();

  let wide = true;
  let camZ = 9;
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

  /** s = 0..STAGES-1 의 연속값. 한 장면 안에서도 섞인다. */
  const pose = (s: number, now: number) => {
    const a = Math.min(Math.floor(s), STAGES - 2);
    const f = smooth(Math.min(Math.max(s - a, 0), 1));
    const A = targets[a];
    const B = targets[a + 1];
    for (let i = 0; i < cloud.length; i++) cloud[i] = A[i] + (B[i] - A[i]) * f;
    cloudGeo.attributes.position.needsUpdate = true;

    const g = Math.max(near(s, 0), near(s, 4));
    latticeMat.opacity = 0.34 * g;
    arcMat.opacity = 0.8 * g;
    memberMat.opacity = g;
    haloMat.opacity = 0.18 * g;
    globe.scale.setScalar(0.6 + 0.4 * g);
    linkMat.opacity = 0.9 * near(s, 1);
    forkMat.opacity = 0.7 * near(s, 3);
    const w2 = near(s, 2);
    barMat.opacity = 0.75 * w2;
    bars.children.forEach((c, b) => {
      // 기준마다 높이가 조금씩 오르내린다 (장식, 데이터 아님)
      c.scale.y = Math.max(0.001, w2 * (0.75 + 0.25 * Math.sin(now * 0.0012 + b * 0.9)));
    });
    cloudMat.size = 0.1 + 0.05 * (1 - g);
    cloudMat.opacity = 0.85;

    // 장면마다 카메라가 조금씩 다른 각도로: 1·3은 정면, 2는 위에서 내려다본다.
    spin.rotation.x = 0.5 * w2;
    camera.position.set(0, 0.6 * w2, camZ + 1.2 * near(s, 4) - 0.8 * near(s, 0));
    camera.lookAt(world.position.x, world.position.y, 0);
  };

  const progress = () => {
    const r = story.getBoundingClientRect();
    const span = Math.max(r.height - window.innerHeight, 1);
    return Math.min(Math.max(-r.top / span, 0), 1) * (STAGES - 1);
  };

  let raf = 0;
  let visible = true;
  let px = 0, py = 0, tx = 0, ty = 0;
  let s = 0;
  const render = () => {
    renderer.render(scene, camera);
    canvas.style.opacity = "1";
  };
  const tick = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    px += (tx - px) * 0.04;
    py += (ty - py) * 0.04;
    s += (progress() - s) * 0.08;
    // 구일 때는 돌고, 모양이 잡히는 장면에선 거의 멈춘다.
    const g = Math.max(near(s, 0), near(s, 4));
    const flat = Math.min(near(s, 1) + near(s, 3), 1); // 1·3은 정면을 보고 선다
    const y = (((spin.rotation.y + 0.0012 + 0.0045 * g + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    spin.rotation.y = y - y * 0.08 * flat;
    world.rotation.set(0.18 + py * 0.2, px * 0.3, 0.08 * g);
    pose(s, now);
    render();
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (!still && !raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const redraw = () => {
    resize();
    if (still) {
      pose(0, 0);
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
    for (const g of [ico, wire, memberGeo, arcGeo, cloudGeo, linkGeo, box, boxEdges, forkGeo]) g.dispose();
    for (const m of [...lineMats, memberMat, haloMat, cloudMat]) m.dispose();
    dot.dispose();
    renderer.dispose();
    canvas.remove();
  };
}
