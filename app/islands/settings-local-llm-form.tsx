import { css } from "design-system/css";
import { useEffect, useState } from "hono/jsx";
import { FieldInfo } from "../components/settings-field-info";
import { Badge } from "../components/ui/badge";
import { InteractiveCombobox } from "../components/ui/combobox-primitive";
import { Stack } from "../components/ui/stack";
import { Switch } from "../components/ui/switch";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import {
	AVAILABLE_MODELS,
	DEFAULT_MODEL_ID,
	getStoredModelId,
	isAiAssistEnabled,
	isModelCached,
	isWebGpuSupported,
	setAiAssistEnabled,
	setStoredModelId,
} from "../utils/ai-engine";

export interface LocalLlmSettingsFormProps {
	descriptions: Record<string, string>;
}

const modelItems = AVAILABLE_MODELS.map((m) => ({
	label: m.label,
	value: m.id,
}));

// Unlike every other /settings/<slug> form (home/blog/docs/pms/cms-admin),
// this one has nothing to load server-side and nothing to commit to git: the
// opt-in flag and model choice are a per-browser preference in localStorage
// (see app/utils/ai-engine.ts), the same posture as the git host token in
// git-token-banner.tsx — not a `configs` field, so no `useGitToken()` gating
// and no batched "Save changes" button. Each control takes effect
// immediately, and every value is only ever read after hydration (SSR has no
// access to this browser's localStorage).
export default function LocalLlmSettingsForm({
	descriptions,
}: LocalLlmSettingsFormProps) {
	// Every one of these defaults (false / DEFAULT_MODEL_ID) is also what its
	// getter returns server-side (no `localStorage`/`navigator` during SSR),
	// so the pre-hydration render already matches this component's real
	// first-mount output — same "starts false, corrected post-mount" shape as
	// `isWebGpuSupported()` in pms-create-menu.tsx — instead of returning
	// `null` until an effect runs, which would flash the whole card empty.
	const [webGpuSupported, setWebGpuSupported] = useState(false);
	const [enabled, setEnabled] = useState(false);
	const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
	const [cached, setCached] = useState<boolean | null>(null);

	useEffect(() => {
		setWebGpuSupported(isWebGpuSupported());
		setEnabled(isAiAssistEnabled());
		setModelId(getStoredModelId());
	}, []);

	useEffect(() => {
		if (!modelId) return;
		let cancelled = false;
		setCached(null);
		void isModelCached(modelId).then((result) => {
			if (!cancelled) setCached(result);
		});
		return () => {
			cancelled = true;
		};
	}, [modelId]);

	const handleEnabledChange = (checked: boolean) => {
		setAiAssistEnabled(checked);
		setEnabled(checked);
		toaster.success(
			checked ? "Local AI assist enabled." : "Local AI assist disabled.",
			{
				description: checked
					? "Bulk Create (AI) is now available on /tasks and /projects."
					: "The AI entry point is hidden again on this browser.",
			},
		);
	};

	const handleModelChange = (value: string) => {
		setStoredModelId(value);
		setModelId(value);
		toaster.success("Model updated.", {
			description: "Used the next time local AI assist runs.",
		});
	};

	return (
		<Stack direction="column" gap="5" class={css({ alignItems: "stretch" })}>
			<div
				class={css({
					p: "4",
					borderWidth: "1px",
					borderColor: "border",
					borderRadius: "md",
					bg: "blue.subtle.bg",
				})}
			>
				<Text size="sm" class={css({ fontWeight: "semibold", mb: "1" })}>
					Runs 100% in your browser
				</Text>
				<Text size="sm" class={css({ color: "fg.muted" })}>
					Local AI assist uses WebGPU to run a small language model entirely on
					this device. Your task content, documents, and prompts are never sent
					to any server — there's no remote-API fallback if your device can't
					run it.
				</Text>
			</div>

			<Stack align="center" justify="space-between">
				<Text size="sm">
					Enable local AI assist{" "}
					<FieldInfo description={descriptions.aiAssistEnabled} />
				</Text>
				<Switch
					checked={enabled}
					onCheckedChange={(details: { checked: boolean }) =>
						handleEnabledChange(details.checked)
					}
					disabled={!webGpuSupported}
				/>
			</Stack>

			<div>
				<Text size="sm" class={css({ fontWeight: "medium", mb: "1.5" })}>
					Model <FieldInfo description={descriptions.aiAssistModel} />
				</Text>
				<div class={css({ maxWidth: "80" })}>
					<InteractiveCombobox
						items={modelItems}
						value={modelId}
						onValueChange={handleModelChange}
						size="sm"
						disabled={!enabled || !webGpuSupported}
					/>
				</div>
			</div>

			<Stack
				direction="column"
				gap="2.5"
				class={css({
					alignItems: "stretch",
					p: "4",
					borderWidth: "1px",
					borderColor: "border",
					borderRadius: "md",
				})}
			>
				<Text size="sm" class={css({ fontWeight: "medium" })}>
					Device status
				</Text>

				<Stack align="center" justify="space-between">
					<Text size="sm" class={css({ color: "fg.muted" })}>
						WebGPU
					</Text>
					{webGpuSupported ? (
						<Badge variant="subtle" size="sm" colorPalette="success">
							Supported
						</Badge>
					) : (
						<Badge variant="subtle" size="sm" colorPalette="error">
							Not supported
						</Badge>
					)}
				</Stack>

				{!webGpuSupported && (
					<Text size="xs" class={css({ color: "fg.muted" })}>
						WebLLM has no CPU fallback — try a recent Chrome or Edge on a
						WebGPU-capable device. Local AI assist stays hidden until then.
					</Text>
				)}

				{webGpuSupported && (
					<Stack align="center" justify="space-between">
						<Text size="sm" class={css({ color: "fg.muted" })}>
							Selected model
						</Text>
						{cached === null ? (
							<Text size="sm" class={css({ color: "fg.muted" })}>
								Checking cache...
							</Text>
						) : cached ? (
							<Badge variant="subtle" size="sm" colorPalette="success">
								Downloaded — ready offline
							</Badge>
						) : (
							<Badge variant="subtle" size="sm" colorPalette="gray">
								Not downloaded (~1-2GB on first use)
							</Badge>
						)}
					</Stack>
				)}
			</Stack>
		</Stack>
	);
}
