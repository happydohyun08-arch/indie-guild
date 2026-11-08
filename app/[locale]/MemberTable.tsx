import Link from "next/link";
import { getVouches, type Profile } from "../../lib/guild";
import { fill, OPEN_TO, ROLES, tr, ui, type Locale } from "../../lib/i18n";

/** 프로필 목록·직군·니즈·랜딩이 같이 쓰는 멤버 표. */
export default function MemberTable({
  profiles,
  locale,
}: {
  profiles: Profile[];
  locale: Locale;
}) {
  const t = ui(locale);
  const vouches = getVouches();
  const received = new Map<string, number>();
  for (const v of vouches) received.set(v.to, (received.get(v.to) ?? 0) + 1);

  return (
    <div className="panel overflow-hidden">
      <p className="border-b border-line bg-subtle px-4 py-2 text-meta text-muted">
        {fill(t.homeCounts, {
          m: profiles.length,
          v: vouches.filter((v) => profiles.some((p) => p.handle === v.to)).length,
        })}
      </p>
      {profiles.length === 0 ? (
        <p className="px-4 py-6 text-muted">
          {t.homeEmpty} <Link href={`/${locale}/join`}>{t.homeEmptyLink}</Link>
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {profiles.map((p) => (
            <li key={p.handle}>
              <Link
                href={`/${locale}/${p.handle}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 px-4 py-3 text-ink hover:bg-subtle hover:text-ink hover:no-underline sm:grid-cols-[11rem_minmax(0,1fr)_minmax(0,13rem)_6rem] sm:items-baseline"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.handle}</span>
                  {p.roles && p.roles.length > 0 && (
                    <span className="block truncate text-meta text-muted">
                      {p.roles.map((r) => tr(ROLES[r], locale)).join(", ")}
                    </span>
                  )}
                </span>
                <span className="text-right text-meta text-muted sm:order-last">
                  <span className="font-mono text-ink">{received.get(p.handle) ?? 0}</span>{" "}
                  {t.homeVouches}
                </span>
                <span className="col-span-2 min-w-0 sm:col-span-1">{p.tagline}</span>
                <span className="col-span-2 min-w-0 text-meta text-muted sm:col-span-1">
                  {p.open_to.map((o) => tr(OPEN_TO[o], locale)).join(", ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 목록 페이지 공통 머리: 제목 + 등록 버튼. */
export function ListHeader({ title, locale }: { title: string; locale: Locale }) {
  const t = ui(locale);
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <Link href={`/${locale}`} className="text-meta text-muted hover:text-ink">
          ← {t.brand}
        </Link>
        <h1 className="mt-1 text-page font-semibold tracking-tight">{title}</h1>
      </div>
      <Link href={`/${locale}/join`} className="btn btn-primary">
        {t.homeCta}
      </Link>
    </div>
  );
}
