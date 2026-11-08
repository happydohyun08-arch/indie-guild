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
  ROLES,
  STAGE,
  tr,
  ui,
  type Locale,
} from "../../../lib/i18n";
import { Avatar } from "../TalentCard";

// The only label the data file lacks; kept here, not in lib/i18n.ts.
const TOTAL = { en: "Total", ko: "합계" };

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

  const tabs = [
    ["products", t.productsTitle, true],
    ["experience", t.experienceTitle, !!profile.experience?.length],
    ["skills", t.skillsTitle, !!profile.skills?.length],
    ["vouches", t.receivedTitle, true],
    ["ai-eval", t.evalTab, !!evaluation],
  ] as const;
  const githubUrl = stats?.html_url ?? `https://github.com/${profile.github}`;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar handle={profile.handle} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-page font-bold tracking-tight break-words">{profile.handle}</h1>
            <p className="mt-0.5 text-title">{profile.tagline}</p>
            {profile.roles && profile.roles.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1" aria-label={t.rolesLabel}>
                {profile.roles.map((r) => (
                  <li key={r}>
                    <Link href={`/${locale}/roles/${r}`} className="chip chip-link">
                      {tr(ROLES[r], locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-meta">
              <span className="text-muted">{t.needsLabel} </span>
              {profile.open_to.map((o) => tr(OPEN_TO[o], locale)).join(" · ")}
            </p>
            {profile.bio && <p className="mt-2 max-w-[72ch] text-muted">{profile.bio}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
            <a href={githubUrl} target="_blank" rel="noreferrer" className="btn btn-primary justify-center">
              {t.contactGithub}
            </a>
            <a href={vouchUrl} target="_blank" rel="noreferrer" className="btn justify-center">
              {t.vouchAction}
            </a>
          </div>
        </div>
      </section>

      <nav aria-label={profile.handle} className="profile-tabs">
        <ul className="flex gap-6 overflow-x-auto">
          {tabs
            .filter(([, , show]) => show)
            .map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`}>{label}</a>
              </li>
            ))}
        </ul>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <aside className="flex min-w-0 flex-col gap-4 self-start lg:sticky lg:top-32 lg:order-last">
          <section className="panel p-4">
            <h2 className="section-title">{t.metricsTitle}</h2>
            {stats ? (
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-y-1">
                <dt className="text-muted">{t.repos}</dt>
                <dd className="font-mono text-meta">{stats.public_repos}</dd>
                <dt className="text-muted">{t.stars}</dt>
                <dd className="font-mono text-meta">{stats.stars}</dd>
                <dt className="text-muted">{t.created}</dt>
                <dd className="font-mono text-meta">{stats.created_at}</dd>
              </dl>
            ) : (
              <p className="text-meta text-muted">{t.metricsFailNote}</p>
            )}
            <p className={stats ? "mt-2 text-xs text-muted" : "mt-2 text-xs font-medium text-warn"}>
              {stats ? t.metricsAuto : t.metricsFailed}
            </p>
          </section>

          <section className="panel p-4">
            <h2 className="section-title">{t.contactTitle}</h2>
            <a href={githubUrl} target="_blank" rel="noreferrer" className="break-all">
              github.com/{profile.github}
            </a>
            <p className="mt-1 text-meta text-muted">{t.contactNote}</p>
          </section>
        </aside>

        <div className="flex min-w-0 flex-col gap-8">
          <section id="products" aria-labelledby="products-h" className="anchor">
            <h2 id="products-h" className="section-title">
              {t.productsTitle}
            </h2>
            <ul className="panel divide-y divide-line">
              {profile.products.map((p) => (
                <li
                  key={p.url}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 py-3"
                >
                  <div className="min-w-0">
                    <h3 className="font-medium break-words">{p.name || p.url}</h3>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-meta break-all"
                    >
                      {p.url.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                  <p className="text-meta text-muted">
                    <span className={p.stage === "live" ? "text-proof" : undefined}>
                      {tr(STAGE[p.stage], locale)}
                    </span>
                    {p.mrr_band && (
                      <>
                        {" · "}
                        <span className="font-mono">{tr(MRR_BANDS[p.mrr_band], locale)}</span>
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {profile.experience && profile.experience.length > 0 && (
            <section id="experience" aria-labelledby="experience-h" className="anchor">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <h2 id="experience-h" className="section-title">
                  {t.experienceTitle}
                </h2>
                <p className="mb-2 text-xs text-muted">{t.experienceAuto}</p>
              </div>
              <ul className="panel divide-y divide-line">
                {profile.experience.map((e) => (
                  <li
                    key={`${e.org}-${e.from}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 px-4 py-3 sm:grid-cols-[9.5rem_minmax(0,1fr)_auto] sm:items-baseline"
                  >
                    <span className="col-span-2 font-mono text-meta text-muted sm:col-span-1">
                      {e.from} – {e.to ?? t.experiencePresent}
                    </span>
                    <span className="min-w-0">
                      <span className="font-medium">{e.role}</span>
                      <span className="text-muted"> · {e.org}</span>
                    </span>
                    <a
                      href={e.proof}
                      target="_blank"
                      rel="noreferrer"
                      className="text-meta"
                    >
                      {t.experienceProof} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <section id="skills" aria-labelledby="skills-h" className="anchor">
              <h2 id="skills-h" className="section-title">
                {t.skillsTitle}
              </h2>
              <ul className="flex flex-wrap gap-1.5">
                {profile.skills.map((k) => (
                  <li key={k} className="chip">
                    {k}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section id="vouches" aria-labelledby="vouches-h" className="anchor">
            <h2 id="vouches-h" className="section-title">
              {t.receivedTitle} <span className="font-mono">{received.length}</span>
            </h2>
            <div className="panel divide-y divide-line">
              {received.length === 0 ? (
                <p className="px-4 py-3 text-muted">{t.none}</p>
              ) : (
                <ul className="divide-y divide-line">
                  {received.map((v) => (
                    <li key={`${v.from}-${v.to}`} className="px-4 py-3">
                      <div className="flex items-baseline justify-between gap-4">
                        <Link href={`/${locale}/${v.from}`} className="font-medium">
                          {v.from}
                        </Link>
                        <span className="font-mono text-meta text-muted">{v.at}</span>
                      </div>
                      {v.note && <p className="mt-0.5">{v.note}</p>}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                <a
                  href={vouchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn self-start"
                >
                  {t.vouchCta}
                </a>
                <p className="text-meta text-muted">
                  {fill(t.vouchNote, { n: VOUCH_LIMIT_PER_YEAR })}
                </p>
              </div>
              {given.length > 0 && (
                <div className="px-4 py-3">
                  <h3 className="text-meta text-muted">
                    {t.givenTitle}{" "}
                    <span className="font-mono">
                      {given.length}/{VOUCH_LIMIT_PER_YEAR}
                    </span>
                  </h3>
                  <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {given.map((v) => (
                      <li key={`${v.from}-${v.to}`}>
                        <Link href={`/${locale}/${v.to}`}>{v.to}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {evaluation && (
            <section id="ai-eval" aria-labelledby="ai-eval-h" className="anchor">
              <h2 id="ai-eval-h" className="section-title">
                {t.evalTitle}
              </h2>
              <div className="panel">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-line">
                    {(Object.keys(CRITERIA) as (keyof typeof CRITERIA)[]).map((id) => (
                      <tr key={id}>
                        <th scope="row" className="px-4 py-2 font-normal text-muted">
                          {tr(CRITERIA[id], locale)}
                        </th>
                        <td className="px-4 py-2 text-right font-mono text-meta">
                          {evaluation.scores[id]?.score ?? "–"}
                          <span className="text-muted">/20</span>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <th scope="row" className="px-4 py-2 font-medium">
                        {tr(TOTAL, locale)}
                      </th>
                      <td className="px-4 py-2 text-right font-mono text-meta font-semibold">
                        {evaluation.total}
                        <span className="font-normal text-muted">/100</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="border-t border-line px-4 py-3">
                  <p>{tr(evaluation.summary, locale)}</p>
                  <p className="mt-2 text-xs text-muted">
                    {fill(t.evalNote, {
                      model: evaluation.model,
                      date: evaluation.evaluated_at.slice(0, 10),
                    })}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
