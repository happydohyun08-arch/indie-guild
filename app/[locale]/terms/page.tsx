import legal from "../../../legal.json";
import type { Locale } from "../../../lib/i18n";
import LegalDoc from "../LegalDoc";

export default async function Terms({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  return <LegalDoc locale={locale} title={legal.terms.title} parts={legal.terms.sections} />;
}
