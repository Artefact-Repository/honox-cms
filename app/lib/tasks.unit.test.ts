import { expect, test, describe } from "bun:test";
import { splitTitleTag, colorForTag } from "./tasks";

describe("splitTitleTag", () => {
	test("should parse simple leading tags under 24 chars", () => {
		expect(splitTitleTag("[Bug] Login broken")).toEqual({
			tag: "Bug",
			rest: "Login broken",
		});
		expect(splitTitleTag("[FE] Add dark mode")).toEqual({
			tag: "FE",
			rest: "Add dark mode",
		});
		expect(splitTitleTag("[Epic] CMS Page Builder")).toEqual({
			tag: "Epic",
			rest: "CMS Page Builder",
		});
	});

	test("should handle whitespace", () => {
		expect(splitTitleTag("  [Bug]   Login broken ")).toEqual({
			tag: "Bug",
			rest: "Login broken ",
		});
	});

	test("should handle tag only (empty rest)", () => {
		expect(splitTitleTag("[Bug]")).toEqual({
			tag: "Bug",
			rest: "",
		});
		expect(splitTitleTag("  [Bug]  ")).toEqual({
			tag: "Bug",
			rest: "",
		});
	});

	test("should return as plain title if [ is not at the very start", () => {
		expect(splitTitleTag("Fix [Bug] login")).toEqual({
			rest: "Fix [Bug] login",
		});
	});

	test("should return as plain title for unbalanced brackets", () => {
		expect(splitTitleTag("[Bug Login")).toEqual({
			rest: "[Bug Login",
		});
		expect(splitTitleTag("Bug] Login")).toEqual({
			rest: "Bug] Login",
		});
	});

	test("should return as plain title for tags over 24 characters", () => {
		const longTag = "ThisTagIsWayTooLongOverTwentyFourChars";
		expect(splitTitleTag(`[${longTag}] Login`)).toEqual({
			rest: `[${longTag}] Login`,
		});
	});

	test("should return plain title for empty brackets", () => {
		expect(splitTitleTag("[] Login")).toEqual({
			rest: "[] Login",
		});
	});
});

describe("colorForTag", () => {
	test("should map known tags case-insensitively", () => {
		expect(colorForTag("Bug")).toBe("red");
		expect(colorForTag("bug")).toBe("red");
		expect(colorForTag("BUG")).toBe("red");
		expect(colorForTag("fe")).toBe("blue");
		expect(colorForTag("Epic")).toBe("purple");
		expect(colorForTag("spike")).toBe("amber");
	});

	test("should fallback to gray for unknown tags", () => {
		expect(colorForTag("random-tag")).toBe("gray");
	});
});
