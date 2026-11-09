"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** 누르면 카드가 앞으로 튀어나오고 아래로 미리보기 패널이 뒤집히며 펼쳐진다.
 *  카드를 누르거나, 카드를 덮는 투명 버튼에서 Enter/Space로 여닫는다. Esc·바깥 누름으로 닫는다.
 *  이동은 패널 안의 링크로만 한다. 움직임은 CSS가 맡는다 (.pop, globals.css). */
export default function Pop({
  label,
  closeLabel,
  face,
  children,
}: {
  label: string;
  closeLabel: string;
  face: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      btn.current?.focus();
    };
    const away = (e: Event) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", away);
    document.addEventListener("focusin", away);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("focusin", away);
    };
  }, [open]);

  return (
    <div ref={root} className="pop" data-open={open ? "" : undefined}>
      {/* 마우스 클릭은 카드 자체가 받는다 (기울기·hover 유지). 버튼은 키보드·화면 낭독기용으로 위에 덮인다. */}
      <div className="pop-face" onClick={() => setOpen((o) => !o)}>
        {face}
        <button
          ref={btn}
          type="button"
          className="pop-hit"
          aria-label={label}
          aria-expanded={open}
          aria-controls={id}
        />
      </div>
      <div id={id} className="pop-panel" hidden={!open}>
        {children}
        <button
          type="button"
          className="pop-close"
          aria-label={closeLabel}
          onClick={() => {
            setOpen(false);
            btn.current?.focus();
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
