export const LOCALES = ["en", "ko"] as const;
export type Locale = (typeof LOCALES)[number];

/** consent.json의 사람이 읽는 모든 문구는 이 모양이다. */
export type Bi = { en: string; ko: string };
export const tr = (v: Bi, l: Locale): string => v[l];

export const OTHER: Record<Locale, { locale: Locale; label: string }> = {
  en: { locale: "ko", label: "한국어" },
  ko: { locale: "en", label: "English" },
};

/** 수익 구간은 단일 통화(USD)로만 표기한다. 통화가 섞이면 비교가 불가능하다. */
export const MRR_BANDS = {
  none: { en: "no revenue", ko: "수익 없음" },
  under_1k: { en: "under $1k/mo", ko: "월 $1,000 미만" },
  "1k_5k": { en: "$1k–5k/mo", ko: "월 $1,000~5,000" },
  "5k_20k": { en: "$5k–20k/mo", ko: "월 $5,000~20,000" },
  "20k_plus": { en: "$20k+/mo", ko: "월 $20,000 이상" },
} as const satisfies Record<string, Bi>;

export const OPEN_TO = {
  hiring: { en: "full-time roles", ko: "정규직 채용" },
  contract: { en: "contract work", ko: "외주·계약" },
  investment: { en: "investment", ko: "투자 제안" },
  acquisition: { en: "acquisition", ko: "인수 제안" },
  cofounder: { en: "co-founder", ko: "공동창업" },
  nothing: { en: "not looking", ko: "연결 희망 없음" },
} as const satisfies Record<string, Bi>;

export const STAGE = {
  live: { en: "live", ko: "운영 중" },
  wip: { en: "in progress", ko: "개발 중" },
  sunset: { en: "sunset", ko: "종료" },
} as const satisfies Record<string, Bi>;

/** 직군. scripts/validate.mjs ROLES와 같은 id. */
export const ROLES = {
  frontend: { en: "Frontend", ko: "프론트엔드" },
  backend: { en: "Backend", ko: "백엔드" },
  fullstack: { en: "Full-stack", ko: "풀스택" },
  mobile: { en: "Mobile", ko: "모바일" },
  design: { en: "Design", ko: "디자인" },
  "ai-data": { en: "AI / Data", ko: "AI·데이터" },
  "indie-maker": { en: "Indie maker", ko: "인디 메이커" },
} as const satisfies Record<string, Bi>;

/** 희망 제안 = open_to 중 실제로 연결을 원하는 값. "nothing"은 카테고리가 아니다. */
export const NEEDS = (Object.keys(OPEN_TO) as (keyof typeof OPEN_TO)[]).filter(
  (k) => k !== "nothing",
);

/** scripts/evaluate.mjs CRITERIA와 같은 id·순서. */
export const CRITERIA = {
  tech_depth: { en: "Technical depth", ko: "기술 깊이" },
  traction: { en: "Traction", ko: "실제 성과" },
  differentiation: { en: "Differentiation", ko: "차별성" },
  evidence: { en: "Evidence", ko: "증거·전달력" },
  commercial: { en: "Commercial viability", ko: "상용가능성" },
  design: { en: "Design", ko: "디자인" },
  innovation: { en: "Innovation", ko: "혁신성" },
} as const satisfies Record<string, Bi>;

