import { expect, test, describe } from "bun:test";
import { Dropdown } from "../app/components/ui/dropdown";

describe("Dropdown Unit Tests", () => {
	test("should render correctly", () => {
		const html = (
			<Dropdown.Root interactive={false}>
				<Dropdown.Trigger>Open</Dropdown.Trigger>
				<Dropdown.Positioner>
					<Dropdown.Content>
						<Dropdown.Item value="item-1">Item 1</Dropdown.Item>
					</Dropdown.Content>
				</Dropdown.Positioner>
			</Dropdown.Root>
		).toString();

		expect(html).toContain('data-part="trigger"');
		expect(html).toContain("Open");
        expect(html).toContain('role="menu"');
	});

	test("should render items correctly", () => {
		const html = (
			<Dropdown.Root interactive={false}>
				<Dropdown.Positioner>
					<Dropdown.Content>
						<Dropdown.Item value="item-1">Item 1</Dropdown.Item>
						<Dropdown.CheckboxItem value="item-2" checked>
							Item 2
						</Dropdown.CheckboxItem>
					</Dropdown.Content>
				</Dropdown.Positioner>
			</Dropdown.Root>
		).toString();

		expect(html).toContain('role="menuitem"');
		expect(html).toContain('data-value="item-1"');
		expect(html).toContain('role="menuitemcheckbox"');
		expect(html).toContain('aria-checked="true"');
	});

	test("should degrade submenu to a disabled item (no debug leak)", () => {
		const html = (
			<Dropdown.Root
				interactive={false}
				items={[{ type: "submenu", label: "More", items: [] }]}
			/>
		).toString();

		expect(html).toContain('data-part="item"');
		expect(html).toContain("data-disabled");
		expect(html).toContain("More");
		expect(html).not.toContain("not supported in simplified API");
	});

	test("should render arrow and arrow tip when arrow is true", () => {
		const html = (
			<Dropdown.Root
				interactive={false}
				arrow={true}
				items={[{ type: "item", label: "Item 1", value: "item-1" }]}
			/>
		).toString();

		expect(html).toContain('data-part="arrow"');
		expect(html).toContain('data-part="arrow-tip"');
	});

	test("should support placement and triggerMode attributes", () => {
		const html = (
			<Dropdown.Root
				interactive={true}
				trigger={<button>Open</button>}
				placement="bottomRight"
				triggerMode="hover"
				items={[{ type: "item", label: "Item 1", value: "item-1" }]}
			/>
		).toString();

		expect(html).toContain('data-part="trigger"');
		expect(html).toContain('role="menu"');
	});
});
