import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { Anchor } from "../components/ui/anchor";
import { Avatar } from "../components/ui/avatar";
import { Text } from "../components/ui/text";
import { getSveltiaUser, type SveltiaUser } from "../utils/git-backend";

// The only "logged in" signal this app has — Sveltia CMS's own client-side
// session (see git-backend.ts). There's no server-side auth, so this can't
// be known at SSR time; it renders the logged-out state first and swaps in
// the identity after hydration reads localStorage (same pattern as
// useGitToken in git-token-banner.tsx).
export default function AuthStatus() {
	const [user, setUser] = useState<SveltiaUser | null>(null);

	useEffect(() => {
		setUser(getSveltiaUser());
	}, []);

	if (user) {
		const displayName = user.name ?? user.login ?? "";
		return (
			<Anchor
				href="/admin"
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
			href="/admin"
			class={cx(
				button({ variant: "outline", size: "sm" }),
				css({ textStyle: "sm", fontWeight: "medium" }),
			)}
		>
			Login
		</Anchor>
	);
}
