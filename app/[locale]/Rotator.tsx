"use client";

import { useEffect, useState } from "react";

/** 시작 문구를 몇 초마다 바꿔 보여준다. 첫 문구는 서버에서 그려지고,
 *  움직임 줄이기 환경에서는 바뀌지 않는다. 화면 낭독기에는 첫 문구만 읽힌다. */
export default function Rotator({ lines, ms = 3200 }: { lines: readonly string[]; ms?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (lines.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % lines.length), ms);
    return () => clearInterval(id);
  }, [lines.length, ms]);
  return (
    <>
      <span className="sr-only">{lines[0]}</span>
      <span key={i} aria-hidden className="rotator">
        {lines[i]}
      </span>
    </>
  );
}
