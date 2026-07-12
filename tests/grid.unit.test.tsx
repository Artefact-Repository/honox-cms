import { describe, expect, it } from "bun:test";
import { Col, Row } from "../app/components/ui/grid";

describe("Grid Components", () => {
	it("should render basic Row and Col", () => {
		const rowHtml = (<Row>Row Content</Row>).toString();
		expect(rowHtml).toContain("grid-row");
		expect(rowHtml).toContain("Row Content");

		const colHtml = (<Col>Col Content</Col>).toString();
		expect(colHtml).toContain("grid-col");
		expect(colHtml).toContain("Col Content");
	});

	it("should apply Row alignment, justification, and wrapping", () => {
		const rowHtml = (
			<Row align="middle" justify="center" wrap={false}>
				Content
			</Row>
		).toString();

		expect(rowHtml).toContain("grid-row--align_middle");
		expect(rowHtml).toContain("grid-row--justify_center");
		expect(rowHtml).toContain("grid-row--wrap_false");
	});

	it("should apply Col span, offset, and order variants", () => {
		const colHtml = (
			<Col span={8} offset={4} order={2}>
				Content
			</Col>
		).toString();

		expect(colHtml).toContain("grid-col--span_8");
		expect(colHtml).toContain("grid-col--offset_4");
		expect(colHtml).toContain("grid-col--order_2");
	});

	it("should apply Col push and pull variants", () => {
		const colHtml = (
			<Col push={6} pull={18}>
				Content
			</Col>
		).toString();

		expect(colHtml).toContain("grid-col--push_6");
		expect(colHtml).toContain("grid-col--pull_18");
	});

	it("should apply Col custom flex values", () => {
		const colHtml = <Col flex="1 1 200px">Content</Col>.toString();

		expect(colHtml).toContain("flex_1_1_200px");
	});

	it("should parse Col direct responsive props and objects", () => {
		const colHtml = (
			<Col xs={24} md={{ span: 12, offset: 2 }} lg={8}>
				Content
			</Col>
		).toString();

		expect(colHtml).toContain("grid-col--span_24");
		expect(colHtml).toContain("md:grid-col--span_12");
		expect(colHtml).toContain("md:grid-col--offset_2");
		expect(colHtml).toContain("lg:grid-col--span_8");
	});

	it("should propagate horizontal and vertical gutters to columns", () => {
		const treeHtml = (
			<Row gutter={[16, 24]}>
				<Col span={12}>Child</Col>
			</Row>
		).toString();

		// Row should have negative margin classes equal to half of the gutters
		expect(treeHtml).toContain("ml_-8px");
		expect(treeHtml).toContain("mr_-8px");
		expect(treeHtml).toContain("mt_-12px");
		expect(treeHtml).toContain("mb_-12px");

		// Col should have positive padding classes equal to half of the gutters
		expect(treeHtml).toContain("pl_8px");
		expect(treeHtml).toContain("pr_8px");
		expect(treeHtml).toContain("pt_12px");
		expect(treeHtml).toContain("pb_12px");
	});

	it("should parse responsive gutters", () => {
		const treeHtml = (
			<Row gutter={[{ base: 8, md: 16 }, 12]}>
				<Col span={12} />
			</Row>
		).toString();

		// Gutter X at base: -4px, md: -8px
		expect(treeHtml).toContain("ml_-4px");
		expect(treeHtml).toContain("md:ml_-8px");

		// Gutter Y: -6px
		expect(treeHtml).toContain("mt_-6px");
	});
});
