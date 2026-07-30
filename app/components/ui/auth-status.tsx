import AuthStatusIsland from "../../islands/auth-status";
import {
	AuthStatusBase,
	type AuthStatusBaseProps,
} from "./auth-status-primitive";
import { shouldHydrate } from "./island-utils";

export interface AuthStatusProps extends Pick<AuthStatusBaseProps, "href"> {
	interactive?: boolean;
}

// Auto-interactive (Tier-1): the logged-in identity only exists in the
// browser's localStorage (see git-backend.ts), so this needs JS to ever show
// anything but the logged-out state — hydrates unless explicitly opted out.
export function AuthStatus({ interactive, href }: AuthStatusProps = {}) {
	if (shouldHydrate(interactive, true)) {
		// The island resolves this after mount; user=undefined here is the
		// SSR/pre-hydration skeleton state, not a claim that no one's logged in.
		return <AuthStatusIsland href={href} />;
	}
	// No island means no JS is ever coming to resolve the identity, so this
	// definitively renders the logged-out state rather than an eternal skeleton.
	return <AuthStatusBase user={null} href={href} />;
}

export default AuthStatus;
