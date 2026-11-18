# Expert roster

One charter per expert. `.github/workflows/expert-review.yml` runs each one on every ready PR
through GitHub Models and posts a commit status `expert-review/<name>`.

- Reviewer is not the builder: the workflow runs as `github-actions[bot]` with read-only
  contents, separate from Copilot (the author).
- Only **major** findings fail a review; minor ones are listed but pass.
- A reviewer that can't answer (model error, rate limit) posts `error`: unavailable counts as fail.
- Add an expert: write `<name>.md` here and add the name to `review.experts` in
  `.github/factory/factory.yml`, then add `expert-review/<name>` to the ruleset's required checks.
