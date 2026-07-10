import { expect, test } from "bun:test";
import { PageRenderer } from "../app/components/page-renderer";

test("PageRenderer renders card and its children components correctly", () => {
	const content = [
		{
			type: "card",
			title: "Mountain Adventure",
			description: "Explore nature.",
			body: "Get ready for a nice trip.",
			children: [
				{
					type: "button",
					text: "Book Cabin",
					variant: "solid",
					colorPalette: "green"
				}
			]
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("Mountain Adventure");
	expect(html).toContain("Explore nature.");
	expect(html).toContain("Get ready for a nice trip.");
	expect(html).toContain("Book Cabin");
});

test("PageRenderer renders checkbox correctly", () => {
	const content = [
		{
			type: "checkbox",
			label: "Accept Terms",
			checked: true,
			colorPalette: "blue"
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("Accept Terms");
	expect(html).toContain("checkbox");
});

test("PageRenderer renders collapsible correctly", () => {
	const content = [
		{
			type: "collapsible",
			triggerText: "Click to reveal",
			showIndicator: true,
			children: [
				{
					type: "text",
					content: "Secret content"
				}
			]
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("Click to reveal");
	expect(html).toContain("Secret content");
});

test("PageRenderer renders combobox correctly", () => {
	const content = [
		{
			type: "combobox",
			label: "Select Tech",
			placeholder: "Choose...",
			items: [
				{ "label": "Hono", "value": "hono" },
				{ "label": "React", "value": "react" }
			]
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("Select Tech");
	expect(html).toContain("Choose...");
	expect(html).toContain("Hono");
	expect(html).toContain("React");
});

test("PageRenderer renders dialog correctly", () => {
	const content = [
		{
			type: "dialog",
			title: "Confirm Action",
			description: "Are you sure?",
			triggerText: "Open Dialog",
			confirmText: "Yes",
			cancelText: "No"
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("Confirm Action");
	expect(html).toContain("Are you sure?");
	expect(html).toContain("Open Dialog");
	expect(html).toContain("Yes");
	expect(html).toContain("No");
});

test("PageRenderer renders drawer correctly", () => {
	const content = [
		{
			type: "drawer",
			title: "Sidebar",
			description: "Extra options.",
			triggerText: "Open Drawer",
			confirmText: "Save",
			cancelText: "Close"
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("Sidebar");
	expect(html).toContain("Extra options.");
	expect(html).toContain("Open Drawer");
	expect(html).toContain("Save");
	expect(html).toContain("Close");
});

test("PageRenderer renders popover correctly", () => {
	const content = [
		{
			type: "popover",
			triggerText: "Click to open popover",
			title: "Popover Title",
			description: "Popover Desc",
			body: "Popover Body",
			footer: "Popover Footer"
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("Click to open popover");
	expect(html).toContain("Popover Title");
	expect(html).toContain("Popover Desc");
	expect(html).toContain("Popover Body");
	expect(html).toContain("Popover Footer");
});

test("PageRenderer renders skeleton correctly", () => {
	const content = [
		{
			type: "skeleton",
			variant: "text",
			noOfLines: 2,
			loaded: false
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("class=\"skeleton");
});

test("PageRenderer renders paginatedTable and pagination correctly", () => {
	const content = [
		{
			type: "paginatedTable"
		},
		{
			type: "pagination",
			count: 50,
			pageSize: 10,
			defaultPage: 2
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("Alice Johnson"); // from PaginatedTable default state
	expect(html).toContain("aria-label=\"Next Page\""); // standard pagination attribute
});

test("PageRenderer renders progress correctly", () => {
	const content = [
		{
			type: "progress",
			label: "Loading Task",
			value: 75,
			showValueText: true
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("Loading Task");
	expect(html).toContain("75");
});

test("PageRenderer renders radioGroup and segmentGroup correctly", () => {
	const content = [
		{
			type: "radioGroup",
			label: "Select Option",
			items: [
				{ label: "Opt A", value: "a" },
				{ label: "Opt B", value: "b" }
			]
		},
		{
			type: "segmentGroup",
			label: "View Mode",
			items: [
				{ label: "Grid", value: "grid" },
				{ label: "List", value: "list" }
			]
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("Select Option");
	expect(html).toContain("Opt A");
	expect(html).toContain("Opt B");
	expect(html).toContain("View Mode");
	expect(html).toContain("Grid");
	expect(html).toContain("List");
});

test("PageRenderer renders slider and switch correctly", () => {
	const content = [
		{
			type: "slider",
			label: "Volume",
			defaultValue: 40,
			showValueText: true
		},
		{
			type: "switch",
			label: "Dark Mode",
			checked: true
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("Volume");
	expect(html).toContain("40");
	expect(html).toContain("Dark Mode");
	expect(html).toContain("role=\"switch\"");
});
