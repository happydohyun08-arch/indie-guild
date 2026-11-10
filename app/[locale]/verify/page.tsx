import { getCiStats, getProfiles, ownedBy } from "../../../lib/guild";
import { fill, tr, type Locale } from "../../../lib/i18n";

const REPO = "https://github.com/happydohyun08-arch/indie-guild";

/** 검증 구조 한 장. README의 표와 같은 내용을 사이트 안에서 보여 준다 (GitHub 화면은 스크린샷에 안 잡힌다). */
const T = {
  title: { ko: "무엇을, 어떻게 검증하나", en: "What we verify, and how" },
  lead: {
    ko: "서버·DB·로그인이 없습니다. 모든 검사는 PR마다 GitHub Actions에서 돌고, 통과한 것만 사이트가 됩니다.",
    en: "No server, no database, no login. Every check runs in GitHub Actions on each pull request, and only what passes becomes the site.",
  },
  profiles: { ko: "공개 프로필", en: "Public profiles" },
  links: { ko: "PR마다 CI가 여는 링크", en: "Links CI opens on every PR" },
  checks: { ko: "자동 검사", en: "Automated checks" },
  claim: { ko: "주장", en: "Claim" },
  how: { ko: "검사 방법", en: "How it is checked" },
  where: { ko: "코드", en: "Code" },
  limitsTitle: { ko: "한계", en: "Limits" },
  runs: { ko: "실제 CI 실행 기록 보기 →", en: "See real CI runs →" },
  owned: { ko: "본인 계정 소유가 확인된 링크", en: "Links verified as their own" },
  ciTitle: { ko: "실제 측정", en: "Measured" },
  ci: {
    ko: "지금까지 PR 검사 {n}회 · 거절 {r}회 · 한 번 검사에 걸린 시간 중간값 {s}초",
    en: "PR checks so far: {n} · rejected: {r} · median check time: {s}s",
  },
  rejectedRun: { ko: "실제로 거절된 실행 보기 →", en: "See a real rejected run →" },
};

const ROWS: { claim: { ko: string; en: string }; how: { ko: string; en: string }; file: string; auto: boolean }[] = [
  {
    claim: { ko: "증거 링크가 실제로 열린다", en: "Evidence links actually open" },
    how: {
      ko: "제품·증거 링크를 모두 열어 봅니다. 404·410·없는 주소면 PR 실패, 403·429·시간 초과는 경고.",
      en: "Opens every product and proof link. 404, 410 or unknown host fails the PR; 403, 429 and timeouts warn.",
    },
    file: "scripts/validate.mjs",
    auto: true,
  },
  {
    claim: { ko: "모든 경력에 증거가 있다", en: "Every work entry has evidence" },
    how: {
      ko: "공개 https 증거 링크가 없는 경력은 거절. localhost·사설 IP도 거절.",
      en: "Entries without a public https proof URL are rejected, as are localhost and private IPs.",
    },
    file: "scripts/validate.mjs",
    auto: true,
  },
  {
    claim: { ko: "지표는 본인이 쓸 수 없다", en: "Metrics can't be self-reported" },
    how: {
      ko: "저장소 수·스타·계정 생성일은 빌드할 때 GitHub 공개 API에서 직접 가져옵니다.",
      en: "Repos, stars and account age come from the GitHub public API at build time.",
    },
    file: "lib/guild.ts",
    auto: true,
  },
  {
    claim: { ko: "개인정보가 커밋되지 않는다", en: "No personal data gets committed" },
    how: {
      ko: "이메일·전화번호·주민등록번호 패턴을 커밋 전에 막습니다.",
      en: "Email, phone and resident-ID patterns are blocked before they can be committed.",
    },
    file: "scripts/validate.mjs",
    auto: true,
  },
  {
    claim: { ko: "AI 점수는 본인이 못 고친다", en: "Members can't edit AI scores" },
    how: {
      ko: "머지 후 CI가 평가하고 결과 파일은 CI 봇이 커밋합니다. 운영자가 비용을 냅니다.",
      en: "CI evaluates after merge and the CI bot commits the result. The operator pays.",
    },
    file: "scripts/evaluate.mjs",
    auto: true,
  },
  {
    claim: { ko: "프로필 작성자가 본인이다", en: "The profile's author is its owner" },
    how: {
      ko: "PR을 연 GitHub 계정과 바뀐 프로필·보증 파일의 github 필드가 다르면 PR 실패. 저장소 주인(운영자)만 관리 목적 예외.",
      en: "If the account that opened the PR differs from the github field of a changed profile or vouch, the PR fails. Only the repo owner is exempt, for moderation.",
    },
    file: ".github/workflows/validate.yml",
    auto: true,
  },
  {
    claim: { ko: "결과물이 본인 계정에 있다", en: "The work lives on their own account" },
    how: {
      ko: "github.com/<계정>/… 나 <계정>.github.io 링크는 프로필의 GitHub 계정과 일치할 때만 '본인 계정 소유' 표시.",
      en: "github.com/<account>/… and <account>.github.io links get an 'owned' badge only when they match the profile's GitHub account.",
    },
    file: "lib/guild.ts",
    auto: true,
  },
];

