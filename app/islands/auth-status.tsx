import { useEffect, useState } from "hono/jsx";
import {
	AuthStatusBase,
	type AuthStatusBaseProps,
} from "../components/ui/auth-status-primitive";
import { getSveltiaUser, type SveltiaUser } from "../utils/git-backend";

export interface AuthStatusProps extends Pick<AuthStatusBaseProps, "href"> {}

// The only "logged in" signal this app has — Sveltia CMS's own client-side
// session (see git-backend.ts). There's no server-side auth, so this can't
// be known at SSR time; AuthStatusBase renders a skeleton circle first and
// this swaps in the resolved identity (or logged-out avatar) after hydration
// reads localStorage (same pattern as useGitToken in git-token-banner.tsx).
export default function AuthStatus({ href }: AuthStatusProps) {
	const [user, setUser] = useState<SveltiaUser | null | undefined>(undefined);

	useEffect(() => {
		setUser(getSveltiaUser());
	}, []);

	return <AuthStatusBase user={user} href={href} />;
}
