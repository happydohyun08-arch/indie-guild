import Link from "next/link";
import { getTalents, getVouches } from "../../lib/guild";
import { CRITERIA, fill, NEEDS, tr, ui, type Locale } from "../../lib/i18n";
import GuildScene from "./GuildScene";
import Pop from "./Pop";
import Rotator from "./Rotator";
import { Avatar } from "./TalentCard";

type Need = (typeof NEEDS)[number];

/** 시작 페이지 = 스크롤 스토리. 화면에 고정된 3D 장면(GuildScene) 위로 다섯 장이 지나가고,
 *  장면은 스크롤 진행도에 따라 구 → 주장·증거·검증 → 기준 7개 → 두 갈래 → 구로 바뀐다.
 *  움직임 줄이기면 고정을 풀고 평범한 문서로 읽힌다 (globals.css .story). */
const GROUPS = [
  {
    label: "startLookLabel",
    title: "startLookTitle",
    choices: [
      { key: "hire", needs: ["hiring", "contract"] },
      { key: "invest", needs: ["investment", "acquisition"] },
    ],
  },
  {
    label: "startShowLabel",
    title: "startShowTitle",
    choices: [
      { key: "beHired", goal: "hiring" },
      { key: "beFunded", goal: "investment" },
    ],
  },
] as const satisfies readonly {
  label: "startLookLabel" | "startShowLabel";
  title: "startLookTitle" | "startShowTitle";
  choices: readonly { key: string; needs?: readonly Need[]; goal?: Need }[];
}[];

