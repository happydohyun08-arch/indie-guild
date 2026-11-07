import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LOCALES, OTHER, ui, type Locale } from "../../lib/i18n";

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

  return (
    <div lang={locale} className="flex flex-1 flex-col">
      <header className="border-b border-line bg-surface">
        <nav className="mx-auto w-full max-w-5xl px-4 sm:px-6 flex items-baseline gap-5 py-4 text-small">
          <Link href={`/${locale}`} className="font-bold text-ink hover:text-ink">
            {t.brand}
          </Link>
          <Link
            href={`/${locale}/join`}
            className="text-muted hover:text-brand"
          >
            {t.navJoin}
          </Link>
          {/* ponytail: 현재 경로가 아니라 상대 언어의 홈으로 보낸다.
              경로를 유지하려면 usePathname이 필요해 클라이언트 번들이 늘어난다. */}
          <Link
            href={`/${other.locale}`}
            hrefLang={other.locale}
            className="ml-auto text-muted hover:text-brand"
          >
            {other.label}
          </Link>
        </nav>
      </header>

      {children}

      <footer className="mt-auto border-t border-line">
        <p className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 text-small text-muted">
          {t.footerNote}{" "}
          <Link href={`/${locale}/join`} className="underline">
            {t.footerLink}
          </Link>
        </p>
      </footer>
    </div>
  );
}
