import { test, expect } from "@playwright/test";

test.describe("Tabs", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/tests/tabs");
	});

	test("should switch tabs on click", async ({ page }) => {
		const tabsRoot = page.locator('[data-part="root"]').first();
		await expect(tabsRoot).toBeVisible();

		// Wait for hydration
		await expect(tabsRoot).toHaveAttribute("data-hydrated", "true");

		const reactTrigger = page.getByRole("tab", { name: "React", exact: true }).first();
		const solidTrigger = page.getByRole("tab", { name: "Solid", exact: true }).first();
		const reactContent = page.getByText("React Content").first();
		const solidContent = page.getByText("Solid Content").first();

		// Initial state
		await expect(reactTrigger).toHaveAttribute("data-state", "active");
		await expect(solidTrigger).toHaveAttribute("data-state", "inactive");
		await expect(reactContent).toBeVisible();
		await expect(solidContent).not.toBeVisible();

		// Click Solid tab
		await solidTrigger.click();

		// New state
		await expect(reactTrigger).toHaveAttribute("data-state", "inactive");
		await expect(solidTrigger).toHaveAttribute("data-state", "active");
		await expect(reactContent).not.toBeVisible();
		await expect(solidContent).toBeVisible();
	});

	test("should navigate with keyboard (automatic activation)", async ({ page }) => {
		const reactTrigger = page.getByRole("tab", { name: "React", exact: true }).first();
		const solidTrigger = page.getByRole("tab", { name: "Solid", exact: true }).first();
		const svelteTrigger = page.getByRole("tab", { name: "Svelte", exact: true }).first();
        const solidContent = page.getByText("Solid Content").first();

		await reactTrigger.focus();
		await page.keyboard.press("ArrowRight");

		await expect(solidTrigger).toBeFocused();
		await expect(solidTrigger).toHaveAttribute("data-state", "active");
        await expect(solidContent).toBeVisible();

		await page.keyboard.press("ArrowRight");
		await expect(svelteTrigger).toBeFocused();
		await expect(svelteTrigger).toHaveAttribute("data-state", "active");
	});

	test("should navigate with keyboard (manual activation)", async ({ page }) => {
		const manualTabsRoot = page.locator('div:has(> h2:has-text("Tabs - Manual Activation")) + div[data-part="root"]');
		const reactTrigger = manualTabsRoot.getByRole("tab", { name: "React", exact: true });
		const solidTrigger = manualTabsRoot.getByRole("tab", { name: "Solid", exact: true });
		const solidContent = manualTabsRoot.locator('[data-part="content"][data-value="solid"]');

		await reactTrigger.focus();
		await page.keyboard.press("ArrowRight");

		await expect(solidTrigger).toBeFocused();
		await expect(solidTrigger).toHaveAttribute("data-state", "inactive");
		await expect(solidContent).not.toBeVisible();

		await page.keyboard.press("Enter");
		await expect(solidTrigger).toHaveAttribute("data-state", "active");
		await expect(solidContent).toBeVisible();
	});

	test("should not select disabled tab", async ({ page }) => {
		const vueTrigger = page.getByRole("tab", { name: "Vue (Disabled)" }).first();
		await expect(vueTrigger).toHaveAttribute("data-disabled", "");

		await vueTrigger.click();
		await expect(vueTrigger).toHaveAttribute("data-state", "inactive");
	});
});