export default async function Start({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  const t = ui(locale);
  const talents = getTalents();
  const match = (needs: readonly Need[]) =>
    talents.filter((p) => p.open_to.some((n) => (needs as readonly string[]).includes(n)));

  const index = new Map(talents.map((p, i) => [p.handle, i]));
  const edges = getVouches().flatMap((v): [number, number][] => {
    const a = index.get(v.from);
    const b = index.get(v.to);
    return a === undefined || b === undefined ? [] : [[a, b]];
  });

  const reviewed = talents.filter((p) => p.ai !== null).length;

  return (
    <main className="relative isolate overflow-x-clip">
      <div data-story className="story">
        <div className="story-stage" aria-hidden>
          <GuildScene nodes={talents.length} edges={edges} />
        </div>

        <section className="chapter" aria-labelledby="hero-h">
          <p className="eyebrow">
            <span className="beta-dot" aria-hidden />
            {talents.length ? fill(t.startEyebrow, { n: talents.length }) : t.beta}
          </p>
          <h1 id="hero-h" className="display mt-5">
            <Rotator lines={t.startHeadline} />
          </h1>
          <p className="lead mt-6"><Rotator id="lead" lines={t.startLead} /></p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/${locale}/members`} className="btn btn-primary btn-lg">
              {t.navTalent}
            </Link>
            <Link href={`/${locale}/join`} className="btn btn-lg">
              {t.navJoin}
            </Link>
          </div>
          <p className="scroll-hint mt-14" aria-hidden>
            {t.storyScroll}
          </p>
        </section>

        <section className="chapter" aria-labelledby="how-h">
          <p className="eyebrow">{t.storyHowLabel}</p>
          <h2 id="how-h" className="headline mt-4"><Rotator id="how" lines={t.storyHowTitle} /></h2>
          <ol className="mt-10 flex max-w-xl flex-col gap-3">
            {t.storySteps.map(([title, body], i) => (
              <li key={title} className="panel step">
                <span className="step-n">0{i + 1}</span>
                <span>
                  <span className="block font-semibold text-ink">{title}</span>
                  <span className="block text-muted">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="chapter" aria-labelledby="ai-h">
          <p className="eyebrow">{t.storyAiLabel}</p>
          <h2 id="ai-h" className="headline mt-4"><Rotator id="ai" lines={t.storyAiTitle} /></h2>
          <p className="lead mt-6">{t.storyAiLead}</p>
          <ol className="mt-8 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(CRITERIA) as (keyof typeof CRITERIA)[]).map((k, i) => (
              <li key={k} className="panel criterion">
                <span className="step-n">{i + 1}</span>
                {tr(CRITERIA[k], locale)}
              </li>
            ))}
          </ol>
          {reviewed > 0 && <p className="mt-5 text-meta text-muted">{fill(t.storyAiCount, { n: reviewed })}</p>}
        </section>

        <section className="chapter" aria-labelledby="paths-h">
          <p className="eyebrow">{t.storyPathsLabel}</p>
          <h2 id="paths-h" className="headline mt-4"><Rotator id="paths" lines={t.storyPathsTitle} /></h2>
          <div className="mt-10 flex max-w-3xl flex-col gap-10">
          {GROUPS.map((g) => (
            <section key={g.title} aria-labelledby={g.title}>
              <p className="eyebrow">{t[g.label]}</p>
              <h3 id={g.title} className="mt-2 text-title font-semibold tracking-tight">
                {t[g.title]}
              </h3>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {g.choices.map((c) => {
                  const [title, body] = t.startChoices[c.key];
                  const matches = "needs" in c ? match(c.needs) : [];
                  const href =
                    "needs" in c
                      ? `/${locale}/members/?${c.needs.map((n) => `need=${n}`).join("&")}`
                      : `/${locale}/join/?goal=${c.goal}`;
                  return (
                    <li key={c.key}>
                      <Pop
                        label={fill(t.popPreview, { x: title })}
                        closeLabel={t.popClose}
                        face={
                          <div className="choice">
                            <span className="flex items-baseline justify-between gap-3">
                              <span className="text-title font-semibold tracking-tight">{title}</span>
                              <svg className="choice-arrow" width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                                <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                              </svg>
                            </span>
                            <span className="text-muted">{body}</span>
                            {matches.length > 0 && (
                              <span className="mt-auto pt-3 text-meta text-brand">
                                {fill(t.matchCount, { n: matches.length })}
                              </span>
                            )}
                          </div>
                        }
                      >
                        <p className="eyebrow pr-8">{title}</p>
                        {"needs" in c ? (
                          matches.length ? (
                            <ul className="mt-3 flex flex-col gap-2">
                              {matches.slice(0, 3).map((p) => (
                                <li key={p.handle}>
                                  <Link href={`/${locale}/${p.handle}`} className="pop-row">
                                    <Avatar handle={p.handle} />
                                    <span className="min-w-0">
                                      <span className="block truncate font-semibold text-ink">{p.handle}</span>
                                      <span className="block truncate text-meta text-muted">{p.tagline}</span>
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-3 text-muted">{t.popEmpty}</p>
                          )
                        ) : (
                          <ol className="mt-3 flex flex-col gap-2">
                            {t.popJoinSteps.map((s, i) => (
                              <li key={s} className="flex items-center gap-3">
                                <span className="pop-step">{i + 1}</span>
                                {s}
                              </li>
                            ))}
                          </ol>
                        )}
                        <Link href={href} className="btn btn-primary mt-4 w-full justify-center">
                          {"needs" in c ? (matches.length ? fill(t.popGoFind, { n: matches.length }) : t.navTalent) : t.popGoJoin}
                        </Link>
                      </Pop>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          </div>
        </section>

        <section className="chapter" aria-labelledby="end-h">
          <p className="eyebrow">{t.beta}</p>
          <h2 id="end-h" className="headline mt-4"><Rotator id="end" lines={t.storyEndTitle} /></h2>
          <p className="lead mt-6">{fill(t.storyEndLead, { n: talents.length })}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/${locale}/join`} className="btn btn-primary btn-lg">
              {t.navJoin}
            </Link>
            <Link href={`/${locale}/about`} className="btn btn-lg">
              {t.navCompanies}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
