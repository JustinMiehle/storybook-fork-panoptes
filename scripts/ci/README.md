# Storybook CI

Generated CircleCI config lives in `.circleci/config.generated.yml` (see root `config.yml`).

## Panoptes reporter (test results to prod)

CI runs the Panoptes Vitest and Playwright reporters so test results are sent to your prod Convex instance.

**Required:** In CircleCI, set a **Project** environment variable (or use a Context):

- **`CONVEX_URL`** – Your **production** Convex deployment URL (e.g. `https://your-deployment.convex.cloud`).

`PANOPTES_PROJECT_NAME` is set in code to `storybook`; override per-job in CircleCI if needed.

Without `CONVEX_URL`, the reporters still run but skip sending (they log a warning).
