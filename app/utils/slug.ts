// Shared with every direct-commit "create" flow (tasks, projects) so
// hand-created and CMS-created files stay consistent with the CMS's own
// `{{slug}}` pattern (see public/admin/config.yml).
export function slugify(title: string): string {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
