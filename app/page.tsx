import Link from "next/link";
import { LOCALES, ui } from "../lib/i18n";

const NATIVE = { en: "English", ko: "한국어" } as const;

// 루트는 언어 선택만 한다. 정적 export에서는 리다이렉트를 쓸 수 없고,
// 자동 감지보다 두 링크를 보여주는 쪽이 짧고 확실하다.
export default function LanguagePicker() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center px-5 py-12">
      <h1 className="text-2xl font-semibold">Indie Guild</h1>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {LOCALES.map((l) => (
          <li key={l}>
            <Link
              href={`/${l}`}
              hrefLang={l}
              className="block h-full rounded border border-current/15 p-4 hover:border-current/40"
            >
              <span className="font-medium">{NATIVE[l]}</span>
              <span className="mt-1 block text-sm opacity-70">
                {ui(l).metaDescription}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
