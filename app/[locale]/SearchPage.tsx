import { Suspense } from "react";
import { getTalents } from "../../lib/guild";
import type { Locale } from "../../lib/i18n";
import TalentSearch, { TalentSearchLive, type Preset } from "./TalentSearch";

/** 인재 찾기·직군·니즈 페이지 공통 본문. */
export default function SearchPage({
  title,
  locale,
  preset,
}: {
  title: string;
  locale: Locale;
  preset?: Preset;
}) {
  const talents = getTalents();
  const props = { talents, locale, preset };
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-page font-semibold tracking-tight">{title}</h1>
      {/* fallback이 정적 HTML이 된다: URL을 모르는 상태 = 전체(또는 프리셋) 목록. */}
      <Suspense fallback={<TalentSearch {...props} />}>
        <TalentSearchLive {...props} />
      </Suspense>
    </main>
  );
}