const LIMITS = {
  ko: [
    "Git 커밋 이메일은 아무렇게나 정할 수 있어 그것만으로는 신원이 증명되지 않습니다. 신원은 PR을 연 GitHub 계정에 기댑니다.",
    "운영자 계정은 관리 목적으로 작성자 확인에서 빠집니다.",
    "링크가 열린다고 그 내용이 주장을 뒷받침한다는 뜻은 아닙니다. CI는 존재만 확인합니다.",
  ],
  en: [
    "A Git commit email can be anything, so it proves nothing alone; identity rests on the GitHub account that opened the PR.",
    "The owner account is exempt from the author check, for moderation.",
    "A link that opens does not prove its content supports the claim. CI checks existence only.",
  ],
};

export default async function Verify({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  const profiles = getProfiles();
  const links = profiles.reduce(
    (n, p) => n + p.products.length + (p.experience?.length ?? 0),
    0,
  );
  const ci = await getCiStats();
  const owned = profiles.reduce(
    (n, p) => n + p.products.filter((x) => ownedBy(x.url, p.github)).length,
    0,
  );
  const stats = [
    [T.profiles, profiles.length],
    [T.links, links],
    [T.owned, owned],
    [T.checks, ROWS.filter((r) => r.auto).length],
  ] as const;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="page-title">{tr(T.title, locale)}</h1>
        <p className="mt-2 max-w-3xl text-muted">{tr(T.lead, locale)}</p>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, n]) => (
          <li key={label.en} className="panel px-4 py-3">
            <span className="block font-mono text-2xl font-semibold">{n}</span>
            <span className="text-meta text-muted">{tr(label, locale)}</span>
          </li>
        ))}
      </ul>

      {ci && (
        <p className="panel flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
          <span>
            <span className="text-muted">{tr(T.ciTitle, locale)} · </span>
            {fill(tr(T.ci, locale), { n: ci.checked, r: ci.rejected, s: ci.medianSec })}
          </span>
          {ci.rejectedUrl && (
            <a href={ci.rejectedUrl} className="underline">
              {tr(T.rejectedRun, locale)}
            </a>
          )}
        </p>
      )}

      <div className="panel overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-meta text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">{tr(T.claim, locale)}</th>
              <th className="px-4 py-2 font-medium">{tr(T.how, locale)}</th>
              <th className="px-4 py-2 font-medium">{tr(T.where, locale)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ROWS.map((r) => (
              <tr key={r.claim.en}>
                <td className="whitespace-nowrap px-4 py-2 font-medium">
                  <span aria-hidden className={r.auto ? "text-proof" : "text-muted"}>
                    {r.auto ? "✓ " : "◐ "}
                  </span>
                  {tr(r.claim, locale)}
                </td>
                <td className="px-4 py-2 text-muted">{tr(r.how, locale)}</td>
                <td className="px-4 py-2">
                  <a href={`${REPO}/blob/main/${r.file}`} className="font-mono text-meta underline">
                    {r.file}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h2 className="font-semibold">{tr(T.limitsTitle, locale)}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {LIMITS[locale].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <a href={`${REPO}/actions`} className="btn">
          {tr(T.runs, locale)}
        </a>
      </div>
    </main>
  );
}
