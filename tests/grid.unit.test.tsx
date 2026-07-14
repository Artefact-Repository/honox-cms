import { describe, expect, it } from "bun:test";
import { Grid } from "../app/components/ui/grid";

describe("Grid Component", () => {
	it("should render basic Grid layout", () => {
		const html = (<Grid>Grid Content</Grid>).toString();
		expect(html).toContain("d_grid");
		expect(html).toContain("Grid Content");
	});

	it("should apply columns, rows, gap, and minChildWidth", () => {
		const html = (
			<Grid columns={4} rows={3} gap="6" minChildWidth="150px">
				Item
			</Grid>
		).toString();

		expect(html).toContain("grid-tc_repeat(4,_minmax(0,_1fr))");
		expect(html).toContain("grid-tr_repeat(3,_minmax(0,_1fr))");
		expect(html).toContain("gap_6");
	});

	it("should parse responsive columns and rows properties", () => {
		const html = (
			<Grid columns={{ base: 1, md: 3 }} rows={{ base: 2, lg: 4 }}>
				Item
			</Grid>
		).toString();

		expect(html).toContain("grid-tc_repeat(1,_minmax(0,_1fr))");
		expect(html).toContain("md:grid-tc_repeat(3,_minmax(0,_1fr))");
		expect(html).toContain("grid-tr_repeat(2,_minmax(0,_1fr))");
		expect(html).toContain("lg:grid-tr_repeat(4,_minmax(0,_1fr))");
	});
});
