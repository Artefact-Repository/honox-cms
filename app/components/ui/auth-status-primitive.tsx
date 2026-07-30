import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import type { SveltiaUser } from "../../utils/git-backend";
import { Anchor } from "./anchor";
import { Avatar } from "./avatar";
import { Text } from "./text";

export interface AuthStatusBaseProps {
	/** Undefined/null renders the logged-out "Login" button — the only state
	 * knowable at SSR time, since the identity lives in the browser's
	 * localStorage (see git-backend.ts). */
	user?: SveltiaUser | null;
	/** Where both the "Login" button and the logged-in identity link to.
	 * Defaults to the plain CMS admin root; a page for a specific CMS entry
	 * (e.g. a doc) can pass its own deep-link instead — see docs/[doc].tsx's
	 * `withDocEditHref`. */
	href?: string;
}

export function AuthStatusBase({ user, href = "/admin" }: AuthStatusBaseProps) {
	if (user) {
		const displayName = user.name ?? user.login ?? "";
		return (
			<Anchor
				href={href}
				variant="plain"
				class={css({
					display: "flex",
					alignItems: "center",
					gap: "2",
					textDecoration: "none",
				})}
			>
				<Avatar size="xs" name={displayName} src={user.avatarURL ?? undefined} />
				<Text
					size="sm"
					class={css({ fontWeight: "medium", color: "fg", whiteSpace: "nowrap" })}
				>
					{displayName}
				</Text>
			</Anchor>
		);
	}

	return (
		<Anchor
			href={href}
			class={cx(
				button({ variant: "outline", size: "sm" }),
				css({ textStyle: "sm", fontWeight: "medium" }),
			)}
		>
			Login
		</Anchor>
	);
}
