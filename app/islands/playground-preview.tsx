import { useEffect, useState } from "hono/jsx";
import type { ComponentBlock } from "../components/block-types";
import { PageRenderer } from "../components/page-renderer";

export default function PlaygroundPreviewIsland() {
	const [content, setContent] = useState<ComponentBlock[]>([]);

	useEffect(() => {
		try {
			const saved = sessionStorage.getItem("playground_preview_json");
			if (saved) {
				const parsed = JSON.parse(saved);
				if (parsed && Array.isArray(parsed.content)) {
					setContent(parsed.content);
				}
			}
		} catch (e) {
			console.error("Error reading initial preview content:", e);
		}

		const handleMessage = (event: MessageEvent) => {
			if (event.data && event.data.type === "update-preview") {
				setContent(event.data.content || []);
				try {
					sessionStorage.setItem(
						"playground_preview_json",
						JSON.stringify({ content: event.data.content }),
					);
				} catch (e) {
					console.error("Error saving preview content:", e);
				}
			}
		};

		window.addEventListener("message", handleMessage);
		window.parent.postMessage({ type: "preview-ready" }, "*");

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, []);

	return (
		<div style={{ padding: "1rem" }}>
			<PageRenderer content={content} />
		</div>
	);
}
