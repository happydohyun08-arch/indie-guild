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
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Link
        href={`/${locale}`}
        className="text-sm opacity-60 hover:opacity-100"
      >
        {t.back}
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">@{profile.handle}</h1>
      <p className="mt-1 opacity-80">{profile.tagline}</p>
      {profile.bio && <p className="mt-3 text-sm opacity-70">{profile.bio}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {profile.open_to.map((o) => (
          <span
            key={o}
            className="rounded-full border border-current/20 px-2 py-0.5 text-xs"
          >
            {tr(OPEN_TO[o], locale)}
          </span>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="font-semibold">
          {t.metricsTitle}{" "}
          <span className="text-xs font-normal opacity-60">
            {stats ? t.metricsAuto : t.metricsFailed}
          </span>
        </h2>
        {stats ? (
          <dl className="mt-2 grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="opacity-60">{t.repos}</dt>
              <dd className="text-lg">{stats.public_repos}</dd>
            </div>
            <div>
              <dt className="opacity-60">{t.stars}</dt>
              <dd className="text-lg">{stats.stars}</dd>
            </div>
            <div>
              <dt className="opacity-60">{t.created}</dt>
              <dd className="text-lg">{stats.created_at}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm opacity-60">{t.metricsFailNote}</p>
        )}
      </section>

      {profile.experience && profile.experience.length > 0 && (
        <section className="mt-8">
          <h2 className="font-semibold">
            {t.experienceTitle}{" "}
            <span className="text-xs font-normal opacity-60">
              {t.experienceAuto}
            </span>
          </h2>
          <ul className="mt-2 space-y-3">
            {profile.experience.map((e) => (
              <li key={`${e.org}-${e.from}`} className="text-sm">
                <span className="font-medium">{e.role}</span>
                <span className="opacity-80"> · {e.org}</span>
                <span className="ml-2 opacity-60">
                  {e.from} – {e.to ?? t.experiencePresent}
                </span>
                <a
                  href={e.proof}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 underline opacity-60 hover:opacity-100"
                >
                  {t.experienceProof}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-semibold">{t.productsTitle}</h2>
        <ul className="mt-2 space-y-3">
          {profile.products.map((p) => (
            <li key={p.url} className="text-sm">
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium underline"
              >
                {p.name || p.url}
              </a>
              <span className="ml-2 opacity-60">
                {tr(STAGE[p.stage], locale)}
              </span>
              {p.mrr_band && (
                <span className="ml-2 opacity-60">
                  · {tr(MRR_BANDS[p.mrr_band], locale)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {evaluation && (
        <section
          className="mt-8 rounded border border-current/20 p-4"
          aria-labelledby="ai-eval"
        >
          <h2 id="ai-eval" className="font-semibold">
            {t.evalTitle}{" "}
            <span className="ml-1 text-lg">{evaluation.total}</span>
            <span className="text-xs font-normal opacity-60">/100</span>
          </h2>
          <p className="mt-1 text-sm opacity-80">
            {tr(evaluation.summary, locale)}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
            {(Object.keys(CRITERIA) as (keyof typeof CRITERIA)[]).map((id) => (
              <div key={id}>
                <dt className="text-xs opacity-60">{tr(CRITERIA[id], locale)}</dt>
                <dd>
                  {evaluation.scores[id]?.score ?? "–"}
                  <span className="text-xs opacity-60">/20</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs opacity-60">
            {fill(t.evalNote, {
              model: evaluation.model,
              date: evaluation.evaluated_at.slice(0, 10),
            })}
          </p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-semibold">
          {t.receivedTitle} <span className="opacity-60">{received.length}</span>
        </h2>
        {received.length === 0 ? (
          <p className="mt-2 text-sm opacity-60">{t.none}</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {received.map((v) => (
              <li key={`${v.from}-${v.to}`} className="text-sm">
                <Link
                  href={`/${locale}/${v.from}`}
                  className="font-medium underline"
                >
                  @{v.from}
                </Link>
                <span className="ml-2 opacity-60">{v.at}</span>
                <p className="opacity-80">{v.note}</p>
              </li>
            ))}
          </ul>
        )}
        <a
          href={vouchUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block rounded border border-current/20 px-3 py-1.5 text-sm"
        >
          {t.vouchCta}
        </a>
        <p className="mt-1 text-xs opacity-60">
          {fill(t.vouchNote, { n: VOUCH_LIMIT_PER_YEAR })}
        </p>
      </section>

      {given.length > 0 && (
        <section className="mt-8">
          <h2 className="font-semibold">
            {t.givenTitle}{" "}
            <span className="opacity-60">
              {given.length}/{VOUCH_LIMIT_PER_YEAR}
            </span>
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {given.map((v) => (
              <li key={`${v.from}-${v.to}`}>
                <Link href={`/${locale}/${v.to}`} className="underline">
                  @{v.to}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-semibold">{t.contactTitle}</h2>
        <a
          href={stats?.html_url ?? `https://github.com/${profile.github}`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm underline"
        >
          github.com/{profile.github}
        </a>
        <p className="mt-1 text-xs opacity-60">{t.contactNote}</p>
      </section>
    </main>
  );
}
