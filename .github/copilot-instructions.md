# Copilot instructions — proto-2

This repo runs as a zero-touch factory: the owner only moves cards on the GitHub Project board.
Nobody will answer questions mid-task, and your PR auto-merges once CI is green.

## Stack
- Next.js 13 (pages router), TypeScript, tRPC v10, Prisma, Clerk auth, Ant Design + Tailwind.
- Node 24. Install with `npm ci`.
- Env validation lives in `src/env.mjs`; set `SKIP_ENV_VALIDATION=1` for local build/lint.

## Definition of done (run all before finishing)
1. `npm run lint`
2. `npx tsc --noEmit`
3. `SKIP_ENV_VALIDATION=1 npm run build` (in the agent sandbox these env vars are preset; locally use
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsuZXhhbXBsZS5jb20k CLERK_SECRET_KEY=sk_test_ci_dummy`)

All three must pass. CI runs the same steps and is the only merge gate.

## Rules
- PR description must contain `Fixes #<issue number>` so the card closes on merge.
- Keep the diff scoped to the issue. No drive-by refactors or dependency upgrades unless asked.
- If the issue is ambiguous, pick the simplest reasonable interpretation, do it, and list the
  assumption under an **Assumptions** heading in the PR description. Do not stop to ask.
- Only stop without code if the task is impossible or unsafe; explain why in the PR description.
- Never commit secrets or `.env` files. Do not edit `.github/workflows/` or `.github/factory/`.
- Prisma schema changes need a migration under `prisma/migrations/`.
- If a comment asks you to fix CI or merge conflicts, merge `main` into your branch, fix, and re-run
  the definition-of-done steps.
