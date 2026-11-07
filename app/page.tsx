import Link from "next/link";
import { LOCALES, ui } from "../lib/i18n";

const NATIVE = { en: "English", ko: "한국어" } as const;

// 루트는 언어 선택만 한다. 정적 export에서는 리다이렉트를 쓸 수 없고,
// 자동 감지보다 두 링크를 보여주는 쪽이 짧고 확실하다.
export default function LanguagePicker() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <h1 className="text-h1 font-bold">Indie Guild</h1>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {LOCALES.map((l) => (
          <li key={l}>
            <Link
              href={`/${l}`}
              hrefLang={l}
              className="sheet block h-full p-4 text-ink hover:border-brand hover:text-ink sm:p-6"
            >
              <span className="font-semibold">{NATIVE[l]}</span>
              <span className="mt-1 block text-small text-muted">
                {ui(l).metaDescription}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
