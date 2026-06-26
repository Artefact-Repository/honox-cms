import { createRoute } from "honox/factory";
import { Tabs } from "../../components/ui";
import { css } from "styled-system/css";
import { Heading } from "../../components/ui/heading";

export default createRoute((c) => {
	return c.render(
		<div class={css({ py: "12" })}>
			<div class={css({ display: "flex", flexDirection: "column", gap: "12" })}>
				<div class={css({ display: "flex", flexDirection: "column", gap: "4" })}>
					<Heading size="2xl">Tabs - Default (Line)</Heading>
					<Tabs.Root defaultValue="react">
						<Tabs.List>
							<Tabs.Trigger value="react">React</Tabs.Trigger>
							<Tabs.Trigger value="solid">Solid</Tabs.Trigger>
							<Tabs.Trigger value="svelte">Svelte</Tabs.Trigger>
							<Tabs.Trigger value="vue" disabled>Vue (Disabled)</Tabs.Trigger>
							<Tabs.Indicator />
						</Tabs.List>
						<Tabs.Content value="react">React Content</Tabs.Content>
						<Tabs.Content value="solid">Solid Content</Tabs.Content>
						<Tabs.Content value="svelte">Svelte Content</Tabs.Content>
						<Tabs.Content value="vue">Vue Content</Tabs.Content>
					</Tabs.Root>
				</div>

				<div class={css({ display: "flex", flexDirection: "column", gap: "4" })}>
					<Heading size="2xl">Tabs - Subtle</Heading>
					<Tabs.Root defaultValue="react" variant="subtle">
						<Tabs.List>
							<Tabs.Trigger value="react">React</Tabs.Trigger>
							<Tabs.Trigger value="solid">Solid</Tabs.Trigger>
							<Tabs.Trigger value="svelte">Svelte</Tabs.Trigger>
							<Tabs.Indicator />
						</Tabs.List>
						<Tabs.Content value="react">React Content (Subtle)</Tabs.Content>
						<Tabs.Content value="solid">Solid Content (Subtle)</Tabs.Content>
						<Tabs.Content value="svelte">Svelte Content (Subtle)</Tabs.Content>
					</Tabs.Root>
				</div>

				<div class={css({ display: "flex", flexDirection: "column", gap: "4" })}>
					<Heading size="2xl">Tabs - Enclosed</Heading>
					<Tabs.Root defaultValue="react" variant="enclosed">
						<Tabs.List>
							<Tabs.Trigger value="react">React</Tabs.Trigger>
							<Tabs.Trigger value="solid">Solid</Tabs.Trigger>
							<Tabs.Trigger value="svelte">Svelte</Tabs.Trigger>
							<Tabs.Indicator />
						</Tabs.List>
						<Tabs.Content value="react">React Content (Enclosed)</Tabs.Content>
						<Tabs.Content value="solid">Solid Content (Enclosed)</Tabs.Content>
						<Tabs.Content value="svelte">Svelte Content (Enclosed)</Tabs.Content>
					</Tabs.Root>
				</div>

				<div class={css({ display: "flex", flexDirection: "column", gap: "4" })}>
					<Heading size="2xl">Tabs - Vertical</Heading>
					<Tabs.Root defaultValue="react" orientation="vertical">
						<Tabs.List>
							<Tabs.Trigger value="react">React</Tabs.Trigger>
							<Tabs.Trigger value="solid">Solid</Tabs.Trigger>
							<Tabs.Trigger value="svelte">Svelte</Tabs.Trigger>
							<Tabs.Indicator />
						</Tabs.List>
						<Tabs.Content value="react">React Content (Vertical)</Tabs.Content>
						<Tabs.Content value="solid">Solid Content (Vertical)</Tabs.Content>
						<Tabs.Content value="svelte">Svelte Content (Vertical)</Tabs.Content>
					</Tabs.Root>
				</div>

				<div class={css({ display: "flex", flexDirection: "column", gap: "4" })}>
					<Heading size="2xl">Tabs - Manual Activation</Heading>
					<Tabs.Root defaultValue="react" activationMode="manual">
						<Tabs.List>
							<Tabs.Trigger value="react">React</Tabs.Trigger>
							<Tabs.Trigger value="solid">Solid</Tabs.Trigger>
							<Tabs.Trigger value="svelte">Svelte</Tabs.Trigger>
							<Tabs.Indicator />
						</Tabs.List>
						<Tabs.Content value="react">React Content (Manual)</Tabs.Content>
						<Tabs.Content value="solid">Solid Content (Manual)</Tabs.Content>
						<Tabs.Content value="svelte">Svelte Content (Manual)</Tabs.Content>
					</Tabs.Root>
				</div>
			</div>
		</div>,
	);
});
