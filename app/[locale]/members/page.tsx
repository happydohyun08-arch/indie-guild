import Link from "next/link";
import { getTalents } from "../../../lib/guild";
import { fill, ROLES, tr, ui, type Locale } from "../../../lib/i18n";
import SearchPage from "../SearchPage";

type Role = keyof typeof ROLES;

export default async function Members({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  const t = ui(locale);
  const talents = getTalents();
  const roles = (
    <nav
      id="roles"
      aria-label={t.rolesTitle}
      className="mb-5 flex scroll-mt-20 flex-wrap items-center gap-x-1 gap-y-2 text-meta"
    >
      <span className="mr-2 text-muted">{t.quickRoles}</span>
      {(Object.keys(ROLES) as Role[]).map((r) => (
        <Link key={r} href={`/${locale}/roles/${r}`} className="quick-link">
          {tr(ROLES[r], locale)}{" "}
          <span className="text-muted">
            {fill(t.peopleCount, { n: talents.filter((p) => p.roles.includes(r)).length })}
          </span>
        </Link>
      ))}
    </nav>
  );
  return <SearchPage title={t.membersTitle} locale={locale} intro={roles} />;
}
