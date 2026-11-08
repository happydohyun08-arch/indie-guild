import {
  BufferGeometry,
  CanvasTexture,
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

/** 시작 페이지 배경: 옅은 격자 구 위에 실제 프로필을 브랜드 색 점으로, 보증을 호로 잇는다.
 *  WebGL이 없으면 WebGLRenderer가 throw 하고, 호출 쪽이 잡아 빈 배경으로 둔다. */
export function mount(host: HTMLElement, graph: Graph, still: boolean): () => void {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity .9s ease";
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 50);
  const world = new Group(); // 위치·포인터·스크롤 기울기
  const spin = new Group(); // 느린 자전
  world.add(spin);
  scene.add(world);

  // 둥근 점 스프라이트 (외부 에셋 없이 코드로 그린다)
  const dotCanvas = document.createElement("canvas");
  dotCanvas.width = dotCanvas.height = 64;
  const ctx = dotCanvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.fill();
  const dot = new CanvasTexture(dotCanvas);

  // 길드라는 공간: 격자 구. 사람이 아니라 배경이므로 단색, 아주 옅게.
  const ico = new IcosahedronGeometry(R, 3);
  const latticeMat = new LineBasicMaterial({ transparent: true, opacity: 0.07, depthWrite: false });
  const wire = new WireframeGeometry(ico);
  spin.add(new LineSegments(wire, latticeMat));

  const uniq = new Map<string, Vector3>();
  const pos = ico.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const v = new Vector3().fromBufferAttribute(pos, i);
    uniq.set(v.toArray().map((n) => n.toFixed(3)).join(), v);
  }
  const verts = [...uniq.values()];
  const vertGeo = new BufferGeometry().setFromPoints(verts);
  const vertMat = new PointsMaterial({ size: 0.04, map: dot, transparent: true, opacity: 0.3, depthWrite: false });
  spin.add(new Points(vertGeo, vertMat));

  // 실제 프로필: 황금각 배치로 구 위에 고르게.
  const members: Vector3[] = [];
  for (let i = 0; i < graph.nodes; i++) {
    const y = 1 - (2 * (i + 0.5)) / graph.nodes;
    const r = Math.sqrt(1 - y * y);
    const a = i * Math.PI * (3 - Math.sqrt(5)) + 0.6;
    members.push(new Vector3(Math.cos(a) * r, y, Math.sin(a) * r).multiplyScalar(R * 1.02));
  }
  const memberGeo = new BufferGeometry().setFromPoints(members);
  const memberMat = new PointsMaterial({ size: 0.16, map: dot, transparent: true, depthWrite: false });
  const haloMat = new PointsMaterial({ size: 0.42, map: dot, transparent: true, opacity: 0.12, depthWrite: false });
  spin.add(new Points(memberGeo, haloMat), new Points(memberGeo, memberMat));

  // 프로필 → 가까운 격자점 3개 (길드에 속해 있음), 보증 → 구 바깥으로 살짝 뜬 호.
  const tether: Vector3[] = [];
  for (const m of members) {
    const near = [...verts].sort((a, b) => a.distanceToSquared(m) - b.distanceToSquared(m)).slice(0, 3);
    for (const v of near) tether.push(m, v);
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
  const tetherGeo = new BufferGeometry().setFromPoints(tether);
  const tetherMat = new LineBasicMaterial({ transparent: true, opacity: 0.3, depthWrite: false });
  const arcGeo = new BufferGeometry().setFromPoints(arcs);
  const arcMat = new LineBasicMaterial({ transparent: true, opacity: 0.75, depthWrite: false });
  spin.add(new LineSegments(tetherGeo, tetherMat), new LineSegments(arcGeo, arcMat));

  // 색은 CSS 토큰에서 읽는다 (라이트/다크 자동).
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  const paint = () => {
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--ink").trim() || "#18181b";
    const brand = css.getPropertyValue("--brand").trim() || "#2450b2";
    latticeMat.color.set(ink);
    vertMat.color.set(ink);
    for (const m of [memberMat, haloMat, tetherMat, arcMat]) m.color.set(brand);
  };
  paint();

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const wide = w >= 900;
    // 넓은 화면: 구를 오른쪽에 두어 글을 가리지 않는다. 좁은 화면: 가운데, 멀리.
    world.position.set(wide ? 2.6 : 0, wide ? 0.1 : 0.6, 0);
    camera.position.set(0, 0, wide ? 9 : 10);
    camera.updateProjectionMatrix();
  };

  let raf = 0;
  let visible = true;
  let px = 0, py = 0, tx = 0, ty = 0;
  const render = () => {
    renderer.render(scene, camera);
    canvas.style.opacity = "1";
  };
  const tick = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    px += (tx - px) * 0.04;
    py += (ty - py) * 0.04;
    spin.rotation.y = now * 0.00005;
    world.rotation.set(0.25 + py * 0.2 + window.scrollY * 0.0005, px * 0.3, 0.12);
    render();
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (!still && !raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const redraw = () => {
    resize();
    if (still) render();
    else start();
  };
  const onScheme = () => {
    paint();
    redraw();
  };
  const onPointer = (e: PointerEvent) => {
    tx = e.clientX / window.innerWidth - 0.5;
    ty = e.clientY / window.innerHeight - 0.5;
  };

  world.rotation.set(0.25, 0, 0.12);
  spin.rotation.y = 0.8;
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
    for (const g of [ico, wire, vertGeo, memberGeo, tetherGeo, arcGeo]) g.dispose();
    for (const m of [latticeMat, vertMat, memberMat, haloMat, tetherMat, arcMat]) m.dispose();
    dot.dispose();
    renderer.dispose();
    canvas.remove();
  };
}
