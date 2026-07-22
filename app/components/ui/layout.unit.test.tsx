import { describe, expect, it } from "bun:test";
import { Layout } from "./layout";

describe("Layout Component", () => {
	it("should render flat shorthand layout correctly", () => {
		const html = (
			<Layout
				header={<div id="test-header">My Header</div>}
				sider={<div id="test-sider">My Sider</div>}
				content={<div id="test-content">My Content</div>}
				footer={<div id="test-footer">My Footer</div>}
			/>
		).toString();

		expect(html).toContain('id="test-header"');
		expect(html).toContain('id="test-sider"');
		expect(html).toContain('id="test-content"');
		expect(html).toContain('id="test-footer"');
		expect(html).toContain("<header");
		expect(html).toContain("<aside");
		expect(html).toContain("<main");
		expect(html).toContain("<footer");
	});

	it("should render compound layout correctly", () => {
		const html = (
			<Layout>
				<Layout.Header id="test-header">My Header</Layout.Header>
				<Layout.Sider id="test-sider">My Sider</Layout.Sider>
				<Layout.Content id="test-content">My Content</Layout.Content>
				<Layout.Footer id="test-footer">My Footer</Layout.Footer>
			</Layout>
		).toString();

		expect(html).toContain('id="test-header"');
		expect(html).toContain('id="test-sider"');
		expect(html).toContain('id="test-content"');
		expect(html).toContain('id="test-footer"');
		expect(html).toContain("<header");
		expect(html).toContain("<aside");
		expect(html).toContain("<main");
		expect(html).toContain("<footer");
	});

	it("should automatically detect Sider inside compound layout and set data-has-sider", () => {
		const withoutSider = (
			<Layout>
				<Layout.Content>Content Only</Layout.Content>
			</Layout>
		).toString();
		expect(withoutSider).not.toContain("data-has-sider");

		const withSider = (
			<Layout>
				<Layout.Sider>Sider</Layout.Sider>
				<Layout.Content>Content</Layout.Content>
			</Layout>
		).toString();
		expect(withSider).toContain('data-has-sider="true"');
	});

	it("should respect explicit hasSider prop", () => {
		const html = (
			<Layout hasSider>
				<Layout.Content>Content</Layout.Content>
			</Layout>
		).toString();
		expect(html).toContain('data-has-sider="true"');
	});

	it("should respect local override props on subcomponents", () => {
		const html = (
			<Layout>
				<Layout.Header sticky>Header</Layout.Header>
				<Layout.Sider width="lg" sticky>
					Sider
				</Layout.Sider>
			</Layout>
		).toString();

		// Check layout stickyHeader and stickySider styles or layout-specific width class
		expect(html).toContain("layout__sider--siderWidth_lg");
	});

	it("should support custom classes", () => {
		const html = (
			<Layout class="custom-root">
				<Layout.Header class="custom-header">Header</Layout.Header>
			</Layout>
		).toString();

		expect(html).toContain("custom-root");
		expect(html).toContain("custom-header");
	});

	it("should keep Header/Footer out of the sider row when Sider+Content are wrapped in Layout.Body", () => {
		const html = (
			<Layout>
				<Layout.Header>Header</Layout.Header>
				<Layout.Body>
					<Layout.Sider>Sider</Layout.Sider>
					<Layout.Content>Content</Layout.Content>
				</Layout.Body>
				<Layout.Footer>Footer</Layout.Footer>
			</Layout>
		).toString();

		// Root must NOT flip to a row here — Body owns the sider+content row
		// on its own (it's `display: flex` unconditionally), so Header/Footer
		// stay full-width bars instead of joining that row.
		expect(html).not.toContain("data-has-sider");
		expect(html).toContain("layout__body");
		// Header renders before the body row, Footer after.
		expect(html.indexOf("<header")).toBeLessThan(html.indexOf("layout__body"));
		expect(html.indexOf("layout__body")).toBeLessThan(html.indexOf("<footer"));
	});
});
