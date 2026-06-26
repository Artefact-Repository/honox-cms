import { expect, test, describe } from "bun:test";
import { Tabs } from "../app/components/ui/tabs";

describe("Tabs Unit Tests", () => {
	const items = [
		{ value: "react", label: "React", content: "React Content" },
		{ value: "solid", label: "Solid", content: "Solid Content" },
	];

	test("should render correctly with flattened API", () => {
		const html = (
			<Tabs defaultValue="react" items={items} />
		).toString();

		expect(html).toContain('data-part="root"');
		expect(html).toContain('role="tablist"');
		expect(html).toContain('data-value="react"');
		expect(html).toContain('data-value="solid"');
		expect(html).toContain("React Content");
		expect(html).toContain("Solid Content");
	});

	test("should render as an island when interactive", () => {
		const html = (
			<Tabs items={items} interactive={true} />
		).toString();

		expect(html).toContain('data-hydrated="true"');
	});

	test("should not render as an island when not interactive", () => {
		const html = (
			<Tabs items={items} interactive={false} />
		).toString();

		expect(html).not.toContain('data-hydrated="true"');
	});

	test("should render indicator by default", () => {
		const html = (
			<Tabs items={items} />
		).toString();

		expect(html).toContain('data-part="indicator"');
	});

	test("should not render indicator when disabled", () => {
		const html = (
			<Tabs items={items} indicator={false} />
		).toString();

		expect(html).not.toContain('data-part="indicator"');
	});
});
