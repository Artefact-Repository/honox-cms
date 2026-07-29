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

	test("should render data-overlay-root on Dialog and nested Select components", () => {
		const html = (
			<Dialog.Root open={true}>
				<Dialog.Trigger>Open Dialog</Dialog.Trigger>
				<Dialog.Content>
					<div id="nested-select" data-scope="select" data-part="root" data-overlay-root>
						<button data-part="trigger">Open Select</button>
					</div>
				</Dialog.Content>
			</Dialog.Root>
		).toString();

		expect(html).toContain('data-overlay-root="true"');
		expect(html).toContain('data-scope="select"');
	});
});
