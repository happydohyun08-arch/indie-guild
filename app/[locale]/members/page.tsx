import { ui, type Locale } from "../../../lib/i18n";
import SearchPage from "../SearchPage";

export default async function Members({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  return <SearchPage title={ui(locale).membersTitle} locale={locale} />;
}
