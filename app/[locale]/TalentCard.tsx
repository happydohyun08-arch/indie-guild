import Link from "next/link";
import type { Talent } from "../../lib/guild";
import { fill, OPEN_TO, ROLES, tr, ui, type Locale } from "../../lib/i18n";

const MAX_SKILLS = 5;

export function initials(handle: string): string {
  const parts = handle.split(/[-_.]/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : handle.slice(0, 2)).toUpperCase();
}

export function Avatar({ handle, size = "md" }: { handle: string; size?: "md" | "lg" }) {
  return (
    <span aria-hidden className={size === "lg" ? "avatar avatar-lg" : "avatar"}>
      {initials(handle)}
    </span>
  );
}

/** 홈·검색·직군·니즈가 같이 쓰는 인재 카드. 서버·클라이언트 양쪽에서 렌더된다. */
export default function TalentCard({ talent: p, locale }: { talent: Talent; locale: Locale }) {
  const t = ui(locale);
  const extra = p.skills.length - MAX_SKILLS;
  return (
    <article className="panel relative flex h-full flex-col gap-3 p-4 hover:border-line-strong">
      <div className="flex items-start gap-3">
        <Avatar handle={p.handle} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">
            {/* 카드 전체가 링크가 되도록 ::after로 덮는다. */}
            <Link
              href={`/${locale}/${p.handle}`}
              className="text-ink after:absolute after:inset-0 after:rounded-md hover:text-ink"
            >
              {p.handle}
            </Link>
          </h3>
          {p.roles.length > 0 && (
            <p className="truncate text-meta text-muted">
              {p.roles.map((r) => tr(ROLES[r], locale)).join(" · ")}
            </p>
          )}
        </div>
      </div>

      <p className="line-clamp-2">{p.tagline}</p>

      {p.skills.length > 0 && (
        <ul className="flex flex-wrap gap-1" aria-label={t.skillsTitle}>
          {p.skills.slice(0, MAX_SKILLS).map((s) => (
            <li key={s} className="chip">
              {s}
            </li>
          ))}
          {extra > 0 && <li className="chip text-muted">+{extra}</li>}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line pt-3 text-meta">
        <span className="min-w-0 truncate text-muted">
          {p.open_to.map((o) => tr(OPEN_TO[o], locale)).join(", ")}
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span>{fill(t.vouchesShort, { n: p.vouches })}</span>
          {p.ai !== null && (
            <span title={t.evalTitle}>
              {fill(t.aiShort, { n: p.ai })}{" "}
              <span className="text-xs text-muted">({t.aiRef})</span>
            </span>
          )}
        </span>
      </div>
    </article>
  );
}

export function TalentGrid({ talents, locale }: { talents: Talent[]; locale: Locale }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {talents.map((p) => (
        <li key={p.handle}>
          <TalentCard talent={p} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
