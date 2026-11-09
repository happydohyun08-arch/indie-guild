import Link from "next/link";
import { VOUCH_LIMIT_PER_YEAR } from "../../../lib/guild";
import { fill, ui, type Locale } from "../../../lib/i18n";

/** 기업·투자자 안내: 예전 홈의 3단계 안내와 프로필 규칙. */
export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  const t = ui(locale);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6">
      <section>
        <h1 className="page-title mb-8">{t.companiesTitle}</h1>
        <ol className="grid gap-3 md:grid-cols-3">
          {t.companiesSteps.map(([title, body], i) => (
            <li key={title} className="panel p-5">
              <span className="font-mono text-meta text-brand">0{i + 1}</span>
              <h2 className="mt-1 font-semibold">{title}</h2>
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
          <Link href={`/${locale}/members`} className="btn btn-primary">
            {t.navTalent}
          </Link>
          <Link href={`/${locale}/join`} className="btn">
            {t.navJoin}
          </Link>
        </div>
      </section>
    </main>
  );
}
