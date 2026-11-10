import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import consentJson from "../consent.json";
import type { CRITERIA, MRR_BANDS, OPEN_TO, ROLES, STAGE } from "./i18n";

export const VOUCH_LIMIT_PER_YEAR = 3;

export type ConsentSpec = typeof consentJson;
export const consentSpec: ConsentSpec = consentJson;

export type Profile = {
  handle: string;
  github: string;
  tagline: string;
  bio?: string;
  products: {
    name: string;
    url: string;
    stage: keyof typeof STAGE;
    mrr_band?: keyof typeof MRR_BANDS;
  }[];
  /** 경력. proof는 필수 — 증거 없는 경력은 CI가 거부한다. to 생략 = 현재 재직 중. */
  experience?: {
    role: string;
    org: string;
    from: string;
    to?: string;
    proof: string;
  }[];
  open_to: (keyof typeof OPEN_TO)[];
  /** 직군 (선택). 고정 목록 ROLES 중에서. */
  roles?: (keyof typeof ROLES)[];
  /** 스킬 (선택). 최대 20개, 각 30자 이내, URL 금지 — scripts/validate.mjs가 검사. */
  skills?: string[];
  /** 연락 링크 (선택). 공개 https 페이지 1개 — 이메일·전화번호는 CI가 막는다. */
  contact?: string;
  consent: { version: string; agreed_at: string; agreed: string[] };
};

export type Vouch = { from: string; to: string; note: string; at: string };

/**
 * 동의가 유효한 프로필만 통과시킨다. 동의 없이 머지된 프로필은
 * CI를 뚫고 들어왔더라도 사이트에 게시되지 않는다 (이중 방어).
 */
export function consentValid(p: Profile): boolean {
  if (p.consent?.version !== consentSpec.version) return false;
  const agreed = new Set(p.consent.agreed ?? []);
  return consentSpec.required.every((r) => agreed.has(r.id));
}

function readJsonDir<T>(dir: string): T[] {
  const abs = path.join(process.cwd(), dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(abs, f), "utf8")) as T);
}

export function allProfilesUnfiltered(): Profile[] {
  return readJsonDir<Profile>("profiles");
}

export function getProfiles(): Profile[] {
  return allProfilesUnfiltered()
    .filter(consentValid)
    .sort((a, b) => a.handle.localeCompare(b.handle));
}

export function getProfile(handle: string): Profile | undefined {
  return getProfiles().find((p) => p.handle === handle);
}

export function getVouches(): Vouch[] {
  const members = new Set(getProfiles().map((p) => p.handle));
  // 동의가 유효한 멤버 사이의 보증만 노출한다.
  return readJsonDir<Vouch>("vouches").filter(
    (v) => members.has(v.from) && members.has(v.to),
  );
}

export function vouchesFor(handle: string): Vouch[] {
  return getVouches().filter((v) => v.to === handle);
}

export function vouchesBy(handle: string): Vouch[] {
  return getVouches().filter((v) => v.from === handle);
}

export type Evaluation = {
  model: string;
  evaluated_at: string;
  profile_hash: string;
  total: number;
  scores: Record<keyof typeof CRITERIA, { score: number; evidence: string; fix: string }>;
  summary: { en: string; ko: string };
};

/**
 * scripts/evaluate.mjs가 CI에서 쓴 AI 평가. 프로필 파일 해시가 평가 당시와
 * 같을 때만 돌려준다 — 프로필이 바뀌면 재평가 전까지 낡은 점수를 보이지 않는다.
 */
export function getEvaluation(handle: string): Evaluation | null {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "profiles", `${handle}.json`));
    const ev = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "evaluations", `${handle}.json`), "utf8"),
    ) as Evaluation;
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    return ev.profile_hash === hash ? ev : null;
  } catch {
    return null;
  }
}

export type GithubStats = {
  public_repos: number;
  stars: number;
  created_at: string;
  html_url: string;
};

const statsCache = new Map<string, Promise<GithubStats | null>>();

