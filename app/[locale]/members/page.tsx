import { getProfiles } from "../../../lib/guild";
import { ui, type Locale } from "../../../lib/i18n";
import MemberTable, { ListHeader } from "../MemberTable";

export default async function Members({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ListHeader title={ui(locale).membersTitle} locale={locale} />
      <MemberTable profiles={getProfiles()} locale={locale} />
    </main>
  );
}
