import legal from "../../legal.json";
import { tr, type Bi, type Locale } from "../../lib/i18n";

export type Part = { h: Bi; p: (Bi | Bi[])[] };

/** 약관·처리방침 공용 화면. 문단 배열 안의 배열은 목록으로 그린다. */
export default function LegalDoc({ locale, title, parts }: { locale: Locale; title: Bi; parts: Part[] }) {
  const fillOfficer = (s: string) => s.replace("{name}", legal.officer.name).replace("{email}", legal.officer.email);
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="home-title">{tr(title, locale)}</h1>
      <p className="mt-2 text-meta text-muted">
        {legal.updated} · {tr(legal.draft, locale)}
      </p>
      {parts.map((s) => (
        <section key={s.h.en} className="mt-6 border-t border-line pt-4">
          <h2 className="font-semibold">{tr(s.h, locale)}</h2>
          {s.p.map((x, i) =>
            Array.isArray(x) ? (
              <ul key={i} className="mt-1 list-disc pl-5 text-muted">
                {x.map((li) => (
                  <li key={li.en}>{tr(li, locale)}</li>
                ))}
              </ul>
            ) : (
              <p key={i} className="mt-1 text-muted">
                {fillOfficer(tr(x, locale))}
              </p>
            ),
          )}
        </section>
      ))}
    </main>
  );
}
