import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { Stack } from "../components/ui/stack";
import { Text } from "../components/ui/text";
import {
	clearStoredToken,
	resolveToken,
	setStoredToken,
} from "../utils/git-backend";

/** Resolves/stores the git host token every direct-commit editor needs
 * (personal access token, or the Sveltia CMS session if one's already
 * logged in) — shared by TaskBoard's drag-and-drop and TaskTreeDnd's
 * reparent/reorder drags, the two places that need a connect/disconnect
 * banner rather than just calling `requireToken()` and showing an error. */
export function useGitToken() {
	const [token, setToken] = useState<string | null>(null);
	const [tokenSource, setTokenSource] = useState<"sveltia" | "manual" | null>(
		null,
	);

	// localStorage only exists client-side, so the connect state can't be
	// known during SSR — read it once after hydration.
	useEffect(() => {
		const resolved = resolveToken();
		setToken(resolved.token);
		setTokenSource(resolved.source);
	}, []);

	const connect = (value: string) => {
		const trimmed = value.trim();
		if (!trimmed) return false;
		setStoredToken(trimmed);
		setToken(trimmed);
		setTokenSource("manual");
		return true;
	};

	const disconnect = () => {
		clearStoredToken();
		setToken(null);
		setTokenSource(null);
	};

	return { token, tokenSource, connect, disconnect };
}

export interface GitTokenBannerProps {
	token: string | null;
	tokenSource: "sveltia" | "manual" | null;
	/** Called with the trimmed input value on submit; the caller decides the
	 * success toast copy (different per feature) after calling `connect`. */
	onConnect: (value: string) => void;
	onDisconnect: () => void;
	/** Shown once connected, e.g. "Drag a card to move it." */
	connectedHint: string;
	/** Shown in the connect form ahead of the input, e.g. "to drag tasks between columns:" */
	promptSuffix: string;
}

export default function GitTokenBanner({
	token,
	tokenSource,
	onConnect,
	onDisconnect,
	connectedHint,
	promptSuffix,
}: GitTokenBannerProps) {
	const [tokenInput, setTokenInput] = useState("");

	if (token) {
		return (
			<Stack align="center" gap="2" class={css({ mb: "4", color: "fg.muted" })}>
				<Text size="xs">
					{tokenSource === "sveltia"
						? `Using your CMS login — ${connectedHint}`
						: connectedHint}
				</Text>
				{tokenSource === "manual" && (
					<button
						type="button"
						onClick={onDisconnect}
						class={css({
							all: "unset",
							cursor: "pointer",
							fontSize: "xs",
							textDecoration: "underline",
						})}
					>
						Disconnect
					</button>
				)}
			</Stack>
		);
	}

	return (
		<form
			onSubmit={(event: Event) => {
				event.preventDefault();
				onConnect(tokenInput);
				setTokenInput("");
			}}
			class={css({
				display: "flex",
				flexWrap: "wrap",
				alignItems: "center",
				gap: "2",
				mb: "4",
				p: "3",
				borderWidth: "1px",
				borderColor: "border",
				borderRadius: "md",
				bg: "gray.subtle.bg",
			})}
		>
			<Text size="sm" class={css({ color: "fg.muted" })}>
				Connect a personal access token (repo contents read/write access)
				{promptSuffix}
			</Text>
			<input
				type="password"
				value={tokenInput}
				placeholder="Personal access token"
				onInput={(e: Event) =>
					setTokenInput((e.target as HTMLInputElement).value)
				}
				class={css({
					borderWidth: "1px",
					borderColor: "border",
					borderRadius: "sm",
					px: "2",
					py: "1",
					fontSize: "sm",
					minWidth: "200px",
				})}
			/>
			<button
				type="submit"
				class={cx(button({ variant: "outline", size: "sm" }))}
			>
				Connect
			</button>
		</form>
	);
}
