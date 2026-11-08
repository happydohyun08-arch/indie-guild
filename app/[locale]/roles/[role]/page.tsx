import { notFound } from "next/navigation";
import { getProfiles } from "../../../../lib/guild";
import { fill, ROLES, tr, ui, type Locale } from "../../../../lib/i18n";
import MemberTable, { ListHeader } from "../../MemberTable";

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
  const profiles = getProfiles().filter((p) => p.roles?.includes(role as Role));
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ListHeader
        title={fill(ui(locale).roleTitle, { x: tr(ROLES[role as Role], locale) })}
        locale={locale}
      />
      <MemberTable profiles={profiles} locale={locale} />
    </main>
  );
}