const en = {
  brand: "Indie Guild",
  navJoin: "Post résumé",
    metaTitle: "Indie Guild",
  metaDescription:
    "Résumés and portfolios where every claim carries a public evidence link. For companies and investors who want to verify before they hire or invest.",
  footerNote:
    "We never collect your email, phone number or legal name. Public Git history cannot be deleted.",
  footerLink: "Read the privacy notice",

  navTalent: "Find talent",
  navRoles: "Roles",
  navCompanies: "For companies & investors",
  navMenu: "Menu",
  searchLabel: "Search talent",
  searchPlaceholder: "Search by handle, skill or headline",
  searchSubmit: "Search",

  startEyebrow: "Indie Guild · {n} builders on record",
  startHeadline: ["Proof over pitch.", "Shipped beats said.", "Links, not claims.", "Let the work talk."],
  startLead: "Résumés and portfolios where every claim links to public proof.",
  startLookLabel: "For teams & investors",
  startLookTitle: "Meet the builders",
  startShowLabel: "For builders",
  startShowTitle: "Let the work speak",
  startChoices: {
    hire: ["Hire", "Full-time or contract, with the evidence attached."],
    invest: ["Invest", "Products open to investment or acquisition."],
    beHired: ["Get hired", "Publish your work. Offers come to you."],
    beFunded: ["Raise", "Show your product and traction to investors."],
  },
  matchCount: "{n} matching profiles",
  joinGoalHiring: "Portfolio for getting hired",
  joinGoalInvestment: "Portfolio for raising investment",
  quickRoles: "Browse by role",
  rolesTitle: "Talent by role",
  peopleCount: "{n}",
  homeEmpty: "No profiles yet.",
  homeEmptyLink: "Be the first to publish",
  companiesTitle: "For companies and investors",
  companiesSteps: [
    ["Search and filter", "Narrow by role, what people are open to (hiring, contract, investment and more) and skills."],
    ["Check the evidence", "Every portfolio item and work-history entry links to public proof. GitHub metrics are fetched, not typed in."],
    ["Contact on GitHub", "We hold no emails or phone numbers. Reach out through the person's GitHub profile."],
  ],
  trustTitle: "Rules every profile follows",
  homePoints: [
    "Every portfolio item and work-history entry carries a public proof link. Entries without one are rejected by CI.",
    "GitHub metrics are fetched from the public API at build time, not self-reported.",
    "Vouches are capped at {n} per person per year.",
    "The AI score is a reference opinion only, not a verified fact.",
  ],

  membersTitle: "Find talent",
  roleTitle: "Job: {x}",
  needTitle: "Open to: {x}",
  rolesLabel: "Job",
  needsLabel: "Open to",
  skillsTitle: "Skills",
  filtersTitle: "Filters",
  skillFilter: "Skill",
  skillPlaceholder: "e.g. Go",
  applyFilters: "Apply",
  resetFilters: "Reset filters",
  resultCount: "{n} people",
  queryIs: "Results for “{q}”",
  sortLabel: "Sort",
  sortRecent: "Recently added",
  sortVouches: "Most vouched",
  sortAi: "AI score",
  emptyResults: "No one matches these filters.",
  vouchesShort: "Vouches {n}",
  aiShort: "AI {n}",
  aiRef: "reference",

  contactGithub: "Contact on GitHub",
  vouchAction: "Vouch",
  evalTab: "AI evaluation",
  metricsTitle: "GitHub metrics",
  metricsAuto: "fetched automatically · cannot be self-reported",
  metricsFailed: "fetch failed",
  metricsFailNote:
    "The GitHub API call failed at build time. The profile is shown without metrics.",
  repos: "Public repos",
  stars: "Total stars",
  created: "Account created",
  experienceTitle: "Web development history",
  experienceAuto: "every entry carries a public evidence link",
  experiencePresent: "present",
  experienceProof: "evidence",
  productsTitle: "Portfolio",
  receivedTitle: "Vouches received",
  none: "None yet.",
  vouchCta: "Vouch for this person",
  vouchNote:
    "Vouches are capped at {n} per person per year. Replace YOUR_HANDLE in both the filename and the from field with your own handle, then commit. Git history records that the commit author is the voucher.",
  evalTitle: "AI evaluation, for reference",
  evalNote:
    "Generated by {model} on {date}, run and paid for by the operator. Members cannot write or edit their scores. An opinion, not a verified fact.",
  givenTitle: "Vouches given",
  contactTitle: "Contact",
  contactNote:
    "We do not collect email addresses or phone numbers. Contact happens through the GitHub profile.",

  joinTitle: "Publish your résumé",
  joinLead:
    "Read the disclosures below and consent to every required item before you can proceed. Nothing is collected before you consent.",
  warnTitle: "Most important disclosure: deletion is not possible",
  secPurpose: "Purpose of collection and use",
  secCollected: "What we collect",
  secNever: "What we never collect",
  secNeverNote:
    "These must never be committed to the repository either. Contact happens only through your GitHub profile.",
  secTransfer: "Cross-border transfer",
  trRecipient: "Recipient",
  trCountry: "Country",
  trMethod: "Method",
  trItems: "Items",
  trPeriod: "Purpose and period",
  trRefusal: "How to refuse",
  secUs: "US privacy notice (CCPA / CPRA)",
  usLaw: "Applicable law",
  usCategories: "Categories collected",
  usSources: "Sources",
  usSensitive: "Sensitive information",
  usSale: "Sale and sharing",
  usRights: "Your rights",
  usDeletionLimit: "Limit on deletion",
  usChildren: "Children",
  secRights: "Rights of the data subject",
  secRefusal: "Right to refuse consent",
  requiredTitle: "Required consent ({a}/{b})",
  handleTitle: "GitHub handle",
  handleError:
    "That is not a valid GitHub handle (lowercase letters, digits and hyphens, up to 39 characters).",
  joinFieldsNote:
    "Optional fields: roles (any of: {roles}) and skills (up to 20 short items, 30 characters each, no URLs). Leave them empty if you prefer; CI rejects any other value.",
  submit: "Consent and create profile PR",
  submitNote:
    "This opens GitHub's new-file editor pre-filled with your profile JSON. Your consent record (version {v}, date, and the items consented to) is committed in that same file, and Git history records that you authored the commit.",
};

