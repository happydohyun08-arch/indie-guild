import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import consentJson from "../consent.json";
import type { CRITERIA, MRR_BANDS, OPEN_TO, STAGE } from "./i18n";

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

export function repoUrl(): string {
  return `https://github.com/${consentSpec.repo}`;
}
