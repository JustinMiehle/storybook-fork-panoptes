import { defineConfig } from 'vitest/config';

import PanoptesReporter from '@panoptes/reporter-vitest';

/**
 * CircleCI reports the wrong number of threads to Node.js, so we need to set it manually. Script
 * tests are running with the small resource class, which has 1 vCPU.
 *
 * @see https://jahed.dev/2022/11/20/fixing-node-js-multi-threading-on-circleci/
 * @see https://vitest.dev/config/maxworkers.html#maxworkers
 * @see https://circleci.com/docs/configuration-reference/#x86
 * @see .circleci/config.yml#L187
 */
const threadCount = process.env.CI ? 1 : undefined;

export default defineConfig({
  test: {
    clearMocks: true,
    pool: 'threads',
    maxWorkers: threadCount,
    reporters: [
      'default',
      new PanoptesReporter({
        convexUrl: 'https://impartial-chinchilla-443.convex.cloud',
        projectName: process.env.PANOPTES_PROJECT_NAME || 'storybook',
        environment: process.env.NODE_ENV || 'development',
        ci: process.env.CI === 'true',
      }),
    ],
  },
});
