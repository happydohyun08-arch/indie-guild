"use client";

import { useEffect } from "react";

const TILT = ".choice, .role-tile, [data-tilt]";
const GLOW = ".panel, .choice, .role-tile";

/** 데스크톱 카드 연출: 포인터 위치를 --rx/--ry(기울기)와 --mx/--my(빛나는 테두리)로 넘기고
 *  실제 변형·빛은 CSS가 한다. 문서에 리스너 하나만 둔다. 터치·움직임 줄이기 환경에서는 아무것도 하지 않는다. */
export default function Motion() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches)
      return;
    let card: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      const el = e.target instanceof Element ? e.target.closest<HTMLElement>(GLOW) : null;
      if (el !== card) {
        card?.style.removeProperty("--rx");
        card?.style.removeProperty("--ry");
        card = el;
      }
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      if (!el.matches(TILT)) return;
      el.style.setProperty("--ry", `${(x / r.width - 0.5) * 6}deg`);
      el.style.setProperty("--rx", `${(0.5 - y / r.height) * 6}deg`);
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => document.removeEventListener("pointermove", move);
  }, []);
  return null;
}
