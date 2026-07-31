import { css } from "design-system/css";
import { Text } from "../components/ui/text";
import { useGitToken } from "./git-token-banner";

// Every editable surface on the task detail page (title, body, project,
// subtasks, the "..." actions menu) silently drops its edit affordance when
// logged out — see task-editable-text.tsx, task-project-editor.tsx,
// task-actions-menu.tsx, task-subtasks.tsx. Rather than repeating a "sign in
// to edit" aside next to each one, this explains it once, in the same small
// muted-hint style the /settings forms already use for the same "no token"
// state (see settings-blog-form.tsx etc).
export default function TaskEditHint() {
	const { token } = useGitToken();
	if (token) return null;

	return (
		<Text size="xs" class={css({ color: "fg.muted", mb: "3" })}>
			Read-only — sign in to edit this task.
		</Text>
	);
}
