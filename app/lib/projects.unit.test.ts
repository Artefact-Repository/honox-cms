import { describe, expect, test } from "bun:test";
import { buildProjectSearchEntries, type Project } from "./projects";

describe("buildProjectSearchEntries", () => {
	test("should map a list of projects into search index entries with correct attributes and haystack", () => {
		const mockProjects: Project[] = [
			{
				slug: "artefact-ui",
				title: "Artefact UI",
				summary: "Modern design system library based on HonoX",
				status: "Active",
				colorPalette: "blue",
				owner: "Priya Shah",
				tags: ["design", "web", "hono"],
			},
			{
				slug: "cms-builder",
				title: "CMS Page Builder",
				summary: "Sveltia-backed visual layout editor",
				status: "Planning",
				colorPalette: "gray",
				tags: ["cms", "visual"],
			},
		];

		const entries = buildProjectSearchEntries(mockProjects);

		expect(entries).toHaveLength(2);

		// First entry
		expect(entries[0].key).toBe("artefact-ui");
		expect(entries[0].href).toBe("/projects/artefact-ui");
		expect(entries[0].title).toBe("Artefact UI");
		expect(entries[0].description).toBe(
			"Modern design system library based on HonoX",
		);
		expect(entries[0].tags).toEqual(["design", "web", "hono"]);
		// Check haystack contains lowercase search terms
		expect(entries[0].haystack).toContain("artefact ui");
		expect(entries[0].haystack).toContain("modern design system library");
		expect(entries[0].haystack).toContain("active");
		expect(entries[0].haystack).toContain("priya shah");
		expect(entries[0].haystack).toContain("design");

		// Second entry (omitted optional fields like owner)
		expect(entries[1].key).toBe("cms-builder");
		expect(entries[1].href).toBe("/projects/cms-builder");
		expect(entries[1].title).toBe("CMS Page Builder");
		expect(entries[1].description).toBe("Sveltia-backed visual layout editor");
		expect(entries[1].tags).toEqual(["cms", "visual"]);
		expect(entries[1].haystack).toContain("cms page builder");
		expect(entries[1].haystack).toContain(
			"sveltia-backed visual layout editor",
		);
		expect(entries[1].haystack).toContain("planning");
		expect(entries[1].haystack).not.toContain("priya shah");
	});
});
