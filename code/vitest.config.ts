import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { coverageConfigDefaults, defineConfig } from "vitest/config";

import PanoptesReporter from "@justinmiehle/reporter-vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * CircleCI reports the wrong number of threads to Node.js, so we need to set it manually. Unit
 * tests are running with the xlarge resource class, which has 8 vCPUs.
 *
 * @see https://jahed.dev/2022/11/20/fixing-node-js-multi-threading-on-circleci/
 * @see https://vitest.dev/config/maxworkers.html#maxworkers
 * @see https://circleci.com/docs/configuration-reference/#x86
 * @see .circleci/config.yml#L187
 */
const threadCount = process.env.CI
	? process.platform === "win32"
		? 4
		: 7
	: undefined;
const shouldRunStorybookTests = !(
	process.env.CI && process.platform === "win32"
);

const projects = [
	"addons/*/vitest.config.ts",
	"frameworks/*/vitest.config.ts",
	"lib/*/vitest.config.ts",
	"core/vitest.config.ts",
	"builders/*/vitest.config.ts",
	"presets/*/vitest.config.ts",
	"renderers/*/vitest.config.ts",
];

/**
 * On CI, we run our own unit tests, but for performance reasons, we don't install playwright, thus
 * these tests, that need browser-mode cannot be run/added.
 * The storybook project requires @storybook/addon-vitest to be built (dist/); skip it when not built
 * so `yarn test` works locally without a full compile.
 */
const addonVitestPluginPath = path.join(
	__dirname,
	"addons",
	"vitest",
	"dist",
	"vitest-plugin",
	"index.js",
);
if (shouldRunStorybookTests && existsSync(addonVitestPluginPath)) {
	projects.push("vitest.config.storybook.ts");
}

export default defineConfig({
	optimizeDeps: {
		include: ["@justinmiehle/reporter-vitest", "@justinmiehle/shared"],
	},
	test: {
		env: {
			NODE_ENV: "test",
		},

		pool: "threads",
		maxWorkers: threadCount,
		projects,

		reporters: [
			"default",
			new PanoptesReporter({
				convexUrl:
					process.env.CONVEX_URL ||
					"https://impartial-chinchilla-443.convex.cloud",
				projectName: process.env.PANOPTES_PROJECT_NAME || "storybook",
				environment: process.env.NODE_ENV || "development",
				ci: process.env.CI === "true",
			}),
		],

		coverage: {
			provider: "istanbul",
			exclude: [
				...coverageConfigDefaults.exclude,
				"**/__mocks/**",
				"**/dist/**",
				"playwright.config.ts",
				"vitest-setup.ts",
				"vitest.helpers.ts",
				"**/*.stories.*",
			],
		},
	},
});
