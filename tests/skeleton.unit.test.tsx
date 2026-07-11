import { expect, test } from "bun:test";
import { Skeleton, SkeletonCircle } from "../app/components/ui/skeleton";
import { css } from "styled-system/css";

test("SkeletonCircle component renders with class and boxSize", async () => {
	const html = (await SkeletonCircle({
		class: css({ boxSize: "12" }),
	})) as unknown as { toString: () => string };
	const htmlString = html.toString();
	expect(htmlString).toContain("skeleton");
	expect(htmlString).toContain("skeleton--circle_true");
	expect(htmlString).toContain("size_12");
});

test("SkeletonCircle component renders with direct size prop", async () => {
	const html = (await SkeletonCircle({
		size: "12",
	})) as unknown as { toString: () => string };
	const htmlString = html.toString();
	expect(htmlString).toContain("skeleton");
	expect(htmlString).toContain("skeleton--circle_true");
	expect(htmlString).toContain("size_12");
});

test("Skeleton component renders with width and height props", async () => {
	const html = (await Skeleton({
		width: "40",
		height: "6",
	})) as unknown as { toString: () => string };
	const htmlString = html.toString();
	expect(htmlString).toContain("skeleton");
	expect(htmlString).toContain("w_40");
	expect(htmlString).toContain("h_6");
});

test("Skeleton component renders with variant='circle' prop", async () => {
	const html = (await Skeleton({
		variant: "circle",
		size: "10",
	})) as unknown as { toString: () => string };
	const htmlString = html.toString();
	expect(htmlString).toContain("skeleton");
	expect(htmlString).toContain("skeleton--circle_true");
	expect(htmlString).toContain("size_10");
});

test("Skeleton component renders with variant='text' prop", async () => {
	const html = (await Skeleton({
		variant: "text",
		noOfLines: 2,
	})) as unknown as { toString: () => string };
	const htmlString = html.toString();
	expect(htmlString).toContain("skeleton");
	// Should render multiple lines (as Skeletons inside a stack)
	const skeletonOccurrences = (htmlString.match(/class="[^"]*skeleton/g) || []).length;
	// 2 inner lines = 2 skeletons total
	expect(skeletonOccurrences).toBe(2);
});
