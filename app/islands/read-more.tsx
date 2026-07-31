import { css, cx } from "design-system/css";
import { useEffect, useRef, useState } from "hono/jsx";
import { Button } from "../components/ui/button";

interface ReadMoreProps {
	html: string;
	lineClamp?: number;
	class?: string;
	contentClass?: string;
}

export default function ReadMore(props: ReadMoreProps) {
	const { html, lineClamp = 3, class: classProp, contentClass } = props;
	const contentRef = useRef<HTMLDivElement | null>(null);
	const [expanded, setExpanded] = useState(false);
	const [overflowing, setOverflowing] = useState(false);

	useEffect(() => {
		const el = contentRef.current;
		if (!el) return;
		setOverflowing(el.scrollHeight - el.clientHeight > 1);
	}, [html]);

	return (
		<div class={classProp}>
			<div
				ref={(el) => {
					contentRef.current = el as HTMLDivElement | null;
				}}
				class={cx(
					contentClass,
					!expanded && css({ lineClamp, overflow: "hidden" }),
				)}
				dangerouslySetInnerHTML={{ __html: html }}
			/>
			{(overflowing || expanded) && (
				<Button
					type="button"
					variant="plain"
					size="xs"
					class={css({ px: "0", mt: "1" })}
					onClick={() => setExpanded((value) => !value)}
				>
					{expanded ? "Show less" : "Show more"}
				</Button>
			)}
		</div>
	);
}
