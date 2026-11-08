import Link from "next/link";
import {
  getProfiles,
  getVouches,
  VOUCH_LIMIT_PER_YEAR,
} from "../../lib/guild";
import { fill, OPEN_TO, tr, ui, type Locale } from "../../lib/i18n";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as Locale;
  const t = ui(locale);

  const profiles = getProfiles();
  const vouches = getVouches();
  const received = new Map<string, number>();
  for (const v of vouches) {
    received.set(v.to, (received.get(v.to) ?? 0) + 1);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-[72ch]">
          <h1 className="text-page font-semibold tracking-tight">{t.homeTitle}</h1>
          <p className="mt-1 text-meta text-muted">
            {fill(t.homeIntro, { n: VOUCH_LIMIT_PER_YEAR })}
          </p>
        </div>
        <Link href={`/${locale}/join`} className="btn btn-primary">
          {t.homeCta}
        </Link>
      </div>

      <div className="panel mt-6 overflow-hidden">
        <p className="border-b border-line bg-subtle px-4 py-2 text-meta text-muted">
          {fill(t.homeCounts, { m: profiles.length, v: vouches.length })}
        </p>
        {profiles.length === 0 ? (
          <p className="px-4 py-6 text-muted">
            {t.homeEmpty}{" "}
            <Link href={`/${locale}/join`}>{t.homeEmptyLink}</Link>
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {profiles.map((p) => (
              <li key={p.handle}>
                <Link
                  href={`/${locale}/${p.handle}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 px-4 py-3 text-ink hover:bg-subtle hover:text-ink hover:no-underline sm:grid-cols-[11rem_minmax(0,1fr)_minmax(0,13rem)_6rem] sm:items-baseline"
                >
                  <span className="truncate font-medium">{p.handle}</span>
                  <span className="text-right text-meta text-muted sm:order-last">
                    <span className="font-mono text-ink">
                      {received.get(p.handle) ?? 0}
                    </span>{" "}
                    {t.homeVouches}
                  </span>
                  <span className="col-span-2 min-w-0 sm:col-span-1">
                    {p.tagline}
                  </span>
                  <span className="col-span-2 min-w-0 text-meta text-muted sm:col-span-1">
                    {p.open_to.map((o) => tr(OPEN_TO[o], locale)).join(", ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
