# Upstream

Everything in `guidelines/` except this file is a verbatim copy of
[niyamax/maker-faire-kochi](https://github.com/niyamax/maker-faire-kochi) at commit **`aaae296`**
("Add Maker Faire Kochi creative guidelines and selected references", compiled 22 October 2026).
Its `AGENTS.md` and `.gitignore` are left out; their rules are merged into the root `AGENTS.md`.

Copied on 2026-10-25. It replaces the Open Workshop design system, now in `archive/open-workshop/`.

## Re-sync

Don't edit these files; change upstream, then overwrite:

```sh
git clone --depth 1 git@github.com:niyamax/maker-faire-kochi.git /tmp/mfk-upstream
rsync -a --delete --exclude UPSTREAM.md --exclude AGENTS.md --exclude .gitignore /tmp/mfk-upstream/ guidelines/ --exclude .git
```

Then update the commit above, check `brand/tokens.css` font paths still resolve, and review the root `AGENTS.md` against the new `docs/creative-guidelines.md`.

## Local deviations (this repo only)

- **Baloo Chettan 2 ExtraBold** stays the Malayalam display face for Manglish headlines (Malayalam letters only, `brand/fonts/`). Upstream uses Noto Sans Malayalam alone; Noto is still used for all other Malayalam.
- **All three official lockups** (long, border, square; PNG + PDF) live in `brand/logo/official/`. Upstream ships only the long PNG.
- **Open Workshop kit as archive art:** the awareness carousels keep the kit SVGs from `archive/open-workshop/assets/kit/` (tinted whole to the look's ink) until straight-beam illustrations replace them. Not for new work.
- **Kochi content rules** in the root `AGENTS.md` (COMING SOON instead of a date, clear descriptive words, Kerala-wide volunteer calls, Manglish rules) apply alongside upstream's.
