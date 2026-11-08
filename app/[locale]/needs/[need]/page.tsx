import { notFound } from "next/navigation";
import { getProfiles } from "../../../../lib/guild";
import { fill, NEEDS, OPEN_TO, tr, ui, type Locale } from "../../../../lib/i18n";
import MemberTable, { ListHeader } from "../../MemberTable";

type Need = (typeof NEEDS)[number];

export function generateStaticParams() {
  return NEEDS.map((need) => ({ need }));
}

export default async function NeedPage({
  params,
}: {
  params: Promise<{ locale: string; need: string }>;
}) {
  const { locale: raw, need } = await params;
  const locale = raw as Locale;
  if (!(NEEDS as string[]).includes(need)) notFound();
  const profiles = getProfiles().filter((p) => p.open_to.includes(need as Need));
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ListHeader
        title={fill(ui(locale).needTitle, { x: tr(OPEN_TO[need as Need], locale) })}
        locale={locale}
      />
      <MemberTable profiles={profiles} locale={locale} />
    </main>
  );
}
