import { toaster } from "../components/ui/toast";
import GitTokenBanner, { useGitToken } from "./git-token-banner";

// One connect/disconnect banner for the whole /settings page — each of the
// five form islands below independently disables its own inputs via its own
// useGitToken() call, but they all react to the *same* connect/disconnect
// action via the cross-island event useGitToken() now listens for (see
// git-token-banner.tsx), so connecting here unlocks every card at once.
export default function SettingsAuthBanner() {
	const { token, tokenSource, connect, disconnect } = useGitToken();

	return (
		<GitTokenBanner
			token={token}
			tokenSource={tokenSource}
			onConnect={(value) => {
				if (connect(value)) {
					toaster.success("Connected — every setting below is now editable.");
				}
			}}
			onDisconnect={disconnect}
			connectedHint="every setting below is editable."
			promptSuffix=" to edit and save settings below:"
		/>
	);
}
