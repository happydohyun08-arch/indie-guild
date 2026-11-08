import Link from "next/link";
import { getTalents } from "../../lib/guild";
import { fill, NEEDS, ui, type Locale } from "../../lib/i18n";

type Need = (typeof NEEDS)[number];

/** 시작 페이지: 방문 목적부터 나눈다. A = 찾는 쪽(실제 프로필 수 표시), B = 올리는 쪽. */
const GROUPS = [
  {
    title: "startLookTitle",
    choices: [
      { key: "hire", needs: ["hiring", "contract"] },
      { key: "invest", needs: ["investment", "acquisition"] },
    ],
  },
  {
    title: "startShowTitle",
    choices: [
      { key: "beHired", goal: "hiring" },
      { key: "beFunded", goal: "investment" },
    ],
  },
] as const satisfies readonly {
  title: "startLookTitle" | "startShowTitle";
  choices: readonly { key: string; needs?: readonly Need[]; goal?: Need }[];
}[];

export default async function Start({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  const t = ui(locale);
  const talents = getTalents();
  const count = (needs: readonly Need[]) =>
    talents.filter((p) => p.open_to.some((n) => (needs as readonly string[]).includes(n))).length;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-center text-[20px] leading-8 font-semibold tracking-tight sm:text-[24px]">
        {t.startLead}
      </h1>
      <div className="mt-10 flex flex-col gap-10">
        {GROUPS.map((g) => (
          <section key={g.title} aria-labelledby={g.title}>
            <h2 id={g.title} className="home-title">
              {t[g.title]}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {g.choices.map((c) => {
                const [title, body] = t.startChoices[c.key];
                const href =
                  "needs" in c
                    ? `/${locale}/members/?${c.needs.map((n) => `need=${n}`).join("&")}`
                    : `/${locale}/join/?goal=${c.goal}`;
                return (
                  <li key={c.key}>
                    <Link href={href} className="choice">
                      <span className="text-title font-semibold">{title}</span>
                      <span className="text-muted">{body}</span>
                      {"needs" in c && (
                        <span className="mt-auto pt-2 text-meta text-brand">
                          {fill(t.matchCount, { n: count(c.needs) })}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
