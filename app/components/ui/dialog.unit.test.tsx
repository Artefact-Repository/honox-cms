import { describe, expect, test } from "bun:test";
import { Dialog } from "./dialog";

describe("Dialog Unit Tests", () => {
	test("should render flattened API correctly", () => {
		const html = (
			<Dialog
				trigger={<button type="button">Open</button>}
				title="Dialog Title"
				description="Dialog Description"
				body="Body content"
				cancel={<button type="button">Close</button>}
			/>
		).toString();

		expect(html).toContain('data-part="trigger"');
		expect(html).toContain("Open");
		expect(html).toContain('data-part="content"');
		expect(html).toContain("Dialog Title");
		expect(html).toContain("Dialog Description");
		expect(html).toContain("Body content");
		expect(html).toContain("Close");
		expect(html).toContain('data-part="close-trigger"');
	});

	test("should expose compound namespace on main export", () => {
		expect(Dialog.Root).toBeDefined();
		expect(Dialog.Trigger).toBeDefined();
		expect(Dialog.Backdrop).toBeDefined();
		expect(Dialog.Positioner).toBeDefined();
		expect(Dialog.Content).toBeDefined();
		expect(Dialog.Header).toBeDefined();
		expect(Dialog.Body).toBeDefined();
		expect(Dialog.Footer).toBeDefined();
		expect(Dialog.Title).toBeDefined();
		expect(Dialog.Description).toBeDefined();
		expect(Dialog.CloseTrigger).toBeDefined();
		expect(Dialog.ActionTrigger).toBeDefined();
	});

	test("should render compound components correctly", () => {
		const html = (
			<Dialog.Root open={true}>
				<Dialog.Trigger>Open Trigger</Dialog.Trigger>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>My Title</Dialog.Title>
							<Dialog.Description>My Description</Dialog.Description>
						</Dialog.Header>
						<Dialog.Body>My Body</Dialog.Body>
						<Dialog.Footer>
							<Dialog.CloseTrigger>Close Me</Dialog.CloseTrigger>
							<Dialog.ActionTrigger>Action Me</Dialog.ActionTrigger>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Dialog.Root>
		).toString();

		expect(html).toContain('data-part="trigger"');
		expect(html).toContain("Open Trigger");
		expect(html).toContain('data-part="backdrop"');
		expect(html).toContain('data-part="positioner"');
		expect(html).toContain('data-part="content"');
		expect(html).toContain('data-part="title"');
		expect(html).toContain("My Title");
		expect(html).toContain('data-part="description"');
		expect(html).toContain("My Description");
		expect(html).toContain("My Body");
		expect(html).toContain('data-part="close-trigger"');
		expect(html).toContain("Close Me");
		expect(html).toContain('data-part="action-trigger"');
		expect(html).toContain("Action Me");
	});

	test("isNestedTarget should correctly identify elements inside nested overlays/boundaries", () => {
		const { isNestedTarget } = require("./overlay-a11y");

		// Run only if we are in a DOM-supported environment
		if (typeof document !== "undefined") {
			// Set up mock DOM elements
			const root = document.createElement("div");
			root.setAttribute("data-overlay-root", "true");
			root.setAttribute("data-scope", "dialog");

			const nestedOverlay = document.createElement("div");
			nestedOverlay.setAttribute("data-overlay-root", "true");
			nestedOverlay.setAttribute("data-scope", "select");
			root.appendChild(nestedOverlay);

			const nestedItem = document.createElement("div");
			nestedItem.setAttribute("data-part", "item");
			nestedOverlay.appendChild(nestedItem);

			const directItem = document.createElement("div");
			directItem.setAttribute("data-part", "close-trigger");
			root.appendChild(directItem);

			expect(isNestedTarget(nestedItem, root)).toBe(true);
			expect(isNestedTarget(directItem, root)).toBe(false);
		}
	});
});
