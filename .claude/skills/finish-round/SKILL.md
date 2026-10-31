---
name: finish-round
description: Wrap up a round of Logic Studio work — sync the branch, run checks, update docs and roadmap, refresh screenshots, commit with the right trailers, push and open the PR. Use when a feature or batch of roadmap items is done.
---

# Finish a round

1. **Branch** — work on the branch you were given. If its previous PR is merged, bring it up to date first: `git fetch origin main && git merge --ff-only origin/main` (or merge `origin/main` if it has unmerged commits). Never force-push.
2. **Review your diff** — `git diff origin/main`. Optionally ask the `convention-reviewer` agent to look over it.
3. **Checks** — `npm run check` (types, conventions, tests, build) must pass. For UI or behaviour changes, also follow the `verify-in-browser` skill: both themes, 390px width, clean console.
4. **Docs**
   - `CLAUDE.md` (layout, hard rules) and the matching `.claude/rules/*.md` for any new mechanism or convention.
   - `ROADMAP.md`: move finished items to done; add follow-ups you found, with what is still unverified.
   - `README.md`: feature list and part count.
   - Screenshots if the UI changed noticeably (`refresh-screenshots` skill).
5. **Commit** — clear message saying what changed and why. End with the attribution trailers your environment gives you (in this project's sessions: `Co-Authored-By: …` and `Claude-Session: …`). No model names or ids anywhere in commits, PRs or code.
6. **Push** — `git push -u origin <branch>`; on network errors retry with backoff (2, 4, 8, 16 s).
7. **PR** — use `.github/pull_request_template.md`: what changed (by feature, in plain words), how it was checked, what could not be verified. End the body with the footer your environment gives you. Only open a PR when asked to; the maintainer merges.
8. **Report** — tell the user what was built, the test count, the PR link, and anything unverified or left for later. Be plain about failures.
