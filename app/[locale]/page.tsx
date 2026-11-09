import Link from "next/link";
import { getTalents, getVouches } from "../../lib/guild";
import { fill, NEEDS, ui, type Locale } from "../../lib/i18n";
import GuildScene from "./GuildScene";
import Pop from "./Pop";
import Rotator from "./Rotator";
import { Avatar } from "./TalentCard";

type Need = (typeof NEEDS)[number];

/** 시작 페이지: 방문 목적부터 나눈다. 뒤에는 실제 프로필·보증으로 그린 3D 길드(GuildScene). */
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

  return (
    <main className="relative isolate overflow-x-clip">
      <GuildScene nodes={talents.length} edges={edges} />
      <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-20 sm:px-6 sm:pt-24 sm:pb-28">
        <p className="eyebrow">{talents.length ? fill(t.startEyebrow, { n: talents.length }) : t.brand}</p>
        <h1 className="display mt-4">
          <Rotator lines={t.startHeadline} />
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-6 text-muted">{t.startLead}</p>

        <div className="mt-16 flex max-w-3xl flex-col gap-14">
          {GROUPS.map((g) => (
            <section key={g.title} aria-labelledby={g.title}>
              <p className="eyebrow">{t[g.label]}</p>
              <h2 id={g.title} className="mt-2 text-page font-semibold tracking-tight">
                {t[g.title]}
              </h2>
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
      </div>
    </main>
  );
}