const ko: typeof en = {
  brand: "Indie Guild",
  navJoin: "이력서 등록",
    metaTitle: "Indie Guild",
  metaDescription:
    "모든 항목에 공개 증거 링크가 붙은 이력서·포트폴리오. 채용·투자 전에 직접 검증하려는 기업과 투자자를 위한 곳입니다.",
  footerNote:
    "이메일·전화번호·실명은 수집하지 않습니다. 공개 Git 히스토리는 삭제할 수 없습니다.",
  footerLink: "개인정보 고지 읽기",

  navTalent: "인재 찾기",
  navRoles: "직군",
  navCompanies: "기업·투자자 안내",
  navMenu: "메뉴",
  searchLabel: "인재 검색",
  searchPlaceholder: "핸들, 스킬, 한 줄 소개로 검색",
  searchSubmit: "검색",

  startEyebrow: "Indie Guild · 등록된 개발자 {n}명",
  startHeadline: ["말보다 증거.", "이력서 대신 결과물.", "주장 말고 링크.", "만든 것으로 말하세요."],
  startLead: "모든 항목이 공개 증거로 이어지는 이력서와 포트폴리오.",
  startLookLabel: "기업·투자자",
  startLookTitle: "증거로 만나는 개발자",
  startShowLabel: "개발자",
  startShowTitle: "작업으로 말하기",
  startChoices: {
    hire: ["채용", "정규직이나 외주로, 증거와 함께."],
    invest: ["투자", "투자·인수 제안을 받는 제품."],
    beHired: ["채용 제안 받기", "작업을 올려 두면 제안이 찾아옵니다."],
    beFunded: ["투자 유치", "제품과 성과를 투자자에게 보여주세요."],
  },
  matchCount: "해당 프로필 {n}개",
  joinGoalHiring: "채용용 포트폴리오 등록",
  joinGoalInvestment: "투자 유치용 포트폴리오 등록",
  quickRoles: "직군별 보기",
  rolesTitle: "직군별 인재",
  peopleCount: "{n}명",
  homeEmpty: "아직 등록된 인재가 없습니다.",
  homeEmptyLink: "첫 번째로 등록하세요",
  companiesTitle: "기업·투자자라면",
  companiesSteps: [
    ["검색하고 거르기", "직군, 원하는 연결(채용·외주·투자 등), 스킬로 좁혀 보세요."],
    ["증거 확인하기", "포트폴리오와 경력의 모든 항목에 공개 증거 링크가 있습니다. GitHub 지표는 직접 입력이 아니라 자동 조회입니다."],
    ["GitHub로 연락하기", "이메일·전화번호는 보관하지 않습니다. 연락은 당사자의 GitHub 프로필로 하세요."],
  ],
  trustTitle: "모든 프로필에 적용되는 규칙",
  homePoints: [
    "포트폴리오와 경력의 모든 항목에 공개 증거 링크가 붙습니다. 링크 없는 항목은 CI가 거부합니다.",
    "GitHub 지표는 빌드 시점에 공개 API에서 가져옵니다. 자기신고가 아닙니다.",
    "보증은 1인당 연 {n}개로 제한됩니다.",
    "AI 점수는 참고 의견일 뿐, 검증된 사실이 아닙니다.",
  ],

  membersTitle: "인재 찾기",
  roleTitle: "직군: {x}",
  needTitle: "희망 제안: {x}",
  rolesLabel: "직군",
  needsLabel: "희망 제안",
  skillsTitle: "스킬",
  filtersTitle: "필터",
  skillFilter: "스킬",
  skillPlaceholder: "예: Go",
  applyFilters: "적용",
  resetFilters: "필터 초기화",
  resultCount: "인재 {n}명",
  queryIs: "‘{q}’ 검색 결과",
  sortLabel: "정렬",
  sortRecent: "최근 등록",
  sortVouches: "보증 많은 순",
  sortAi: "AI 점수 순",
  emptyResults: "조건에 맞는 인재가 없습니다.",
  vouchesShort: "보증 {n}",
  aiShort: "AI {n}",
  aiRef: "참고용",

  contactGithub: "GitHub에서 연락",
  vouchAction: "보증하기",
  evalTab: "AI 평가",
  metricsTitle: "GitHub 지표",
  metricsAuto: "자동 조회 · 자기신고 불가",
  metricsFailed: "조회 실패",
  metricsFailNote:
    "빌드 시점에 GitHub API 조회가 실패했습니다. 지표 없이 표시합니다.",
  repos: "공개 저장소",
  stars: "누적 스타",
  created: "계정 생성",
  experienceTitle: "웹 개발 이력",
  experienceAuto: "모든 항목에 공개 증거 링크가 붙어 있습니다",
  experiencePresent: "현재",
  experienceProof: "증거",
  productsTitle: "포트폴리오",
  receivedTitle: "받은 보증",
  none: "아직 없습니다.",
  vouchCta: "이 사람을 보증하기",
  vouchNote:
    "보증은 1인당 연 {n}개로 제한됩니다. 파일명과 from 의 YOUR_HANDLE 을 본인 핸들로 바꿔 커밋하세요. 커밋 작성자가 보증인 본인임이 Git 히스토리에 남습니다.",
  evalTitle: "참고용 AI 평가",
  evalNote:
    "{model} · {date} 평가. 운영자가 실행하고 비용을 부담하며, 멤버는 점수를 작성·수정할 수 없습니다. 검증된 사실이 아닌 참고 의견입니다.",
  givenTitle: "보낸 보증",
  contactTitle: "연락",
  contactNote:
    "이메일·전화번호는 수집하지 않습니다. 연락은 GitHub 프로필을 통해 이루어집니다.",

  joinTitle: "이력서 등록",
  joinLead:
    "아래 고지를 읽고 필수 항목에 동의해야 가입 절차로 넘어갈 수 있습니다. 동의 전에는 어떤 정보도 수집하지 않습니다.",
  warnTitle: "가장 중요한 고지: 삭제가 불가능합니다",
  secPurpose: "수집·이용 목적",
  secCollected: "수집 항목",
  secNever: "수집하지 않는 항목",
  secNeverNote:
    "이 항목들은 저장소에 기록해서도 안 됩니다. 연락은 GitHub 프로필을 통해서만 이루어집니다.",
  secTransfer: "국외 이전",
  trRecipient: "이전받는 자",
  trCountry: "이전 국가",
  trMethod: "이전 방법",
  trItems: "이전 항목",
  trPeriod: "목적·기간",
  trRefusal: "거부 방법",
  secUs: "미국 프라이버시 고지 (CCPA / CPRA)",
  usLaw: "적용 법률",
  usCategories: "수집 범주",
  usSources: "수집 출처",
  usSensitive: "민감 정보",
  usSale: "판매·공유",
  usRights: "소비자의 권리",
  usDeletionLimit: "삭제권의 한계",
  usChildren: "아동",
  secRights: "정보주체의 권리",
  secRefusal: "동의를 거부할 권리",
  requiredTitle: "필수 동의 ({a}/{b})",
  handleTitle: "GitHub 핸들",
  handleError:
    "GitHub 핸들 형식이 아닙니다 (영문 소문자·숫자·하이픈, 39자 이내).",
  joinFieldsNote:
    "선택 항목: roles (직군, 다음 중에서: {roles})와 skills (스킬, 최대 20개, 각 30자 이내, URL 금지). 비워 둬도 됩니다. 그 외 값은 CI가 거부합니다.",
  submit: "동의하고 프로필 PR 만들기",
  submitNote:
    "버튼을 누르면 GitHub에 프로필 JSON이 채워진 새 파일 편집 화면이 열립니다. 동의 이력(버전 {v}, 동의 일자, 동의 항목)이 해당 파일에 함께 기록되며, 커밋 작성자가 본인임이 Git 히스토리에 남습니다.",
};

export const UI = { en, ko };
export type UIStrings = typeof en;
export const ui = (l: Locale): UIStrings => UI[l];

export function fill(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m));
}
