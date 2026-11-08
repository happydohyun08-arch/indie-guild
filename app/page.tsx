import Link from "next/link";
import { LOCALES, ui } from "../lib/i18n";

const NATIVE = { en: "English", ko: "한국어" } as const;

// 루트는 언어 선택만 한다. 정적 export에서는 리다이렉트를 쓸 수 없고,
// 자동 감지보다 두 링크를 보여주는 쪽이 짧고 확실하다.
export default function LanguagePicker() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <h1 className="text-title font-semibold">Indie Guild</h1>
      <ul className="panel mt-4 divide-y divide-line">
        {LOCALES.map((l) => (
          <li key={l}>
            <Link
              href={`/${l}`}
              hrefLang={l}
              className="block px-4 py-3 text-ink hover:bg-subtle hover:text-ink hover:no-underline"
            >
              <span className="font-medium">{NATIVE[l]}</span>
              <span className="mt-0.5 block text-meta text-muted">
                {ui(l).metaDescription}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
