"use client";

import { useEffect, useRef } from "react";
import type { Graph } from "./guild-scene";

/** three는 첫 페인트 뒤 유휴 시간에 동적 import 한다 (SSR 없음, 시작 페이지 전용 청크).
 *  움직임 줄이기 설정이면 정지 화면 한 장만 그리고, WebGL이 없으면 아무것도 그리지 않는다. */
export default function GuildScene({ nodes, edges }: Graph) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let stop: (() => void) | undefined;
    let dead = false;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const go = () =>
      import("./guild-scene").then((m) => {
        if (dead) return;
        try {
          stop = m.mount(el, { nodes, edges }, still);
        } catch {
          // WebGL 없음: 평범한 배경으로 둔다.
        }
      });
    const idle = "requestIdleCallback" in window;
    const id = idle ? window.requestIdleCallback(go, { timeout: 1500 }) : window.setTimeout(go, 300);
    return () => {
      dead = true;
      if (idle) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
      stop?.();
    };
  }, [nodes, edges]);

  return <div ref={host} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" />;
}
