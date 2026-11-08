import Link from "next/link";
import { getProfiles, VOUCH_LIMIT_PER_YEAR } from "../../lib/guild";
import { fill, NEEDS, OPEN_TO, ROLES, tr, ui, type Bi, type Locale } from "../../lib/i18n";
import MemberTable from "./MemberTable";

const RECENT = 5;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  const t = ui(locale);
  const profiles = getProfiles();
  // 등록 시점 = 동의 일자. 별도 날짜 필드를 만들지 않는다.
  const recent = [...profiles]
    .sort((a, b) => b.consent.agreed_at.localeCompare(a.consent.agreed_at))
    .slice(0, RECENT);

  const roleRows = (Object.keys(ROLES) as (keyof typeof ROLES)[]).map(
    (r) => [r, ROLES[r], profiles.filter((p) => p.roles?.includes(r)).length] as const,
  );
  const needRows = NEEDS.map(
    (n) => [n, OPEN_TO[n], profiles.filter((p) => p.open_to.includes(n)).length] as const,
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-[72ch]">
          <h1 className="text-page font-semibold tracking-tight">{t.homeTitle}</h1>
          <p className="mt-2">{t.homeIntro}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-meta text-muted">
            {t.homePoints.map((s) => (
              <li key={s}>{fill(s, { n: VOUCH_LIMIT_PER_YEAR })}</li>
            ))}
          </ul>
        </div>
        <Link href={`/${locale}/join`} className="btn btn-primary">
          {t.homeCta}
        </Link>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Category title={t.byRole} base={`/${locale}/roles`} rows={roleRows} locale={locale} />
        <Category title={t.byNeed} base={`/${locale}/needs`} rows={needRows} locale={locale} />
      </div>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="section-title">{t.recentTitle}</h2>
          <Link href={`/${locale}/members`} className="mb-2 text-meta">
            {t.allProfiles}
          </Link>
        </div>
        <MemberTable profiles={recent} locale={locale} />
      </section>
    </main>
  );
}

function Category({
  title,
  base,
  rows,
  locale,
}: {
  title: string;
  base: string;
  rows: readonly (readonly [string, Bi, number])[];
  locale: Locale;
}) {
  return (
    <section>
      <h2 className="section-title">{title}</h2>
      <ul className="panel divide-y divide-line">
        {rows.map(([id, label, n]) => (
          <li key={id}>
            <Link
              href={`${base}/${id}`}
              className="flex items-baseline justify-between gap-4 px-4 py-2 text-ink hover:bg-subtle hover:text-ink hover:no-underline"
            >
              <span>{tr(label, locale)}</span>
              <span className={n ? "font-mono text-meta" : "font-mono text-meta text-muted"}>{n}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
