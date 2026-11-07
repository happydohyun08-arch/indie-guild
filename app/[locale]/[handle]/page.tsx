import Link from "next/link";
import { notFound } from "next/navigation";
import {
  consentSpec,
  getEvaluation,
  getGithubStats,
  getProfile,
  getProfiles,
  vouchesBy,
  vouchesFor,
  VOUCH_LIMIT_PER_YEAR,
} from "../../../lib/guild";
import {
  CRITERIA,
  fill,
  MRR_BANDS,
  OPEN_TO,
  STAGE,
  tr,
  ui,
  type Locale,
} from "../../../lib/i18n";

export function generateStaticParams() {
  return getProfiles().map((p) => ({ handle: p.handle }));
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { locale: raw, handle } = await params;
  const locale = raw as Locale;
  const t = ui(locale);

  const profile = getProfile(handle);
  if (!profile) notFound();

  const stats = await getGithubStats(profile.github);
  const evaluation = getEvaluation(handle);
  const received = vouchesFor(handle);
  const given = vouchesBy(handle);

  const vouchJson = JSON.stringify(
    {
      from: "YOUR_HANDLE",
      to: handle,
      note: "",
      at: new Date().toISOString().slice(0, 10),
    },
    null,
    2,
  );
  const vouchUrl =
    `https://github.com/${consentSpec.repo}/new/main` +
    `?filename=vouches/YOUR_HANDLE--${handle}.json` +
    `&value=${encodeURIComponent(vouchJson)}`;

  return (
    <main
      data-theme="workshop"
      className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10 sm:px-6"
    >
      <Link href={`/${locale}`} className="inline-block text-small text-muted">
        {t.back}
      </Link>

      <section className="sheet flex flex-wrap items-start gap-8 p-4 sm:p-8">
        <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-3">
          <h1 className="font-mono text-metric text-muted">@{profile.handle}</h1>
          <p className="text-h1 font-bold text-balance sm:text-[40px] sm:leading-[46px]">
            {profile.tagline}
          </p>
          {profile.bio && (
            <p className="max-w-[65ch] text-body text-muted">{profile.bio}</p>
          )}
          <ul className="flex flex-wrap gap-2">
            {profile.open_to.map((o) => (
              <li
                key={o}
                className="rounded-pill border border-brand px-3 py-1 text-[13px] font-semibold text-brand"
              >
                {tr(OPEN_TO[o], locale)}
              </li>
            ))}
          </ul>
        </div>

        {evaluation && (
          <aside
            className="flex min-w-0 flex-[1_1_300px] flex-col gap-3 rounded-sm bg-accent p-5 text-on-accent"
            aria-labelledby="ai-eval"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="ai-eval" className="text-[13px] font-bold">
                {t.evalTitle}
              </h2>
              <span className="font-mono text-[28px] font-semibold">
                {evaluation.total}
                <span className="text-small">/100</span>
              </span>
            </div>
            <dl className="flex flex-col gap-1.5 text-[13px]">
              {(Object.keys(CRITERIA) as (keyof typeof CRITERIA)[]).map((id) => {
                const score = evaluation.scores[id]?.score;
                return (
                  <div
                    key={id}
                    className="grid grid-cols-[7rem_minmax(0,1fr)_3rem] items-center gap-2"
                  >
                    <dt>{tr(CRITERIA[id], locale)}</dt>
                    <span
                      aria-hidden
                      className="block h-1.5 rounded-sm bg-on-accent/20"
                    >
                      <span
                        className="block h-1.5 rounded-sm bg-on-accent"
                        style={{ width: `${((score ?? 0) / 20) * 100}%` }}
                      />
                    </span>
                    <dd className="text-right font-mono">
                      {score ?? "–"}/20
                    </dd>
                  </div>
                );
              })}
            </dl>
            <p className="text-small">{tr(evaluation.summary, locale)}</p>
            <p className="text-small">
              {fill(t.evalNote, {
                model: evaluation.model,
                date: evaluation.evaluated_at.slice(0, 10),
              })}
            </p>
          </aside>
        )}
      </section>

      <section aria-labelledby="products">
        <h2 id="products" className="mb-3 text-h2 font-semibold">
          {t.productsTitle}
        </h2>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-6">
          {profile.products.map((p) => (
            <li key={p.url} className="sheet flex flex-col gap-3 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <h3 className="min-w-0 text-h2 font-semibold break-words">
                  {p.name || p.url}
                </h3>
                <span
                  className={
                    p.stage === "live"
                      ? "shrink-0 rounded-pill bg-proof px-2.5 py-0.5 text-label font-semibold text-on-proof"
                      : "shrink-0 rounded-pill border border-muted px-2.5 py-0.5 text-label font-semibold text-muted"
                  }
                >
                  {tr(STAGE[p.stage], locale)}
                </span>
              </div>
              {p.mrr_band && (
                <span className="font-mono text-metric text-muted">
                  {tr(MRR_BANDS[p.mrr_band], locale)}
                </span>
              )}
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="text-small break-all"
              >
                {p.url.replace(/^https?:\/\//, "")}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-6">
        <section
          id="vouch"
          className="sheet flex min-w-0 flex-[2_1_420px] flex-col gap-4 p-4 sm:p-6"
        >
          <h2 className="text-h2 font-semibold">
            {t.receivedTitle}{" "}
            <span className="font-mono text-metric text-muted">
              {received.length}
            </span>
          </h2>
          {received.length === 0 ? (
            <p className="text-small text-muted">{t.none}</p>
          ) : (
            <ul className="space-y-3">
              {received.map((v) => (
                <li key={`${v.from}-${v.to}`} className="text-small">
                  <Link href={`/${locale}/${v.from}`} className="font-semibold">
                    @{v.from}
                  </Link>
                  <span className="ml-2 font-mono text-muted">{v.at}</span>
                  <p>{v.note}</p>
                </li>
              ))}
            </ul>
          )}
          <div>
            <a
              href={vouchUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-md bg-brand px-5 py-3 font-semibold text-on-brand hover:bg-brand-hover hover:text-on-brand"
            >
              {t.vouchCta}
            </a>
            <p className="mt-2 text-small text-muted">
              {fill(t.vouchNote, { n: VOUCH_LIMIT_PER_YEAR })}
            </p>
          </div>

          {given.length > 0 && (
            <div className="border-t border-line pt-4">
              <h3 className="font-semibold">
                {t.givenTitle}{" "}
                <span className="font-mono text-metric text-muted">
                  {given.length}/{VOUCH_LIMIT_PER_YEAR}
                </span>
              </h3>
              <ul className="mt-2 flex flex-wrap gap-3 text-small">
                {given.map((v) => (
                  <li key={`${v.from}-${v.to}`}>
                    <Link href={`/${locale}/${v.to}`}>@{v.to}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-6">
          <section className="sheet flex flex-col gap-3 p-4 sm:p-6">
            <h2 className="text-h2 font-semibold">{t.metricsTitle}</h2>
            {stats ? (
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-metric">
                <dt className="text-muted">{t.repos}</dt>
                <dd className="font-mono">{stats.public_repos}</dd>
                <dt className="text-muted">{t.stars}</dt>
                <dd className="font-mono">{stats.stars}</dd>
                <dt className="text-muted">{t.created}</dt>
                <dd className="font-mono">{stats.created_at}</dd>
              </dl>
            ) : (
              <p className="text-small text-muted">{t.metricsFailNote}</p>
            )}
            <span className={stats ? "label font-sans text-proof" : "label font-sans text-warn"}>
              {stats ? t.metricsAuto : t.metricsFailed}
            </span>
          </section>

          <section className="sheet flex flex-col gap-2 p-4 sm:p-6">
            <h2 className="text-h2 font-semibold">{t.contactTitle}</h2>
            <a
              href={stats?.html_url ?? `https://github.com/${profile.github}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-metric break-all"
            >
              github.com/{profile.github}
            </a>
            <p className="text-small text-muted">{t.contactNote}</p>
          </section>
        </div>
      </div>
    </main>
  );
}
