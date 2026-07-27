import { expect, test } from "bun:test";
import { Field } from "./field";
import { Input } from "./input";

test("Field - Flattened API renders basic structure", () => {
	const html = (
		<Field
			id="test-field"
			label="Username"
			helperText="Choose a unique username"
			defaultValue="jules"
		/>
	).toString();

	// Verify label rendering
	expect(html).toContain("Username");
	expect(html).toContain('id="field::test-field::label"');
	expect(html).toContain('for="test-field"');

	// Verify input rendering
	expect(html).toContain('<input id="test-field"');
	expect(html).toContain('value="jules"');

	// Verify helper text rendering
	expect(html).toContain("Choose a unique username");
	expect(html).toContain('id="field::test-field::helper-text"');
});

test("Field - JSX errorText is rendered and announced", () => {
	const html = (
		<Field
			id="jsx-error-field"
			label="Username"
			invalid
			errorText={<span>Username is taken</span>}
		/>
	).toString();

	expect(html).toContain("Username is taken");
	expect(html).toContain('aria-live="polite"');
	expect(html).toContain('id="field::jsx-error-field::error-text"');
	expect(html).toContain(
		'aria-describedby="field::jsx-error-field::error-text"',
	);
});

test("Field - Flattened API validation (minLength)", () => {
	const html = (
		<Field
			id="validate-field"
			label="Username"
			helperText="Choose a unique username"
			defaultValue="ab"
			minLength={5}
		/>
	).toString();

	// Verify error message for minLength validation
	expect(html).toContain("Must be at least 5 characters");
	expect(html).toContain('aria-invalid="true"');
	expect(html).toContain('data-invalid=""');
});

test("Field - Supports type prop", () => {
	const html = (
		<Field id="password-field" label="Password" type="password" />
	).toString();

	expect(html).toContain('type="password"');
});

test("Field - Correctly priorities value over defaultValue on SSR", () => {
	const html = (
		<Field
			id="ssr-value-field"
			label="Input"
			value="controlled-val"
			defaultValue="default-val"
		/>
	).toString();

	expect(html).toContain('value="controlled-val"');
	expect(html).not.toContain('value="default-val"');
});

test("Field - Composition with Input component and attribute filtration", () => {
	const html = (
		<Field
			id="composed-field"
			name="username-input"
			placeholder="Composed Placeholder"
			autocomplete="off"
		>
			<Input value="composed-val" />
		</Field>
	).toString();

	// Verify wrapper div does not have name, placeholder, autocomplete attributes
	expect(html).not.toContain('<div class="field__root" name="username-input"');
	expect(html).not.toContain('placeholder="Composed Placeholder"');
	expect(html).not.toContain('autocomplete="off"');

	// Verify nested Input reads field context correctly
	expect(html).toContain('<input id="composed-field"');
	expect(html).toContain('value="composed-val"');
});
