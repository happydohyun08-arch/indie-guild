import Link from "next/link";
import { getTalents, VOUCH_LIMIT_PER_YEAR } from "../../lib/guild";
import { fill, ROLES, tr, ui, type Locale } from "../../lib/i18n";
import SearchBox from "./SearchBox";
import { TalentGrid } from "./TalentCard";

const RECENT = 6;
type Role = keyof typeof ROLES;
const ROLE_IDS = Object.keys(ROLES) as Role[];

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  const t = ui(locale);
  const talents = getTalents();
  const recent = [...talents]
    .sort((a, b) => b.registered.localeCompare(a.registered) || a.handle.localeCompare(b.handle))
    .slice(0, RECENT);
  const count = (r: Role) => talents.filter((p) => p.roles.includes(r)).length;

  return (
    <main className="flex flex-col">
      <section className="border-b border-line bg-surface">
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <h1 className="text-center text-[22px] leading-8 font-bold tracking-tight sm:text-[28px] sm:leading-10">
            {t.heroTitle}
          </h1>
          <SearchBox id="q-hero" locale={locale} size="lg" className="mt-6" />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-meta">
            <span className="mr-2 text-muted">{t.quickRoles}</span>
            {ROLE_IDS.map((r) => (
              <Link key={r} href={`/${locale}/roles/${r}`} className="quick-link">
                {tr(ROLES[r], locale)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6">
        <section id="roles" className="scroll-mt-20">
          <h2 className="home-title">{t.rolesTitle}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ROLE_IDS.map((r) => {
              const n = count(r);
              return (
                <li key={r}>
                  <Link href={`/${locale}/roles/${r}`} className="role-tile">
                    <span className="font-medium">{tr(ROLES[r], locale)}</span>
                    <span className={n ? "text-meta" : "text-meta text-muted"}>
                      {fill(t.peopleCount, { n })}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="home-title mb-0">{t.recentTitle}</h2>
            <Link href={`/${locale}/members`} className="text-meta">
              {t.viewAll} →
            </Link>
          </div>
          {recent.length ? (
            <TalentGrid talents={recent} locale={locale} />
          ) : (
            <p className="panel px-4 py-8 text-center text-muted">
              {t.homeEmpty} <Link href={`/${locale}/join`}>{t.homeEmptyLink}</Link>
            </p>
          )}
        </section>

        <section id="companies" className="scroll-mt-20">
          <h2 className="home-title">{t.companiesTitle}</h2>
          <ol className="grid gap-3 md:grid-cols-3">
            {t.companiesSteps.map(([title, body], i) => (
              <li key={title} className="panel p-5">
                <span className="font-mono text-meta text-brand">0{i + 1}</span>
                <h3 className="mt-1 font-semibold">{title}</h3>
                <p className="mt-1 text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="home-title">{t.trustTitle}</h2>
          <ul className="panel divide-y divide-line">
            {t.homePoints.map((s) => (
              <li key={s} className="flex gap-3 px-5 py-3">
                <span aria-hidden className="text-proof">✓</span>
                {fill(s, { n: VOUCH_LIMIT_PER_YEAR })}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href={`/${locale}/join`} className="btn btn-primary">
              {t.homeCta}
            </Link>
            <Link href={`/${locale}/members`} className="btn">
              {t.navTalent}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
