import { notFound } from "next/navigation";
import { fill, NEEDS, OPEN_TO, tr, ui, type Locale } from "../../../../lib/i18n";
import SearchPage from "../../SearchPage";

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
  return (
    <SearchPage
      title={fill(ui(locale).needTitle, { x: tr(OPEN_TO[need as Need], locale) })}
      locale={locale}
      preset={{ need: need as Need }}
    />
  );
}
