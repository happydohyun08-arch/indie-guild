"use client";

import { useEffect } from "react";

const TILT = ".choice, .role-tile, [data-tilt]";

/** 데스크톱 카드 기울기: 포인터 위치를 --rx/--ry로 넘기고 실제 변형은 CSS가 한다.
 *  문서에 리스너 하나만 둔다. 터치·움직임 줄이기 환경에서는 아무것도 하지 않는다. */
export default function Motion() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches)
      return;
    let card: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      const el = e.target instanceof Element ? e.target.closest<HTMLElement>(TILT) : null;
      if (el !== card) {
        card?.style.removeProperty("--rx");
        card?.style.removeProperty("--ry");
        card = el;
      }
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 6}deg`);
      el.style.setProperty("--rx", `${(0.5 - (e.clientY - r.top) / r.height) * 6}deg`);
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => document.removeEventListener("pointermove", move);
  }, []);
  return null;
}
