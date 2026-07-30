import { css, cx } from "design-system/css";
import { hstack, stack } from "design-system/patterns";
import { button } from "design-system/recipes";
import type { SveltiaUser } from "../../utils/git-backend";
import { Anchor } from "./anchor";
import { Avatar } from "./avatar";
import { HoverCard } from "./hover-card";
import { SkeletonCircle } from "./skeleton";
import { Text } from "./text";

export interface AuthStatusBaseProps {
	/** Undefined means the identity hasn't been resolved yet (renders a
	 * skeleton circle) — the only state knowable at SSR time, since the
	 * identity lives in the browser's localStorage (see git-backend.ts) and
	 * is only readable once the island hydrates. Null means resolution
	 * finished and no one's logged in. */
	user?: SveltiaUser | null;
	/** Where the logged-out avatar links to, and what the logged-in
	 * HoverCard's "Open CMS" button links to. Defaults to the plain CMS
	 * admin root; a page for a specific CMS entry (e.g. a doc) can pass its
	 * own deep-link instead — see docs/[doc].tsx's `withDocEditHref`. */
	href?: string;
}

export function AuthStatusBase({ user, href = "/admin" }: AuthStatusBaseProps) {
	if (user === undefined) {
		return <SkeletonCircle size="8" />;
	}

	if (user) {
		const displayName = user.name ?? user.login ?? "";
		return (
			<HoverCard
				trigger={
					<Avatar size="xs" name={displayName} src={user.avatarURL ?? undefined} />
				}
				content={
					<div class={stack({ gap: "3", minWidth: "44" })}>
						<Text class={css({ fontWeight: "medium", color: "fg" })}>
							{displayName}
						</Text>
						<div class={hstack({ gap: "2" })}>
							<Anchor
								href={href}
								class={cx(
									button({ variant: "outline", size: "sm" }),
									css({ flex: "1", textStyle: "sm" }),
								)}
							>
								Open CMS
							</Anchor>
							<Anchor
								href="/settings"
								class={cx(
									button({ variant: "solid", size: "sm" }),
									css({ flex: "1", textStyle: "sm" }),
								)}
							>
								Settings
							</Anchor>
						</div>
					</div>
				}
			/>
		);
	}

	// Logged out — a generic-person avatar circle rather than a "Login"
	// button, so the header always has the same circular shape in this spot
	// (loading, logged-out, or logged-in) and nothing jolts into place.
	return (
		<Anchor href={href} aria-label="Log in" variant="plain">
			<Avatar size="xs" />
		</Anchor>
	);
}
