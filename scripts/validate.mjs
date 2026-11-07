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
const HANDLE_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/;

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

  console.log("selfcheck 통과");
}

if (process.argv.includes("--selfcheck")) {
  selfcheck();
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
