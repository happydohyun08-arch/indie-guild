#!/usr/bin/env node
// 동의 없는 프로필과 개인정보 유출을 머지 단계에서 차단한다.
// 사이트 렌더링(lib/guild.ts)도 같은 검사를 하지만, 저장소에 들어오는 것
// 자체를 막아야 Git 히스토리에 남지 않는다. 그래서 CI가 진짜 관문이다.

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const ROOT = path.join(import.meta.dirname, "..");
const VOUCH_LIMIT_PER_YEAR = 3;
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const HANDLE_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/;
// lib/i18n.ts ROLES와 같은 id.
const ROLES = ["frontend", "backend", "fullstack", "mobile", "design", "ai-data", "indie-maker"];
const SKILLS_MAX = 20;
const SKILL_LEN = 30;
// /[locale]/<handle> 과 겹치는 정적 경로. 이 이름의 프로필은 페이지가 가려진다.
const RESERVED = new Set(["join", "members", "roles", "needs", "about", "terms", "privacy", "verify"]);

// proof는 공개 https URL이어야 한다. localhost·사설 IP는 공개 증거가 아니다.
function publicHttps(u) {
  let url;
  try {
    url = new URL(u);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const h = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || !h.includes(".") && !h.includes(":"))
    return false;
  if (/^(127|10|0)\./.test(h) || /^169\.254\./.test(h) || /^192\.168\./.test(h)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  if (h === "::1" || /^f[cd]/.test(h) || /^fe80:/.test(h)) return false;
  return true;
}

// 저장소에 절대 들어와서는 안 되는 패턴. 한 번 커밋되면 되돌릴 수 없다.
const PII = [
  [/[\w.+-]+@[\w-]+\.[a-z]{2,}/i, "이메일 주소"],
  [/\b01[016-9][-. ]?\d{3,4}[-. ]?\d{4}\b/, "휴대전화번호"],
  [/\b0\d{1,2}[-. ]\d{3,4}[-. ]\d{4}\b/, "전화번호"],
  [/\b\d{6}[-\s]?[1-4]\d{6}\b/, "주민등록번호"],
];

export function validate(profiles, vouches, spec) {
  const errors = [];
  const requiredIds = spec.required.map((r) => r.id);
  const handles = new Set();

  for (const { file, raw, data: p } of profiles) {
    const at = (m) => errors.push(`${file}: ${m}`);

    for (const [re, label] of PII) {
      const hit = raw.match(re);
      if (hit) at(`${label}로 보이는 값이 있습니다 ("${hit[0]}"). 제거하세요.`);
    }

    if (!HANDLE_RE.test(p.handle ?? "")) at(`handle 형식이 잘못됐습니다.`);
    if (RESERVED.has(p.handle)) at(`"${p.handle}"은 사이트 경로와 겹쳐 쓸 수 없는 handle입니다.`);
    if (path.basename(file, ".json") !== p.handle)
      at(`파일명이 handle("${p.handle}")과 다릅니다.`);
    if (handles.has(p.handle)) at(`handle이 중복됩니다.`);
    handles.add(p.handle);

    const c = p.consent;
    if (!c) at(`consent 블록이 없습니다. 동의 없이 등록할 수 없습니다.`);
    else {
      if (c.version !== spec.version)
        at(
          `동의 버전이 "${c.version}"입니다. 최신 "${spec.version}"으로 재동의가 필요합니다.`,
        );
      if (!DATE_RE.test(c.agreed_at ?? ""))
        at(`consent.agreed_at이 YYYY-MM-DD가 아닙니다.`);
      const agreed = new Set(c.agreed ?? []);
      const missing = requiredIds.filter((id) => !agreed.has(id));
      if (missing.length) at(`필수 동의 누락: ${missing.join(", ")}`);
    }

    if (!Array.isArray(p.products) || p.products.length === 0)
      at(`products가 비어 있습니다.`);
    for (const prod of p.products ?? []) {
      if (!/^https?:\/\//.test(prod.url ?? ""))
        at(`제품 url이 http(s)가 아닙니다.`);
    }

    if (p.roles !== undefined) {
      if (!Array.isArray(p.roles)) at(`roles는 배열이어야 합니다.`);
      else
        for (const r of p.roles)
          if (!ROLES.includes(r)) at(`roles 값 "${r}"은 허용 목록(${ROLES.join(", ")})에 없습니다.`);
    }
    if (p.skills !== undefined) {
      if (!Array.isArray(p.skills)) at(`skills는 배열이어야 합니다.`);
      else {
        if (p.skills.length > SKILLS_MAX) at(`skills는 최대 ${SKILLS_MAX}개입니다.`);
        for (const k of p.skills) {
          if (typeof k !== "string" || !k.trim()) at(`skills에 빈 값이 있습니다.`);
          else if (k.length > SKILL_LEN) at(`skill "${k}"이 ${SKILL_LEN}자를 넘습니다.`);
          // ponytail: 흔한 TLD만 본다. "Socket.io"·"ASP.NET" 같은 기술명은 통과시키려고 io·net은 뺐다.
          else if (/https?:|www\./i.test(k) || /\w\.(com|dev|org|app|ai|co|kr|me)\b/.test(k))
            at(`skill "${k}"에 URL을 넣을 수 없습니다.`);
        }
      }
    }

    // consent.json이 약속한 경력 형식: 역할·조직·월 단위 기간·공개 증거 링크.
    for (const e of p.experience ?? []) {
      const who = `경력 "${e.role ?? ""}@${e.org ?? ""}"`;
      if (!e.role?.trim?.() || !e.org?.trim?.()) at(`${who}: role과 org는 필수입니다.`);
      if (!publicHttps(e.proof ?? ""))
        at(`${who}: 공개 증거 링크(proof)는 https URL이어야 합니다.`);
      if (!MONTH_RE.test(e.from ?? "")) at(`${who}: from이 YYYY-MM이 아닙니다.`);
      if (e.to !== undefined && !MONTH_RE.test(e.to))
        at(`${who}: to가 YYYY-MM이 아닙니다 (재직 중이면 생략).`);
      if (MONTH_RE.test(e.from ?? "") && MONTH_RE.test(e.to ?? "") && e.to < e.from)
        at(`${who}: to가 from보다 앞섭니다.`);
    }
  }

  const byFrom = new Map();
  const pairs = new Set();

  for (const { file, raw, data: v } of vouches) {
    const at = (m) => errors.push(`${file}: ${m}`);

    for (const [re, label] of PII) {
      const hit = raw.match(re);
      if (hit) at(`${label}로 보이는 값이 있습니다 ("${hit[0]}"). 제거하세요.`);
    }

    if (!handles.has(v.from)) at(`보증인 "${v.from}"이 멤버가 아닙니다.`);
    if (!handles.has(v.to)) at(`대상 "${v.to}"이 멤버가 아닙니다.`);
    if (v.from === v.to) at(`자기 자신을 보증할 수 없습니다.`);
    if (path.basename(file, ".json") !== `${v.from}--${v.to}`)
      at(`파일명은 "${v.from}--${v.to}.json" 이어야 합니다.`);

    const pair = `${v.from}->${v.to}`;
    if (pairs.has(pair)) at(`같은 상대에게 중복 보증할 수 없습니다.`);
    pairs.add(pair);

    if (!DATE_RE.test(v.at ?? "")) at(`at이 YYYY-MM-DD가 아닙니다.`);
    else {
      if (!byFrom.has(v.from)) byFrom.set(v.from, []);
      byFrom.get(v.from).push({ file, t: Date.parse(v.at) });
    }
  }

  // 임의의 365일 구간에 보증이 상한을 넘지 않아야 한다 (롤링 윈도우).
  for (const [from, list] of byFrom) {
    list.sort((a, b) => a.t - b.t);
    for (let i = 0; i + VOUCH_LIMIT_PER_YEAR < list.length; i++) {
      if (list[i + VOUCH_LIMIT_PER_YEAR].t - list[i].t < YEAR_MS) {
        errors.push(
          `${list[i + VOUCH_LIMIT_PER_YEAR].file}: "${from}"의 보증이 365일 내 ${VOUCH_LIMIT_PER_YEAR}개 상한을 넘습니다.`,
        );
      }
    }
  }

  return errors;
}

function readDir(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(abs, f), "utf8");
      return { file: `${dir}/${f}`, raw, data: JSON.parse(raw) };
    });
}

