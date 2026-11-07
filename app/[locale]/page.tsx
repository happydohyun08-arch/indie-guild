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
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-2xl font-semibold">{t.homeTitle}</h1>
      <p className="mt-2 text-sm opacity-70">
        {fill(t.homeIntro, { n: VOUCH_LIMIT_PER_YEAR })}
      </p>

      <p className="mt-6 text-sm">
        {fill(t.homeCounts, { m: profiles.length, v: vouches.length })}
      </p>

      {profiles.length === 0 ? (
        <p className="mt-8 text-sm opacity-60">
          {t.homeEmpty}{" "}
          <Link href={`/${locale}/join`} className="underline">
            {t.homeEmptyLink}
          </Link>
        </p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {profiles.map((p) => (
            <li key={p.handle}>
              <Link
                href={`/${locale}/${p.handle}`}
                className="block h-full rounded border border-current/15 p-4 hover:border-current/40"
              >
                <span className="font-medium">@{p.handle}</span>
                <span className="mt-1 block text-sm opacity-70">
                  {p.tagline}
                </span>
                <span className="mt-3 block text-xs opacity-60">
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
        className="mt-10 inline-block rounded bg-foreground px-4 py-2 font-medium text-background"
      >
        {t.homeCta}
      </Link>
    </main>
  );
}
