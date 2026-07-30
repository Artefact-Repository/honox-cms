import AuthStatusIsland from "../../islands/auth-status";
import { AuthStatusBase, type AuthStatusBaseProps } from "./auth-status-primitive";
import { shouldHydrate } from "./island-utils";

export interface AuthStatusProps extends Pick<AuthStatusBaseProps, "href"> {
	interactive?: boolean;
}

// Auto-interactive (Tier-1): the logged-in identity only exists in the
// browser's localStorage (see git-backend.ts), so this needs JS to ever show
// anything but the logged-out state — hydrates unless explicitly opted out.
export function AuthStatus({ interactive, href }: AuthStatusProps = {}) {
	if (shouldHydrate(interactive, true)) {
		return <AuthStatusIsland href={href} />;
	}
	return <AuthStatusBase href={href} />;
}

export default AuthStatus;
