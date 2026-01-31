import { readFileSync } from "fs";
import { join } from "path/posix";

import { build_linux } from "./common-jobs";
import { PANOPTES_CI_ENV } from "./utils/constants";
import { artifact, workflow } from "./utils/helpers";
import {
	type JobOrNoOpJob,
	type Workflow,
	defineJob,
	defineNoOpJob,
	isWorkflowOrAbove,
} from "./utils/types";

export function definePortableStoryTest(directory: string) {
	const working_directory = `test-storybooks/portable-stories-kitchen-sink/${directory}`;

	const { scripts } = JSON.parse(
		readFileSync(
			join(import.meta.dirname, "..", "..", working_directory, "package.json"),
			"utf8",
		),
	);

	return defineJob(
		`test-storybooks-portable-${directory}`,
		() => ({
			executor: {
				name: "sb_playwright",
				class: "medium",
			},
			steps: [
				...workflow.restoreLinux(),
				{
					run: {
						name: "Install dependencies",
						working_directory,
						command: "yarn install --no-immutable",
						environment: {
							YARN_ENABLE_IMMUTABLE_INSTALLS: false,
						},
					},
				},
				{
					run: {
						name: "Run Jest tests",
						working_directory,
						command: "yarn jest",
						environment: PANOPTES_CI_ENV,
					},
				},
				{
					run: {
						name: "Run Vitest tests",
						working_directory,
						command: "yarn vitest",
						environment: PANOPTES_CI_ENV,
					},
				},
				{
					run: {
						name: "Run Playwright CT tests",
						working_directory,
						command: "yarn playwright-ct",
						environment: PANOPTES_CI_ENV,
					},
				},
				...(scripts["playwright-e2e"]
					? [
							{
								run: {
									name: "Run Playwright E2E tests",
									working_directory,
									command: "yarn playwright-e2e",
									environment: PANOPTES_CI_ENV,
								},
							},
							artifact.persist(
								join(working_directory, "test-results"),
								"playwright",
							),
						]
					: []),
				{
					run: {
						name: "Run Cypress CT tests",
						working_directory,
						command: "yarn cypress",
						environment: PANOPTES_CI_ENV,
					},
				},
			],
		}),
		[testStorybooksNoOpJob],
	);
}

export function definePortableStoryTestPNP() {
	return defineJob(
		"test-storybooks-pnp",
		() => ({
			executor: {
				name: "sb_node_22_classic",
				class: "medium",
			},
			steps: [
				...workflow.restoreLinux(),
				{
					run: {
						name: "Install dependencies",
						working_directory: "test-storybooks/yarn-pnp",
						command: "yarn install --no-immutable",
						environment: {
							YARN_ENABLE_IMMUTABLE_INSTALLS: false,
						},
					},
				},
				{
					run: {
						name: "Run Storybook smoke test",
						working_directory: "test-storybooks/yarn-pnp",
						command: "yarn storybook --smoke-test",
					},
				},
			],
		}),
		[testStorybooksNoOpJob],
	);
}

export function definePortableStoryTestVitest3() {
	return defineJob(
		"test-storybooks-portable-vitest3",
		() => ({
			executor: {
				name: "sb_playwright",
				class: "medium",
			},
			steps: [
				...workflow.restoreLinux(),
				{
					run: {
						name: "Install dependencies",
						working_directory:
							"test-storybooks/portable-stories-kitchen-sink/react-vitest-3",
						command: "yarn install --no-immutable",
						environment: {
							YARN_ENABLE_IMMUTABLE_INSTALLS: false,
						},
					},
				},
				{
					run: {
						name: "Run Playwright E2E tests",
						working_directory:
							"test-storybooks/portable-stories-kitchen-sink/react-vitest-3",
						command: "yarn playwright-e2e",
						environment: PANOPTES_CI_ENV,
					},
				},
			],
		}),
		[testStorybooksNoOpJob],
	);
}

export const testStorybooksNoOpJob = defineNoOpJob("test-storybooks", [
	build_linux,
]);

export function getTestStorybooks(workflow: Workflow) {
	const testStorybooks: JobOrNoOpJob[] = ["react", "vue3"].map(
		definePortableStoryTest,
	);

	if (isWorkflowOrAbove(workflow, "daily")) {
		testStorybooks.push(definePortableStoryTestPNP());
	}

	if (isWorkflowOrAbove(workflow, "merged")) {
		testStorybooks.push(definePortableStoryTestVitest3());
	}

	return testStorybooks;
}
