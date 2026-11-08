import { notFound } from "next/navigation";
import { fill, ROLES, tr, ui, type Locale } from "../../../../lib/i18n";
import SearchPage from "../../SearchPage";

type Role = keyof typeof ROLES;

export function generateStaticParams() {
  return Object.keys(ROLES).map((role) => ({ role }));
}

export default async function RolePage({
  params,
}: {
  params: Promise<{ locale: string; role: string }>;
}) {
  const { locale: raw, role } = await params;
  const locale = raw as Locale;
  if (!(role in ROLES)) notFound();
  return (
    <SearchPage
      title={fill(ui(locale).roleTitle, { x: tr(ROLES[role as Role], locale) })}
      locale={locale}
      preset={{ role: role as Role }}
    />
  );
}
