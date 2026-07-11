import { expect, test, describe } from "bun:test";
import { Select } from "../app/components/ui/select";

describe("Select Unit Tests", () => {
	test("should render correctly with flattened API (static)", () => {
		const html = (
			<Select
				interactive={false}
				label="Favorite Framework"
				placeholder="Select framework..."
				items={[
					{ label: "React", value: "react" },
					{ label: "Solid", value: "solid" },
				]}
			/>
		).toString();

		expect(html).toContain('data-scope="select"');
		expect(html).toContain('data-part="root"');
		expect(html).toContain("Favorite Framework");
		expect(html).toContain("Select framework...");
		expect(html).toContain("React");
		expect(html).toContain("Solid");
		expect(html).toContain('value="react"');
		expect(html).toContain('value="solid"');
	});

	test("should force-hydrate by default as a Tier-1 component", () => {
		const html = (
			<Select
				items={[{ label: "Hono", value: "hono" }]}
			/>
		).toString();

		expect(html).toContain('data-hydrated="true"');
	});

	test("should support compound components for backward compatibility", () => {
		const html = (
			<Select.Root
				items={[{ label: "Hono", value: "hono" }]}
			>
				<Select.Label>Framework</Select.Label>
				<Select.Control>
					<Select.Trigger>
						<Select.ValueText placeholder="Select..." />
						<Select.Indicator />
					</Select.Trigger>
				</Select.Control>
				<Select.Positioner>
					<Select.Content>
						<Select.List>
							<Select.Item value="hono" index={0}>
								<Select.ItemText>Hono</Select.ItemText>
								<Select.ItemIndicator />
							</Select.Item>
						</Select.List>
					</Select.Content>
				</Select.Positioner>
			</Select.Root>
		).toString();

		expect(html).toContain('data-part="root"');
		expect(html).toContain('data-part="label"');
		expect(html).toContain('data-part="control"');
		expect(html).toContain('data-part="trigger"');
		expect(html).toContain('data-part="value-text"');
		expect(html).toContain('data-part="indicator"');
		expect(html).toContain('data-part="positioner"');
		expect(html).toContain('data-part="content"');
		expect(html).toContain('data-part="list"');
		expect(html).toContain('data-part="item"');
		expect(html).toContain('data-part="item-text"');
		expect(html).toContain('data-part="item-indicator"');
	});
});
