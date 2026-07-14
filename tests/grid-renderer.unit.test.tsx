import { expect, test } from "bun:test";
import { PageRenderer } from "../app/components/page-renderer";

test("PageRenderer renders flat grid component correctly", () => {
	const content = [
		{
			type: "grid",
			columns: 3,
			rows: 2,
			gap: "4",
			minChildWidth: "200px",
			children: [
				{
					type: "button",
					text: "Grid Button 1",
				},
				{
					type: "button",
					text: "Grid Button 2",
				}
			]
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	// Verify grid element and layout attributes are rendered correctly as compiled classes
	expect(html).toContain("d_grid");
	expect(html).toContain("grid-tc_repeat(3,_minmax(0,_1fr))");
	expect(html).toContain("grid-tr_repeat(2,_minmax(0,_1fr))");
	expect(html).toContain("gap_4");

	// Verify child components are rendered inside the grid directly
	expect(html).toContain("Grid Button 1");
	expect(html).toContain("Grid Button 2");
});

test("PageRenderer parses responsive grid columns and gap props", () => {
	const content = [
		{
			type: "grid",
			columns: '{"base": 1, "md": 3}',
			gap: "6",
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("d_grid");
	// Check for responsive styles
	expect(html).toContain("grid-tc_repeat(1,_minmax(0,_1fr))");
	expect(html).toContain("md:grid-tc_repeat(3,_minmax(0,_1fr))");
});
