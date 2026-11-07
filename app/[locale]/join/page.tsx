"use client";

import { use, useState } from "react";
import consent from "../../../consent.json";
import { fill, tr, ui, type Locale } from "../../../lib/i18n";

// 서버 전용 모듈(lib/guild.ts, node:fs)을 끌어오지 않도록 consent.json을 직접 읽는다.

export default function JoinPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = use(params).locale as Locale;
  const t = ui(locale);
  const [handle, setHandle] = useState("");
  const [agreed, setAgreed] = useState<Record<string, boolean>>({});

  const allAgreed = consent.required.every((r) => agreed[r.id]);
  const handleOk = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/.test(handle);
  const ready = allAgreed && handleOk;

  const profileJson = JSON.stringify(
    {
      handle,
      github: handle,
      tagline: "",
      bio: "",
      products: [{ name: "", url: "", stage: "live", mrr_band: "none" }],
      open_to: ["cofounder"],
      consent: {
        version: consent.version,
        agreed_at: new Date().toISOString().slice(0, 10),
        agreed: consent.required.map((r) => r.id),
      },
    },
    null,
    2,
  );

  const prUrl =
    `https://github.com/${consent.repo}/new/main` +
    `?filename=profiles/${handle}.json` +
    `&value=${encodeURIComponent(profileJson)}`;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-h1 font-bold">{t.joinTitle}</h1>
      <p className="mt-3 text-body text-muted">{t.joinLead}</p>

      <div className="sheet mt-8 border-2 border-critical p-4 sm:p-6">
        <h2 className="font-semibold text-critical">
          {t.warnTitle}
        </h2>
        <p className="mt-2 text-small">{tr(consent.retention, locale)}</p>
      </div>

      <Section title={t.secPurpose}>{tr(consent.purpose, locale)}</Section>

      <Section title={t.secCollected}>
        <ul className="list-disc pl-5">
          {consent.collected.map((c) => (
            <li key={c.en}>{tr(c, locale)}</li>
          ))}
        </ul>
      </Section>

      <Section title={t.secNever}>
        <ul className="list-disc pl-5 text-muted">
          {consent.never_collected.map((c) => (
            <li key={c.en}>{tr(c, locale)}</li>
          ))}
        </ul>
        <p className="mt-2">{t.secNeverNote}</p>
      </Section>

      <Section title={t.secTransfer}>
        <Rows
          rows={[
            [t.trRecipient, tr(consent.transfer.recipient, locale)],
            [t.trCountry, tr(consent.transfer.country, locale)],
            [t.trMethod, tr(consent.transfer.method, locale)],
            [t.trItems, tr(consent.transfer.items, locale)],
            [t.trPeriod, tr(consent.transfer.purpose_and_period, locale)],
            [t.trRefusal, tr(consent.transfer.refusal, locale)],
          ]}
        />
      </Section>

      <Section title={t.secUs}>
        <Rows
          rows={[
            [t.usLaw, tr(consent.us.law, locale)],
            [t.usCategories, tr(consent.us.categories, locale)],
            [t.usSources, tr(consent.us.sources, locale)],
            [t.usSensitive, tr(consent.us.sensitive, locale)],
            [t.usSale, tr(consent.us.sale, locale)],
            [t.usRights, tr(consent.us.rights, locale)],
            [t.usDeletionLimit, tr(consent.us.deletion_limit, locale)],
            [t.usChildren, tr(consent.us.children, locale)],
          ]}
        />
      </Section>

      <Section title={t.secRights}>{tr(consent.rights, locale)}</Section>

      <Section title={t.secRefusal}>
        {tr(consent.refusal_consequence, locale)}
      </Section>

      <h2 className="mt-10 text-h2 font-semibold">
        {fill(t.requiredTitle, {
          a: consent.required.filter((r) => agreed[r.id]).length,
          b: consent.required.length,
        })}
      </h2>
      <ul className="mt-3 space-y-3">
        {consent.required.map((r) => (
          <li key={r.id}>
            <label className="flex gap-3 text-small">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-brand"
                checked={!!agreed[r.id]}
                onChange={(e) =>
                  setAgreed((a) => ({ ...a, [r.id]: e.target.checked }))
                }
              />
              <span>
                <span className="font-semibold">{tr(r.label, locale)}</span>
                <span className="block text-muted">{tr(r.detail, locale)}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-h2 font-semibold">{t.handleTitle}</h2>
      <input
        value={handle}
        onChange={(e) => setHandle(e.target.value.trim().toLowerCase())}
        placeholder="octocat"
        aria-label={t.handleTitle}
        className="mt-2 w-full rounded-md border border-muted bg-surface px-3 py-2 font-mono text-body"
      />
      {handle && !handleOk && (
        <p className="mt-1 text-small text-critical">
          {t.handleError}
        </p>
      )}

      <div className="mt-8">
        {ready ? (
          <a
            href={prUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-md bg-brand px-5 py-3 font-semibold text-on-brand hover:bg-brand-hover hover:text-on-brand"
          >
            {t.submit}
          </a>
        ) : (
          <button
            disabled
            className="cursor-not-allowed rounded-md border border-line px-5 py-3 font-semibold text-muted"
          >
            {t.submit}
          </button>
        )}
        <p className="mt-2 text-small text-muted">
          {fill(t.submitNote, { v: consent.version })}
        </p>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-1 text-small">{children}</div>
    </section>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid gap-y-1 sm:grid-cols-[9rem_1fr]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
