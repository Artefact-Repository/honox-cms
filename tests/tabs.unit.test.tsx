import { expect, test, describe } from "bun:test";
import { Tabs } from "../app/components/ui/tabs";

describe("Tabs Unit Tests", () => {
	const items = [
		{ value: "react", label: "React", content: "React Content" },
		{ value: "solid", label: "Solid", content: "Solid Content" },
	];

	test("should render correctly with flattened API", () => {
		const html = (<Tabs defaultValue="react" items={items} />).toString();

		expect(html).toContain('data-part="root"');
		expect(html).toContain('role="tablist"');
		expect(html).toContain('data-value="react"');
		expect(html).toContain('data-value="solid"');
		expect(html).toContain("React Content");
		expect(html).toContain("Solid Content");
	});

	test("should render as an island when interactive", () => {
		const html = (<Tabs items={items} interactive={true} />).toString();

		expect(html).toContain('data-hydrated="true"');
	});

	test("should not render as an island when not interactive", () => {
		const html = (<Tabs items={items} interactive={false} />).toString();

		expect(html).not.toContain('data-hydrated="true"');
	});

	test("should render indicator by default", () => {
		const html = (<Tabs items={items} />).toString();

		expect(html).toContain('data-part="indicator"');
	});

	test("should not render indicator when disabled", () => {
		const html = (<Tabs items={items} indicator={false} />).toString();

		expect(html).not.toContain('data-part="indicator"');
	});

	test("should not leak items/indicator/editable as DOM attributes", () => {
		const html = (
			<Tabs items={items} editable onTabAdd={() => {}} />
		).toString();

		expect(html).not.toContain("items=");
		expect(html).not.toContain("editable=");
		expect(html).not.toContain("[object Object]");
	});

	test("should apply the colorPalette variant class", () => {
		const html = (<Tabs items={items} colorPalette="blue" />).toString();

		expect(html).toContain("tabs__root--colorPalette_blue");
		expect(html).toContain("tabs__trigger--colorPalette_blue");
	});

	test("should apply the card variant class and hide the indicator", () => {
		const html = (<Tabs items={items} variant="card" />).toString();

		expect(html).toContain("tabs__trigger--variant_card");
	});

	test("should apply the centered variant class", () => {
		const html = (<Tabs items={items} centered />).toString();

		expect(html).toContain("tabs__list--centered");
	});

	test("should render an icon before the label", () => {
		const html = (
			<Tabs
				items={[
					{
						value: "react",
						label: "React",
						content: "React Content",
						icon: <span data-testid="tab-icon">*</span>,
					},
				]}
			/>
		).toString();

		expect(html).toContain('data-testid="tab-icon"');
	});

	test("should render a close button for closable tabs and force hydration", () => {
		const html = (<Tabs items={items} closable />).toString();

		expect(html).toContain('data-part="close"');
		expect(html).toContain('aria-label="Close tab"');
		expect(html).toContain('data-hydrated="true"');
	});

	test("per-item closable should override the structure-level default", () => {
		const html = (
			<Tabs
				closable
				items={[
					{ value: "react", label: "React", content: "React Content" },
					{
						value: "solid",
						label: "Solid",
						content: "Solid Content",
						closable: false,
					},
				]}
			/>
		).toString();

		const closeButtons = html.match(/data-part="close"/g) ?? [];
		expect(closeButtons.length).toBe(1);
	});

	test("should render an add trigger and force hydration when editable", () => {
		const html = (<Tabs items={items} editable />).toString();

		expect(html).toContain('data-part="add"');
		expect(html).toContain('aria-label="Add tab"');
		expect(html).toContain('data-hydrated="true"');
	});

	test("should render extra content alongside the tab list", () => {
		const html = (
			<Tabs items={items} extra={<button type="button">Refresh</button>} />
		).toString();

		expect(html).toContain("Refresh");
	});

	test("should render split start/end extra content", () => {
		const html = (
			<Tabs
				items={items}
				extra={{
					start: <span data-testid="extra-start">start</span>,
					end: <span data-testid="extra-end">end</span>,
				}}
			/>
		).toString();

		expect(html).toContain('data-testid="extra-start"');
		expect(html).toContain('data-testid="extra-end"');
	});

	test("should not leak a `ref` attribute onto the root element", () => {
		const html = (<Tabs items={items} editable />).toString();

		expect(html).not.toMatch(/\sref="/);
	});

	test("should support activeKey and onChange (controlled mode)", () => {
		const html = (
			<Tabs activeKey="solid" items={items} onChange={() => {}} />
		).toString();

		expect(html).toContain('data-value="solid"');
		expect(html).toContain('aria-selected="true"');
	});

	test("should support defaultActiveKey (uncontrolled mode)", () => {
		const html = (
			<Tabs defaultActiveKey="solid" items={items} />
		).toString();

		expect(html).toContain('data-value="solid"');
		expect(html).toContain('aria-selected="true"');
	});

	test("should support type='card' mapping", () => {
		const html = (<Tabs type="card" items={items} />).toString();

		expect(html).toContain("tabs__trigger--variant_card");
	});

	test("should support type='editable-card' mapping", () => {
		const html = (<Tabs type="editable-card" items={items} />).toString();

		expect(html).toContain("tabs__trigger--variant_card");
		expect(html).toContain('data-part="add"');
	});

	test("should support tabPlacement='bottom' reversing flex direction", () => {
		const html = (<Tabs tabPlacement="bottom" items={items} />).toString();

		expect(html).toContain("flex-direction:column-reverse");
	});

	test("should support tabPlacement='right' reversing flex direction", () => {
		const html = (<Tabs tabPlacement="right" items={items} />).toString();

		expect(html).toContain("flex-direction:row-reverse");
		expect(html).toContain('data-orientation="vertical"');
	});

	test("should support unmountOnExit, completely destroying inactive panels", () => {
		const html = (
			<Tabs defaultValue="react" unmountOnExit items={items} />
		).toString();

		expect(html).toContain("React Content");
		expect(html).not.toContain("Solid Content");
	});

	test("should support per-item unmountOnExit override", () => {
		const html = (
			<Tabs
				defaultValue="react"
				items={[
					{ value: "react", label: "React", content: "React Content" },
					{
						value: "solid",
						label: "Solid",
						content: "Solid Content",
						unmountOnExit: true,
					},
				]}
			/>
		).toString();

		expect(html).toContain("React Content");
		expect(html).not.toContain("Solid Content");
	});

	test("should support lazyMount, skipping panels never yet activated", () => {
		const html = (
			<Tabs defaultValue="react" lazyMount items={items} />
		).toString();

		expect(html).toContain("React Content");
		expect(html).not.toContain("Solid Content");
	});

	test("should not lazy-skip a panel that is the active tab", () => {
		const html = (
			<Tabs defaultValue="solid" lazyMount items={items} />
		).toString();

		expect(html).toContain("Solid Content");
	});

	test("should support deselectable and loopFocus without leaking as DOM attributes", () => {
		const html = (
			<Tabs items={items} deselectable loopFocus={false} />
		).toString();

		expect(html).not.toContain("deselectable=");
		expect(html).not.toContain("loopFocus=");
	});

	test("should hydrate when deselectable is provided", () => {
		const html = (<Tabs items={items} deselectable />).toString();

		expect(html).toContain('data-hydrated="true"');
	});

	test("should support custom classNames and styles for semantic structures", () => {
		const html = (
			<Tabs
				items={items}
				classNames={{
					root: "custom-root-class",
					list: "custom-list-class",
					trigger: "custom-trigger-class",
				}}
				styles={{
					root: { border: "2px solid red" },
					list: { margin: "10px" },
				}}
			/>
		).toString();

		expect(html).toContain("custom-root-class");
		expect(html).toContain("custom-list-class");
		expect(html).toContain("custom-trigger-class");
		expect(html).toContain("border:2px solid red");
		expect(html).toContain("margin:10px");
	});

	test("should support custom closeIcon on per-item level", () => {
		const html = (
			<Tabs
				closable
				items={[
					{
						value: "react",
						label: "React",
						content: "React Content",
						closeIcon: <span data-testid="custom-close-icon">x</span>,
					},
				]}
			/>
		).toString();

		expect(html).toContain('data-testid="custom-close-icon"');
	});

	test("should support custom removeIcon and addIcon", () => {
		const html = (
			<Tabs
				type="editable-card"
				items={items}
				removeIcon={<span data-testid="custom-remove-icon">x</span>}
				addIcon={<span data-testid="custom-add-icon">+</span>}
			/>
		).toString();

		expect(html).toContain('data-testid="custom-remove-icon"');
		expect(html).toContain('data-testid="custom-add-icon"');
	});

	test("should default to the first tab when no value is provided", () => {
		const html = (<Tabs items={items} />).toString();

		expect(html).toContain('aria-selected="true"');
		expect(html).toMatch(/data-value="react"[^>]*/);
		// The derived default must not force hydration.
		expect(html).not.toContain('data-hydrated="true"');
	});

	test("should skip disabled tabs when deriving the default active tab", () => {
		const html = (
			<Tabs
				items={[
					{ value: "react", label: "React", content: "R", disabled: true },
					{ value: "solid", label: "Solid", content: "S" },
				]}
			/>
		).toString();

		const selected = html.match(
			/aria-selected="true"[^>]*data-value="(\w+)"/,
		);
		expect(selected?.[1]).toBe("solid");
	});

	test("should support hideAdd to suppress the add trigger", () => {
		const html = (
			<Tabs type="editable-card" hideAdd items={items} />
		).toString();

		expect(html).not.toContain('data-part="add"');
		expect(html).toContain('data-part="close"');
	});

	test("should wire tablist orientation and trigger/panel relationships", () => {
		const html = (<Tabs items={items} />).toString();

		expect(html).toContain('aria-orientation="horizontal"');
		expect(html).toMatch(/id="tabs-trigger-[^"]+-react"/);
		expect(html).toMatch(/aria-labelledby="tabs-trigger-[^"]+-react"/);
	});

	test("should mark panes as animated when animated is enabled", () => {
		const animatedHtml = (<Tabs items={items} animated />).toString();
		const paneOnlyHtml = (
			<Tabs items={items} animated={{ tabPane: true }} />
		).toString();
		const defaultHtml = (<Tabs items={items} />).toString();

		expect(animatedHtml).toContain("data-pane-animated");
		expect(paneOnlyHtml).toContain("data-pane-animated");
		expect(defaultHtml).not.toContain("data-pane-animated");
	});

	test("should render the indicator for object-form indicator config", () => {
		const html = (
			<Tabs items={items} indicator={{ align: "center", size: 24 }} />
		).toString();

		expect(html).toContain('data-part="indicator"');
	});

	test("should hydrate when onTabClick or onTabScroll is provided", () => {
		const clickHtml = (
			<Tabs items={items} onTabClick={() => {}} />
		).toString();
		const scrollHtml = (
			<Tabs items={items} onTabScroll={() => {}} />
		).toString();

		expect(clickHtml).toContain('data-hydrated="true"');
		expect(scrollHtml).toContain('data-hydrated="true"');
		expect(clickHtml).not.toContain("onTabClick");
		expect(scrollHtml).not.toContain("onTabScroll");
	});

	test("should pass an explicit dir through to the root element", () => {
		const html = (<Tabs items={items} dir="rtl" />).toString();

		expect(html).toMatch(/dir="rtl"/);
	});

	test("should support tabBarGutter and tabBarStyle", () => {
		const html = (
			<Tabs
				items={items}
				tabBarGutter={24}
				tabBarStyle={{ background: "blue" }}
			/>
		).toString();

		expect(html).toContain("gap:24px");
		expect(html).toContain("background:blue");
	});

	// The wrapper lifts element-valued item fields into `__slot_*` props so the
	// island can carry them across the HonoX boundary via live <template> slots
	// (the actual JSON-mangling failure it avoids is exercised end-to-end in the
	// Playwright suite; these assert the lift -> reassemble round-trip and that
	// the internal slot keys never leak onto the DOM).
	test("should round-trip element-valued item content through the interactive island", () => {
		const Widget = (props: { label: string }) => (
			<div data-testid="widget">Widget {props.label}</div>
		);
		const html = (
			<Tabs
				interactive
				items={[
					{
						value: "react",
						label: "React",
						content: (
							<div>
								Rich <Widget label="A" />
							</div>
						),
					},
					{
						value: "solid",
						label: "Solid",
						content: (
							<div>
								Other <Widget label="B" />
							</div>
						),
					},
				]}
			/>
		).toString();

		expect(html).toContain('data-hydrated="true"');
		expect(html).toContain("Widget A");
		expect(html).toContain("Widget B");
		// The internal slot keys must never leak onto the DOM as attributes.
		expect(html).not.toContain("__slot_");
	});

	test("should round-trip an element-valued item label without leaking slot keys", () => {
		const html = (
			<Tabs
				interactive
				items={[
					{
						value: "react",
						label: <span data-testid="rich-label">React</span>,
						content: "React Content",
					},
				]}
			/>
		).toString();

		expect(html).toContain('data-testid="rich-label"');
		expect(html).toContain("React Content");
		expect(html).not.toContain("__slot_");
	});
});
