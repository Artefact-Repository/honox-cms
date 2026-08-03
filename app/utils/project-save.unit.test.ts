import { describe, expect, mock, test } from "bun:test";
import { cloneProject, ProjectSaveError } from "./project-save";

// Mock the git-backend module to simulate API interactions without hitting the real network.
const mockGitFiles = new Map<string, { content: string; sha: string }>();
const createdFiles: { path: string; content: string; message: string }[] = [];

mock.module("./git-backend", () => {
	return {
		requireToken: () => "mock-token",
		fetchFile: async (path: string) => {
			const file = mockGitFiles.get(path);
			if (!file) {
				throw { status: 404, message: "Not found" };
			}
			return file;
		},
		fileExists: async (path: string) => {
			return mockGitFiles.has(path);
		},
		createFile: async (path: string, content: string, message: string) => {
			createdFiles.push({ path, content, message });
			mockGitFiles.set(path, { content, sha: "new-sha" });
		},
	};
});

describe("cloneProject", () => {
	test("should throw ProjectSaveError if new title is empty", async () => {
		expect(cloneProject("some-slug", "")).rejects.toThrow(
			new ProjectSaveError("Enter a name for the copy."),
		);
		expect(cloneProject("some-slug", "   ")).rejects.toThrow(
			new ProjectSaveError("Enter a name for the copy."),
		);
	});

	test("should successfully clone a project with a new title and generate correct slug", async () => {
		// Set up source project mock
		const sourceYaml = [
			"---",
			"title: My Awesome Project",
			"status: Active",
			"colorPalette: orange",
			"---",
			"This is the project description.",
		].join("\n");

		mockGitFiles.set("content/projects/my-awesome-project.md", {
			content: sourceYaml,
			sha: "source-sha",
		});

		createdFiles.length = 0; // Clear any previous records

		const newSlug = await cloneProject("my-awesome-project", "Copied Project");

		expect(newSlug).toBe("copied-project");
		expect(createdFiles.length).toBe(1);
		expect(createdFiles[0].path).toBe("content/projects/copied-project.md");
		expect(createdFiles[0].message).toBe(
			'Clone project "My Awesome Project" as "Copied Project"',
		);
		expect(createdFiles[0].content).toContain("title: Copied Project");
		expect(createdFiles[0].content).toContain("status: Active");
		expect(createdFiles[0].content).toContain(
			"This is the project description.",
		);
	});

	test("should handle slug collision by appending incremental suffixes", async () => {
		// Setup files in mock system to simulate collision
		const sourceYaml = [
			"---",
			"title: Original",
			"---",
			"Original description",
		].join("\n");

		mockGitFiles.set("content/projects/original.md", {
			content: sourceYaml,
			sha: "orig-sha",
		});

		// Create files that occupy the prospective clone slugs
		mockGitFiles.set("content/projects/cloned-name.md", {
			content: "dummy",
			sha: "dummy-sha",
		});
		mockGitFiles.set("content/projects/cloned-name-2.md", {
			content: "dummy",
			sha: "dummy-sha",
		});

		createdFiles.length = 0;

		// Cloning with "Cloned Name" should map to slug "cloned-name" (taken),
		// then "cloned-name-2" (taken), resulting in "cloned-name-3"
		const newSlug = await cloneProject("original", "Cloned Name");

		expect(newSlug).toBe("cloned-name-3");
		expect(createdFiles.length).toBe(1);
		expect(createdFiles[0].path).toBe("content/projects/cloned-name-3.md");
		expect(createdFiles[0].content).toContain("title: Cloned Name");
	});
});
