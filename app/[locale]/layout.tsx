import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LOCALES, OTHER, ui, type Locale } from "../../lib/i18n";
import SearchBox from "./SearchBox";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

function parse(locale: string): Locale {
  if (!(LOCALES as readonly string[]).includes(locale)) notFound();
  return locale as Locale;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const t = ui(parse((await params).locale));
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = parse((await params).locale);
  const t = ui(locale);
  const other = OTHER[locale];
  const nav = [
    [`/${locale}/members`, t.navTalent],
    [`/${locale}/members/#roles`, t.navRoles],
    [`/${locale}/about`, t.navCompanies],
  ] as const;

  return (
    <div lang={locale} className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link
            href={`/${locale}`}
            className="shrink-0 text-[17px] font-bold tracking-tight text-ink hover:text-ink hover:no-underline"
          >
            {t.brand}
          </Link>
          <nav aria-label={t.navMenu} className="hidden items-center gap-5 lg:flex">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className="nav-link">
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <SearchBox id="q-header" locale={locale} className="hidden w-64 lg:block" />
            <Link href={`/${locale}/join`} className="btn btn-primary hidden sm:inline-flex">
              {t.navJoin}
            </Link>
            {/* ponytail: 현재 경로가 아니라 상대 언어의 홈으로 보낸다.
                경로를 유지하려면 usePathname이 필요해 클라이언트 번들이 늘어난다. */}
            <Link
              href={`/${other.locale}`}
              hrefLang={other.locale}
              className="nav-link hidden lg:inline"
            >
              {other.label}
            </Link>

            {/* 모바일 메뉴: <details>라 JS 없이 열고 닫힌다. */}
            <details className="mobile-menu lg:hidden">
              <summary className="btn px-2" aria-label={t.navMenu}>
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                  <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </summary>
              <div className="panel absolute inset-x-4 top-14 z-30 flex flex-col gap-1 p-3 shadow-sm">
                <SearchBox id="q-menu" locale={locale} className="mb-2" />
                {nav.map(([href, label]) => (
                  <Link key={href} href={href} className="menu-link">
                    {label}
                  </Link>
                ))}
                <Link href={`/${other.locale}`} hrefLang={other.locale} className="menu-link">
                  {other.label}
                </Link>
                <Link href={`/${locale}/join`} className="btn btn-primary mt-2 justify-center">
                  {t.navJoin}
                </Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      {children}

      <footer className="mt-auto border-t border-line">
        <p className="mx-auto w-full max-w-6xl px-4 py-5 text-meta text-muted sm:px-6">
          {t.footerNote}{" "}
          <Link href={`/${locale}/join`} className="underline">
            {t.footerLink}
          </Link>
        </p>
      </footer>
    </div>
  );
}
