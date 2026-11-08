import consent from "../../../consent.json";
import legal from "../../../legal.json";
import type { Locale } from "../../../lib/i18n";
import LegalDoc, { type Part } from "../LegalDoc";

/** 처리방침 = 가입 동의서(consent.json)의 핵심 + 법정 기재사항(legal.json). 같은 내용을 두 번 쓰지 않는다. */
export default async function Privacy({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  const core: Part[] = [
    { h: { en: "Purpose", ko: "처리 목적" }, p: [consent.purpose] },
    { h: { en: "What we collect", ko: "처리 항목" }, p: [consent.collected] },
    { h: { en: "What we never collect", ko: "수집하지 않는 항목" }, p: [consent.never_collected] },
    { h: { en: "Retention", ko: "보유 기간" }, p: [consent.retention] },
    {
      h: { en: "Processors and transfer abroad", ko: "처리 위탁과 국외 이전" },
      p: [consent.transfer.recipient, consent.transfer.method, consent.transfer.country],
    },
    { h: { en: "Your rights", ko: "정보주체의 권리" }, p: [consent.rights, consent.us.rights] },
  ];
  return <LegalDoc locale={locale} title={legal.privacy.title} parts={[...core, ...legal.privacy.sections]} />;
}
