import { expect, test, describe } from "bun:test";
import { RadioGroup } from "../app/components/ui/radio-group";

describe("RadioGroup Unit Tests", () => {
	test("should render correctly with flattened API", () => {
		const html = (
			<RadioGroup
				defaultValue="react"
				items={[
					{ label: "React", value: "react" },
					{ label: "Solid", value: "solid" },
				]}
			/>
		).toString();

		expect(html).toContain('data-scope="radio-group"');
		expect(html).toContain('data-part="root"');
		expect(html).toContain("React");
		expect(html).toContain("Solid");
		expect(html).toContain('value="react"');
		expect(html).toContain('value="solid"');
	});

	test("should render as an island when interactive", () => {
		const html = (
			<RadioGroup
				interactive
				items={[{ label: "React", value: "react" }]}
			/>
		).toString();

		expect(html).toContain('data-hydrated="true"');
	});

	test("should not render as an island when not interactive", () => {
		const html = (
			<RadioGroup
				interactive={false}
				items={[{ label: "React", value: "react" }]}
			/>
		).toString();

		expect(html).not.toContain('data-hydrated="true"');
		expect(html).toContain('data-part="root"');
	});

	test("should support compound components for backward compatibility", () => {
		const html = (
			<RadioGroup.Root defaultValue="react">
				<RadioGroup.Indicator />
				<RadioGroup.Item value="react">
					<RadioGroup.ItemControl />
					<RadioGroup.ItemText>React</RadioGroup.ItemText>
					<RadioGroup.ItemHiddenInput />
				</RadioGroup.Item>
			</RadioGroup.Root>
		).toString();

		expect(html).toContain('data-part="root"');
		expect(html).toContain('data-part="indicator"');
		expect(html).toContain('data-part="item"');
		expect(html).toContain('data-part="item-control"');
		expect(html).toContain('data-part="item-text"');
		expect(html).toContain('type="radio"');
	});
});