/** 링크를 실제로 열어 본다. 404·410·주소 없음은 죽은 링크(오류), 그 밖의 실패(403·429·시간 초과)는
 *  사이트가 봇을 막는 경우가 많아 경고만 한다. */
export function linkVerdict(status) {
  if (status === "dns" || status === 404 || status === 410) return "dead";
  if (typeof status === "number" && status < 400) return "ok";
  return "warn";
}

async function probe(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      headers: { "user-agent": "indie-guild-link-check" },
    });
    return res.status;
  } catch (e) {
    return /ENOTFOUND|EAI_AGAIN/.test(String(e?.cause?.code ?? e)) ? "dns" : "error";
  }
}

async function checkLinks(profiles) {
  const errors = [];
  for (const { file, data: p } of profiles) {
    const urls = [
      ...(p.products ?? []).map((x) => x.url),
      ...(p.experience ?? []).map((x) => x.proof),
    ].filter((u) => publicHttps(u) || /^http:\/\//.test(u ?? ""));
    for (const u of urls) {
      const st = await probe(u);
      const v = linkVerdict(st);
      if (v === "dead") errors.push(`${file}: 열리지 않는 링크 (${st}) ${u}`);
      else if (v === "warn") console.log(`::warning::${file}: 확인 못 한 링크 (${st}) ${u}`);
      else console.log(`  ok ${st} ${u}`);
    }
  }
  return errors;
}

/** PR로 바뀐 프로필·보증 파일이 PR 작성자 본인 것인지. 저장소 주인(운영자)은 관리 목적으로 예외. */
export function authorErrors(files, author, owner, profilesByHandle) {
  const me = String(author).toLowerCase();
  if (me === String(owner).toLowerCase()) return [];
  const errors = [];
  for (const { file, data } of files) {
    const handle = file.startsWith("vouches/") ? data.from : data.handle;
    const gh = file.startsWith("vouches/") ? profilesByHandle.get(handle)?.github : data.github;
    if (String(gh ?? "").toLowerCase() !== me)
      errors.push(`${file}: PR 작성자(${author})와 이 파일의 GitHub 계정(${gh ?? "없음"})이 다릅니다. 본인 파일만 올릴 수 있습니다.`);
  }
  return errors;
}

function selfcheck() {
  const spec = { version: "v1", required: [{ id: "a" }, { id: "b" }] };
  const ok = {
    handle: "alice",
    products: [{ url: "https://a.com" }],
    consent: { version: "v1", agreed_at: "2026-01-01", agreed: ["a", "b"] },
  };
  const p = (handle, over = {}) => ({
    file: `profiles/${handle}.json`,
    raw: JSON.stringify({ ...ok, handle, ...over }),
    data: { ...ok, handle, ...over },
  });
  const v = (from, to, at) => ({
    file: `vouches/${from}--${to}.json`,
    raw: JSON.stringify({ from, to, at }),
    data: { from, to, at },
  });

  assert.deepEqual(validate([p("alice")], [], spec), [], "정상 프로필은 통과");

  assert.match(
    validate([p("alice", { consent: undefined })], [], spec)[0],
    /consent 블록이 없습니다/,
    "동의 블록 없으면 차단",
  );
  assert.match(
    validate(
      [p("alice", { consent: { ...ok.consent, agreed: ["a"] } })],
      [],
      spec,
    )[0],
    /필수 동의 누락: b/,
    "필수 항목 누락 차단",
  );
  assert.match(
    validate(
      [p("alice", { consent: { ...ok.consent, version: "v0" } })],
      [],
      spec,
    )[0],
    /동의 버전이 "v0"/,
    "구버전 동의 차단",
  );
  assert.match(
    validate([p("alice", { bio: "me@example.com" })], [], spec)[0],
    /이메일 주소로 보이는 값/,
    "이메일 차단",
  );
  assert.match(
    validate([p("alice", { bio: "010-1234-5678" })], [], spec)[0],
    /휴대전화번호로 보이는 값/,
    "전화번호 차단",
  );
  assert.match(
    validate([p("alice", { bio: "900101-1234567" })], [], spec)[0],
    /주민등록번호로 보이는 값/,
    "주민번호 차단",
  );

  const exp = { role: "Engineer", org: "Acme", from: "2024-01", to: "2025-06", proof: "https://acme.com/team" };
  const e = (over) => validate([p("alice", { experience: [{ ...exp, ...over }] })], [], spec);
  assert.deepEqual(e({}), [], "정상 경력은 통과");
  assert.deepEqual(e({ to: undefined }), [], "재직 중(to 생략)은 통과");
  assert.match(e({ proof: undefined })[0], /proof/, "증거 링크 없으면 차단");
  assert.match(e({ from: "2024-13" })[0], /from이 YYYY-MM/, "잘못된 월 차단");
  assert.match(e({ from: "2024/01" })[0], /from이 YYYY-MM/, "월 형식 오류 차단");
  assert.match(e({ to: "2023-12" })[0], /to가 from보다 앞섭니다/, "to<from 차단");
  assert.match(e({ role: " " })[0], /role과 org/, "빈 role 차단");
  assert.match(e({ org: undefined })[0], /role과 org/, "org 누락 차단");
  for (const bad of ["http://acme.com", "https://localhost/x", "https://127.0.0.1/", "https://192.168.0.1/", "https://10.0.0.1/", "https://172.16.0.1/", "https://[::1]/", "not a url", "ftp://acme.com"])
    assert.match(e({ proof: bad })[0], /proof/, `비공개·비https 증거 차단: ${bad}`);

  const r = (over) => validate([p("alice", over)], [], spec);
  assert.deepEqual(r({ roles: ["frontend", "ai-data"], skills: ["TypeScript", "Next.js", "Socket.io", "ASP.NET", "Node.js"] }), [], "정상 roles·skills 통과");
  assert.match(r({ roles: ["ceo"] })[0], /roles 값 "ceo"/, "목록 밖 role 차단");
  assert.match(r({ roles: "frontend" })[0], /roles는 배열/, "배열 아닌 roles 차단");
  assert.match(r({ skills: Array.from({ length: 21 }, (_, i) => `s${i}`) })[0], /최대 20개/, "스킬 21개 차단");
  assert.match(r({ skills: ["x".repeat(31)] })[0], /30자/, "31자 스킬 차단");
  assert.match(r({ skills: [" "] })[0], /빈 값/, "빈 스킬 차단");
  for (const bad of ["https://evil.com", "www.evil", "see evil.com", "my.site.dev"])
    assert.match(r({ skills: [bad] })[0], /URL/, `스킬 URL 차단: ${bad}`);
  assert.match(validate([p("members")], [], spec)[0], /사이트 경로와 겹쳐/, "예약 handle 차단");

  const two = [p("alice"), p("bob")];
  assert.deepEqual(
    validate(two, [v("alice", "bob", "2026-01-01")], spec),
    [],
    "정상 보증은 통과",
  );
  assert.match(
    validate(two, [v("alice", "carol", "2026-01-01")], spec)[0],
    /멤버가 아닙니다/,
    "비멤버 보증 차단",
  );
  assert.match(
    validate(two, [v("alice", "alice", "2026-01-01")], spec)[0],
    /자기 자신을 보증할 수 없습니다/,
    "자기보증 차단",
  );

  const members = ["bob", "carol", "dave", "erin"].map((h) => p(h));
  const burst = [
    v("alice", "bob", "2026-01-01"),
    v("alice", "carol", "2026-02-01"),
    v("alice", "dave", "2026-03-01"),
    v("alice", "erin", "2026-04-01"),
  ];
  assert.match(
    validate([p("alice"), ...members], burst, spec).at(-1),
    /365일 내 3개 상한/,
    "연 3개 상한 초과 차단",
  );

  const spread = [
    v("alice", "bob", "2024-01-01"),
    v("alice", "carol", "2026-02-01"),
    v("alice", "dave", "2026-03-01"),
    v("alice", "erin", "2026-04-01"),
  ];
  assert.deepEqual(
    validate([p("alice"), ...members], spread, spec),
    [],
    "365일을 벗어난 보증은 상한에 포함되지 않음",
  );

  assert.equal(linkVerdict(200), "ok");
  assert.equal(linkVerdict(301), "ok");
  assert.equal(linkVerdict(404), "dead", "404는 죽은 링크");
  assert.equal(linkVerdict("dns"), "dead", "없는 주소는 죽은 링크");
  assert.equal(linkVerdict(403), "warn", "봇 차단은 경고만");
  assert.equal(linkVerdict("error"), "warn", "시간 초과는 경고만");

  const prof = new Map([["alice", { github: "Alice-GH" }]]);
  const pf = (gh) => [{ file: "profiles/alice.json", data: { handle: "alice", github: gh } }];
  assert.deepEqual(authorErrors(pf("alice-gh"), "Alice-GH", "owner", prof), [], "본인 프로필 통과 (대소문자 무시)");
  assert.match(authorErrors(pf("alice-gh"), "mallory", "owner", prof)[0], /다릅니다/, "남의 프로필 차단");
  assert.deepEqual(authorErrors(pf("alice-gh"), "owner", "owner", prof), [], "운영자는 관리 목적 예외");
  const vf = [{ file: "vouches/alice-bob.json", data: { from: "alice", to: "bob" } }];
  assert.deepEqual(authorErrors(vf, "alice-gh", "owner", prof), [], "본인 보증 통과");
  assert.match(authorErrors(vf, "mallory", "owner", prof)[0], /다릅니다/, "남 이름으로 보증 차단");

  console.log("selfcheck 통과");
}

if (process.argv.includes("--selfcheck")) {
  selfcheck();
} else if (process.argv.includes("--author")) {
  // node validate.mjs --author <PR 작성자> <저장소 주인> <바뀐 파일...>
  const i = process.argv.indexOf("--author");
  const [author, owner, ...changed] = process.argv.slice(i + 1);
  const read = (f) => ({ file: f, data: JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8")) });
  const byHandle = new Map(readDir("profiles").map(({ data }) => [data.handle, data]));
  const errors = authorErrors(changed.filter((f) => f.endsWith(".json")).map(read), author, owner, byHandle);
  if (errors.length) {
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`작성자 확인 통과 (${changed.length}개 파일)`);
} else if (process.argv.includes("--links")) {
  const errors = await checkLinks(readDir("profiles"));
  if (errors.length) {
    console.error(`죽은 링크 ${errors.length}건:\n`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log("링크 검사 통과");
} else {
  const spec = JSON.parse(
    fs.readFileSync(path.join(ROOT, "consent.json"), "utf8"),
  );
  const errors = validate(readDir("profiles"), readDir("vouches"), spec);
  if (errors.length) {
    console.error(`검증 실패 ${errors.length}건:\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error(
      `\n동의 사양: consent.json (버전 ${spec.version}). 가입 절차는 /join 페이지를 사용하세요.`,
    );
    process.exit(1);
  }
  console.log("검증 통과");
}
