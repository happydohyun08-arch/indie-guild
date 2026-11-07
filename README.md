# Indie Guild

Résumés and portfolios where every claim carries a public evidence link.
For companies and investors who want to verify before they hire or invest.

- **Every work-history entry needs a public evidence link** — entries without one are rejected by CI.
- **Metrics can't be self-reported** — they are fetched from the GitHub public API at build time.
- **Three vouches per person per year** — scarcity is the point. CI enforces the cap.
- **No database, no login** — profiles are JSON in this repo; publishing and vouching are pull requests.
  The commit author is permanently recorded in Git history, and that *is* the verification.

Available in English (`/en`) and Korean (`/ko`).

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
```

Past ~25 members the unauthenticated GitHub API limit (60/hour) kicks in.
Set `GITHUB_TOKEN` to raise it to 5000.
