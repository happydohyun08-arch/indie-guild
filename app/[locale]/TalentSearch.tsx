"use client";

import Form from "next/form";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Talent } from "../../lib/guild";
import { fill, NEEDS, OPEN_TO, ROLES, tr, ui, type Locale } from "../../lib/i18n";
import { TalentGrid } from "./TalentCard";

type Role = keyof typeof ROLES;
type Need = (typeof NEEDS)[number];
type Sort = "recent" | "vouches" | "ai";
type Query = { q: string; roles: Role[]; needs: Need[]; skill: string; sort: Sort };
export type Preset = { role?: Role; need?: Need };

const ROLE_IDS = Object.keys(ROLES) as Role[];

function parse(sp: URLSearchParams | null, preset: Preset): Query {
  // 직군·니즈 페이지는 URL이 비어 있을 때만 프리셋을 쓴다. 필터를 바꾸면 /members로 간다.
  if (!sp?.toString()) {
    return {
      q: "",
      roles: preset.role ? [preset.role] : [],
      needs: preset.need ? [preset.need] : [],
      skill: "",
      sort: "recent",
    };
  }
  const sort = sp.get("sort");
  return {
    q: (sp.get("q") ?? "").trim(),
    roles: sp.getAll("role").filter((r): r is Role => r in ROLES),
    needs: sp.getAll("need").filter((n): n is Need => (NEEDS as string[]).includes(n)),
    skill: (sp.get("skill") ?? "").trim(),
    sort: sort === "vouches" || sort === "ai" ? sort : "recent",
  };
}

function run(talents: Talent[], q: Query): Talent[] {
  const terms = q.q.toLowerCase().split(/\s+/).filter(Boolean);
  const skill = q.skill.toLowerCase();
  const hits = talents.filter((p) => {
    if (q.roles.length && !p.roles.some((r) => q.roles.includes(r))) return false;
    if (q.needs.length && !p.open_to.some((n) => (q.needs as string[]).includes(n))) return false;
    if (skill && !p.skills.some((s) => s.toLowerCase().includes(skill))) return false;
    if (terms.length) {
      const hay = [
        p.handle,
        p.tagline,
        ...p.skills,
        ...p.roles.flatMap((r) => [ROLES[r].en, ROLES[r].ko]),
      ]
        .join(" ")
        .toLowerCase();
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
  const recent = (a: Talent, b: Talent) =>
    b.registered.localeCompare(a.registered) || a.handle.localeCompare(b.handle);
  const by: Record<Sort, (a: Talent, b: Talent) => number> = {
    recent,
    vouches: (a, b) => b.vouches - a.vouches || recent(a, b),
    ai: (a, b) => (b.ai ?? -1) - (a.ai ?? -1) || recent(a, b),
  };
  return hits.sort(by[q.sort]);
}

type Props = { talents: Talent[]; locale: Locale; preset?: Preset };

/** URL 쿼리를 읽는 버전. 정적 HTML에는 Suspense fallback(전체 목록)이 들어가므로 JS 없이도 모두 보인다. */
export function TalentSearchLive(props: Props) {
  return <TalentSearch {...props} sp={useSearchParams()} />;
}

export default function TalentSearch({
  talents,
  locale,
  preset = {},
  sp = null,
}: Props & { sp?: URLSearchParams | null }) {
  const t = ui(locale);
  const [open, setOpen] = useState(false);
  const q = parse(sp, preset);
  const results = run(talents, q);
  const base = `/${locale}/members/`;
  const filtered = q.q || q.roles.length || q.needs.length || q.skill;
  const submit = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    e.currentTarget.form?.requestSubmit();

  return (
    // key: URL이 바뀌면 폼을 다시 그려 체크 상태를 URL과 맞춘다.
    <Form key={sp?.toString() ?? ""} action={base} replace scroll={false}>
      <div className="grid gap-6 md:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="self-start md:sticky md:top-20">
          <button
            type="button"
            className="btn w-full justify-between md:hidden"
            aria-expanded={open}
            aria-controls="filters"
            onClick={() => setOpen(!open)}
          >
            {t.filtersTitle}
            <span aria-hidden>{open ? "−" : "+"}</span>
          </button>
          <div id="filters" className={`${open ? "mt-3 block" : "hidden"} panel md:mt-0 md:block`}>
            <input type="hidden" name="q" value={q.q} />
            <fieldset className="border-b border-line p-4">
              <legend className="filter-title float-left mb-2 w-full">{t.rolesLabel}</legend>
              {ROLE_IDS.map((r) => (
                <label key={r} className="check">
                  <input
                    type="checkbox"
                    name="role"
                    value={r}
                    defaultChecked={q.roles.includes(r)}
                    onChange={submit}
                  />
                  {tr(ROLES[r], locale)}
                </label>
              ))}
            </fieldset>
            <fieldset className="border-b border-line p-4">
              <legend className="filter-title float-left mb-2 w-full">{t.needsLabel}</legend>
              {NEEDS.map((n) => (
                <label key={n} className="check">
                  <input
                    type="checkbox"
                    name="need"
                    value={n}
                    defaultChecked={q.needs.includes(n)}
                    onChange={submit}
                  />
                  {tr(OPEN_TO[n], locale)}
                </label>
              ))}
            </fieldset>
            <div className="p-4">
              <label htmlFor="skill" className="filter-title mb-2 block">
                {t.skillFilter}
              </label>
              <div className="flex gap-2">
                <input
                  id="skill"
                  name="skill"
                  defaultValue={q.skill}
                  placeholder={t.skillPlaceholder}
                  maxLength={30}
                  className="field min-w-0 flex-1"
                />
                <button type="submit" className="btn">
                  {t.applyFilters}
                </button>
              </div>
            </div>
          </div>
        </aside>

        <section aria-live="polite" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-meta">
              {q.q && <span className="mr-2 font-medium">{fill(t.queryIs, { q: q.q })}</span>}
              <span className="text-muted">{fill(t.resultCount, { n: results.length })}</span>
              {filtered ? (
                <Link href={base} className="ml-3">
                  {t.resetFilters}
                </Link>
              ) : null}
            </p>
            <label className="flex items-center gap-2 text-meta text-muted">
              {t.sortLabel}
              <select name="sort" defaultValue={q.sort} onChange={submit} className="field h-8 py-0">
                <option value="recent">{t.sortRecent}</option>
                <option value="vouches">{t.sortVouches}</option>
                <option value="ai">{t.sortAi}</option>
              </select>
            </label>
          </div>

          {results.length === 0 ? (
            <div className="panel px-4 py-10 text-center">
              <p>{talents.length ? t.emptyResults : t.homeEmpty}</p>
              <Link
                href={talents.length ? base : `/${locale}/join`}
                className="mt-2 inline-block"
              >
                {talents.length ? t.resetFilters : t.homeEmptyLink}
              </Link>
            </div>
          ) : (
            <TalentGrid talents={results} locale={locale} />
          )}
        </section>
      </div>
    </Form>
  );
}
