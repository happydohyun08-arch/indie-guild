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
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10">
      <h1 className="max-w-[65ch] text-h1 font-bold text-balance sm:text-display">{t.homeTitle}</h1>
      <p className="mt-4 max-w-[65ch] text-body text-muted">
        {fill(t.homeIntro, { n: VOUCH_LIMIT_PER_YEAR })}
      </p>

      <p className="mt-6 text-metric font-semibold">
        {fill(t.homeCounts, { m: profiles.length, v: vouches.length })}
      </p>

      {profiles.length === 0 ? (
        <p className="mt-10 text-small text-muted">
          {t.homeEmpty}{" "}
          <Link href={`/${locale}/join`} className="underline underline-offset-2">
            {t.homeEmptyLink}
          </Link>
        </p>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <li key={p.handle}>
              <Link
                href={`/${locale}/${p.handle}`}
                className="sheet flex h-full flex-col p-4 text-ink hover:border-brand hover:text-ink sm:p-6"
              >
                <span className="font-mono text-metric text-muted">@{p.handle}</span>
                <span className="mt-2 block font-semibold">
                  {p.tagline}
                </span>
                <span className="mt-auto block pt-4 text-small text-muted">
                  {t.homeVouches} {received.get(p.handle) ?? 0} ·{" "}
                  {p.open_to.map((o) => tr(OPEN_TO[o], locale)).join(", ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/${locale}/join`}
        className="mt-10 inline-block rounded-md bg-brand px-5 py-3 font-semibold text-on-brand hover:bg-brand-hover hover:text-on-brand"
      >
        {t.homeCta}
      </Link>
    </main>
  );
}
