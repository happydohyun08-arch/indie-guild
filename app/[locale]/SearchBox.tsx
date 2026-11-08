import Form from "next/form";
import { ui, type Locale } from "../../lib/i18n";

/** 헤더·홈 검색창. 인재 찾기 페이지로 ?q= 를 넘긴다 (JS 없이도 일반 GET 폼). */
export default function SearchBox({
  locale,
  id,
  className = "",
  size = "md",
}: {
  locale: Locale;
  id: string;
  className?: string;
  size?: "md" | "lg";
}) {
  const t = ui(locale);
  return (
    <Form action={`/${locale}/members/`} role="search" className={`relative ${className}`}>
      <label className="sr-only" htmlFor={id}>
        {t.searchLabel}
      </label>
      <svg
        aria-hidden
        width="16"
        height="16"
        viewBox="0 0 16 16"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
      >
        <circle cx="7" cy="7" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="m10.5 10.5 3.5 3.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <input
        id={id}
        name="q"
        type="search"
        placeholder={t.searchPlaceholder}
        className={size === "lg" ? "field field-lg w-full pl-10" : "field w-full pl-9"}
      />
      {size === "lg" && (
        <button type="submit" className="btn btn-primary absolute top-1.5 right-1.5 h-9">
          {t.searchSubmit}
        </button>
      )}
    </Form>
  );
}
