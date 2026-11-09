"use client";

import { useEffect, useState } from "react";

/** 페이지를 열거나 새로고침할 때마다 문구 하나를 고른다. 직전에 본 문구는 피한다.
 *  고르기 전엔 자리만 잡아 두어 첫 문구가 번쩍였다 바뀌지 않게 한다. 화면 낭독기는 첫 문구만 읽는다. */
export default function Rotator({ lines, id = "headline" }: { lines: readonly string[]; id?: string }) {
  const [i, setI] = useState<number | null>(null);
  useEffect(() => {
    let last = -1;
    try { last = Number(sessionStorage.getItem(id) ?? -1); } catch {}
    let n = Math.floor(Math.random() * lines.length);
    if (lines.length > 1 && n === last) n = (n + 1) % lines.length;
    try { sessionStorage.setItem(id, String(n)); } catch {}
    setI(n);
  }, [lines.length, id]);
  return (
    <>
      <span className="sr-only">{lines[0]}</span>
      <span aria-hidden className="rotator" data-pending={i === null ? "" : undefined}>
        {lines[i ?? 0]}
      </span>
    </>
  );
}
