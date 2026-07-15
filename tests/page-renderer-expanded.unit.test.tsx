import { expect, test } from "bun:test";
import { PageRenderer } from "../app/components/page-renderer";

test("PageRenderer renders field correctly with custom children and attributes", () => {
	const content = [
		{
			type: "field",
			label: "Username",
			helperText: "Enter a unique username",
			errorText: "Username is already taken",
			defaultValue: "john_doe",
			required: true,
			disabled: false,
			invalid: true,
			children: [
				{
					type: "button",
					text: "Check Availability",
					variant: "outline",
				}
			]
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("Username");
	expect(html).toContain("Enter a unique username");
	expect(html).toContain("Username is already taken");
	expect(html).toContain("Check Availability");
	expect(html).toContain("data-invalid");
	expect(html).toContain("data-required");
});

test("PageRenderer renders fieldset correctly with legend and nested content", () => {
	const content = [
		{
			type: "fieldset",
			legend: "Contact Information",
			helperText: "Provide your current contact details",
			errorText: "Please fill out all required fields",
			invalid: true,
			children: [
				{
					type: "field",
					label: "Email Address",
					defaultValue: "user@example.com",
				}
			]
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("Contact Information");
	expect(html).toContain("Provide your current contact details");
	expect(html).toContain("Please fill out all required fields");
	expect(html).toContain("Email Address");
	expect(html).toContain("user@example.com");
});

test("PageRenderer renders group correctly", () => {
	const content = [
		{
			type: "group",
			attached: true,
			grow: true,
			orientation: "horizontal",
			children: [
				{
					type: "button",
					text: "Left Option",
				},
				{
					type: "button",
					text: "Right Option",
				}
			]
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("Left Option");
	expect(html).toContain("Right Option");
});

test("PageRenderer renders hover-card correctly with trigger, title, and description", () => {
	const content = [
		{
			type: "hover-card",
			triggerText: "Hover over me",
			showArrow: true,
			title: "User Profile",
			description: "Software Developer from San Francisco",
			children: [
				{
					type: "badge",
					text: "Active",
					colorPalette: "green",
				}
			]
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("Hover over me");
	expect(html).toContain("User Profile");
	expect(html).toContain("Software Developer from San Francisco");
	expect(html).toContain("Active");
});

test("PageRenderer renders dropdown correctly with items", () => {
	const content = [
		{
			type: "dropdown",
			triggerText: "Options Menu",
			items: [
				{
					type: "item",
					label: "Edit Profile",
					value: "edit",
				},
				{
					type: "separator",
				},
				{
					type: "checkbox",
					label: "Receive Notifications",
					value: "notifications",
					checked: true,
				}
			]
		}
	];

	const html = (<PageRenderer content={content} />).toString();

	expect(html).toContain("Options Menu");
	expect(html).toContain("Edit Profile");
	expect(html).toContain("Receive Notifications");
});
