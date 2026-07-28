/**
 * Folds a fenced code block into the immediately preceding <DemoPreview>
 * element as a trailing child, at mdast level, before MDX compiles JSX. This
 * lets DemoPreview (app/components/demo-preview.tsx) render code + live
 * preview side-by-side in a Splitter without every content/*.mdx file
 * needing to pass the code as a prop or import a new component.
 *
 * Untyped (mdast/mdast-util-mdx-jsx aren't direct deps, just transitive) —
 * this only touches `type`/`name`/`children`, which are stable across mdast.
 */
export function remarkDemoPreviewCodeMerge() {
	// biome-ignore lint/suspicious/noExplicitAny: mdast tree, see file comment
	return (tree: any) => {
		const walk = (node: any) => {
			if (!node || !Array.isArray(node.children)) return;
			for (const child of node.children) walk(child);

			const children = node.children;
			for (let i = 0; i < children.length - 1; i++) {
				const demo = children[i];
				const code = children[i + 1];
				if (
					demo?.type === "mdxJsxFlowElement" &&
					demo.name === "DemoPreview" &&
					code?.type === "code"
				) {
					demo.children = [...(demo.children ?? []), code];
					children.splice(i + 1, 1);
				}
			}
		};

		walk(tree);
	};
}
