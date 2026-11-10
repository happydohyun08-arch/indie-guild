# Indie Guild

Résumés and portfolios where every claim carries a public evidence link.
For companies and investors who want to verify before they hire or invest.

- **Every work-history entry needs a public evidence link** — entries without one are rejected by CI.
- **Metrics can't be self-reported** — they are fetched from the GitHub public API at build time.
- **Three vouches per person per year** — scarcity is the point. CI enforces the cap.
- **No database, no login** — profiles are JSON in this repo; publishing and vouching are pull requests.
  The commit author is permanently recorded in Git history, and that *is* the verification.

Available in English (`/en`) and Korean (`/ko`).

## How verification works

There is no server. Every check runs in GitHub Actions on each pull request (`.github/workflows/validate.yml`),
and the site is a static export built only from what passed.

| Claim | How it is checked | Where |
|---|---|---|
| Who wrote the profile | CI fails the PR when the account that opened it differs from the `github` field of any changed profile or vouch. Only the repo owner is exempt, for moderation. | `scripts/validate.mjs --author` |
| The work is on their own account | `github.com/<account>/…` and `<account>.github.io` links get an "owned" badge only when the account matches the profile. | `lib/guild.ts` |
| Every work-history line has evidence | CI rejects an entry without a public `https` `proof` URL, and rejects localhost and private IPs. | `scripts/validate.mjs` |
| The evidence actually exists | CI opens every product and proof link. A 404, 410 or unknown host fails the PR; 403, 429 and timeouts only warn, because many sites block bots. | `scripts/validate.mjs --links` |
| Metrics | Repos, stars and account age come from the GitHub public API at build time. Members cannot type them. | `lib/guild.ts` |
| No personal data | CI blocks emails, phone numbers and resident-registration-number patterns before they can be committed. | `scripts/validate.mjs` |
| AI review | Runs after merge, paid by the operator. Members cannot write or edit scores; the result file is committed by the CI bot. | `scripts/evaluate.mjs` |

**Limits.** A Git commit email can be set to anything, so the commit email alone proves nothing; identity rests on the
GitHub account that opened the PR. The repo owner is exempt from the author check. A link that opens
is not proof that its content supports the claim; CI checks that it exists, not what it says. The AI review only
sees the profile text, a screenshot of each product and GitHub metrics, and it is told to treat all of them as untrusted.

## Publishing your résumé

1. Read the notices at `/en/join` (or `/ko/join`) and tick every required item.
2. Enter your GitHub handle and press the submit button.
3. GitHub opens a new-file editor prefilled with your profile JSON. Fill it in and open a PR.

Each `experience` entry needs `role`, `org`, `from` (`YYYY-MM`) and `proof` (a public URL).
Omit `to` if you still hold the role. Writing the JSON by hand without going through `/join`
leaves no consent record, and CI will reject it.

## Vouching

On someone's profile page, press the vouch button. GitHub opens a new file under `vouches/`.
Replace `YOUR_HANDLE` in both the filename and the `from` field with your own handle, then commit.

## Privacy

`consent.json` is the single source of truth for what is collected and what you are told.
The `/join` page, the renderer and the CI validator all read that one file, so the wording
and the enforcement cannot drift apart. It covers Korean PIPA and the US CCPA/CPRA
notice at collection.

- **Never collected**: email, phone, legal name, date of birth, address, exact revenue figures,
  government IDs, education records (school, degree, grades), salary figures.
- **Contact**: your GitHub profile link only — there is no contact detail stored, so there is nothing to purge.
- **Limits of deletion**: this is a public Git repository. Past commits, third-party forks and
  search-engine caches are beyond our control. You must explicitly consent to this at `/join`
  (CCPA § 1798.105(d) technical infeasibility).
- **No sale, no sharing** — ever, and no financial incentive is offered.

Access, correction, deletion and restriction requests go through a GitHub issue or PR:
answered within 10 days (PIPA) / 45 days (CCPA).

## Development

```bash
npm run dev                            # dev server
node scripts/validate.mjs --selfcheck  # test the validator itself
node scripts/validate.mjs              # validate the real data
npm run build                          # static site into out/
node scripts/evaluate.mjs --dry-run    # AI evaluation with a stub (no network); real runs happen in CI on main
```

Past ~25 members the unauthenticated GitHub API limit (60/hour) kicks in.
Set `GITHUB_TOKEN` to raise it to 5000.