/**
 * 빌드 시점에 GitHub 공개 API로 지표를 조회한다. 자기신고를 막기 위한 장치.
 * 실패하면 null — 지표 없이 프로필만 렌더된다(빌드를 깨지 않는다).
 * ponytail: 비인증 호출은 시간당 60회 제한. 멤버가 25명을 넘으면
 * GITHUB_TOKEN 환경변수를 설정해 5000회로 늘린다.
 */
export function getGithubStats(login: string): Promise<GithubStats | null> {
  const cached = statsCache.get(login);
  if (cached) return cached;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const task = (async (): Promise<GithubStats | null> => {
    try {
      const [userRes, repoRes] = await Promise.all([
        fetch(`https://api.github.com/users/${login}`, { headers }),
        fetch(
          `https://api.github.com/users/${login}/repos?per_page=100&type=owner`,
          { headers },
        ),
      ]);
      if (!userRes.ok || !repoRes.ok) return null;
      const user = await userRes.json();
      const repos: { stargazers_count: number }[] = await repoRes.json();
      return {
        public_repos: user.public_repos ?? 0,
        stars: repos.reduce((n, r) => n + (r.stargazers_count ?? 0), 0),
        created_at: String(user.created_at ?? "").slice(0, 10),
        html_url: user.html_url ?? `https://github.com/${login}`,
      };
    } catch {
      return null;
    }
  })();

  statsCache.set(login, task);
  return task;
}

/** 링크가 이 GitHub 계정 소유인지 주소로 확인한다: github.com/<계정>/… 또는 <계정>.github.io.
 *  링크가 열리는지(존재)를 넘어, 그 결과물이 정말 본인 계정에 있는지를 보는 검사. */
export function ownedBy(url: string, login: string): boolean {
  try {
    const u = new URL(url);
    const me = login.toLowerCase();
    const host = u.hostname.toLowerCase();
    if (host === `${me}.github.io`) return true;
    return host === "github.com" && u.pathname.split("/")[1]?.toLowerCase() === me;
  } catch {
    return false;
  }
}

export type CiStats = { checked: number; rejected: number; medianSec: number; rejectedUrl: string | null };

/** 빌드 시점에 이 저장소의 PR 검사 실행 기록을 GitHub API에서 센다. 실패하면 null. */
export async function getCiStats(): Promise<CiStats | null> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${consentSpec.repo}/actions/runs?event=pull_request&status=completed&per_page=100`,
      { headers },
    );
    if (!res.ok) return null;
    const body = await res.json();
    const runs: { conclusion: string; run_started_at: string; updated_at: string; html_url: string }[] =
      body.workflow_runs ?? [];
    if (!runs.length) return null;
    const secs = runs
      .map((r) => (Date.parse(r.updated_at) - Date.parse(r.run_started_at)) / 1000)
      .filter((n) => n > 0)
      .sort((x, y) => x - y);
    const failed = runs.filter((r) => r.conclusion === "failure");
    return {
      checked: body.total_count ?? runs.length,
      rejected: failed.length,
      medianSec: Math.round(secs[Math.floor(secs.length / 2)] ?? 0),
      rejectedUrl: failed[0]?.html_url ?? null,
    };
  } catch {
    return null;
  }
}

export function repoUrl(): string {
  return `https://github.com/${consentSpec.repo}`;
}

/** 카드·검색에 쓰는 직렬화 가능한 요약. 클라이언트로 넘어가므로 fs 의존이 없다. */
export type Talent = {
  handle: string;
  tagline: string;
  roles: NonNullable<Profile["roles"]>;
  skills: string[];
  open_to: Profile["open_to"];
  vouches: number;
  /** 유효한 AI 평가 총점. 없으면 null. */
  ai: number | null;
  /** 등록 시점 = 동의 일자. */
  registered: string;
};

export function getTalents(): Talent[] {
  const received = new Map<string, number>();
  for (const v of getVouches()) received.set(v.to, (received.get(v.to) ?? 0) + 1);
  return getProfiles().map((p) => ({
    handle: p.handle,
    tagline: p.tagline,
    roles: p.roles ?? [],
    skills: p.skills ?? [],
    open_to: p.open_to,
    vouches: received.get(p.handle) ?? 0,
    ai: getEvaluation(p.handle)?.total ?? null,
    registered: p.consent.agreed_at,
  }));
}
