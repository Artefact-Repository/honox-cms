import { useEffect, useState } from "hono/jsx";
import { stack } from "styled-system/patterns";
import { CloseButton } from "../components/ui/button";
import { Spinner } from "../components/ui/spinner";
import {
	ActionTrigger,
	CloseTrigger,
	Description,
	Indicator,
	Root,
	Title,
} from "../components/ui/toast-primitive";

interface ToastOptions {
	id: string;
	title?: string;
	description?: string;
	type?: "info" | "success" | "warning" | "error" | "loading";
	duration?: number;
	closable?: boolean;
	action?: {
		label: string;
		onClick: () => void;
	};
}

const dispatchToast = (options: Omit<ToastOptions, "id">) => {
	const id = Math.random().toString(36).substring(2, 9);
	window.dispatchEvent(
		new CustomEvent("park-ui:toast:create", {
			detail: { ...options, id },
		}),
	);
	return id;
};

const toaster = {
	create: (options: Omit<ToastOptions, "id">) => dispatchToast(options),
	success: (
		title: string,
		options?: Partial<Omit<ToastOptions, "id" | "title" | "type">>,
	) => dispatchToast({ ...options, title, type: "success" }),
	error: (
		title: string,
		options?: Partial<Omit<ToastOptions, "id" | "title" | "type">>,
	) => dispatchToast({ ...options, title, type: "error" }),
	warning: (
		title: string,
		options?: Partial<Omit<ToastOptions, "id" | "title" | "type">>,
	) => dispatchToast({ ...options, title, type: "warning" }),
	info: (
		title: string,
		options?: Partial<Omit<ToastOptions, "id" | "title" | "type">>,
	) => dispatchToast({ ...options, title, type: "info" }),
	dismiss: (id?: string) => {
		window.dispatchEvent(
			new CustomEvent("park-ui:toast:dismiss", { detail: { id } }),
		);
	},
};

const Icons = {
	success: () => (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<title>Success</title>
			<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
			<polyline points="22 4 12 14.01 9 11.01" />
		</svg>
	),
	error: () => (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<title>Error</title>
			<circle cx="12" cy="12" r="10" />
			<line x1="15" y1="9" x2="9" y2="15" />
			<line x1="9" y1="9" x2="15" y2="15" />
		</svg>
	),
	warning: () => (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<title>Warning</title>
			<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
			<line x1="12" y1="9" x2="12" y2="13" />
			<line x1="12" y1="17" x2="12.01" y2="17" />
		</svg>
	),
	info: () => (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<title>Info</title>
			<circle cx="12" cy="12" r="10" />
			<line x1="12" y1="16" x2="12" y2="12" />
			<line x1="12" y1="8" x2="12.01" y2="8" />
		</svg>
	),
};

function Toaster() {
	const [toasts, setToasts] = useState<ToastOptions[]>([]);

	useEffect(() => {
		const handleCreate = (e: any) => {
			const newToast = e.detail;
			setToasts((prev) => [...prev, newToast]);

			if (newToast.duration !== 0) {
				const duration = newToast.duration || 5000;
				setTimeout(() => {
					setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
				}, duration);
			}
		};

		const handleDismiss = (e: any) => {
			const { id } = e.detail;
			if (id) {
				setToasts((prev) => prev.filter((t) => t.id !== id));
			} else {
				setToasts([]);
			}
		};

		window.addEventListener("park-ui:toast:create", handleCreate);
		window.addEventListener("park-ui:toast:dismiss", handleDismiss);

		return () => {
			window.removeEventListener("park-ui:toast:create", handleCreate);
			window.removeEventListener("park-ui:toast:dismiss", handleDismiss);
		};
	}, []);

	return (
		<section
			role="region"
			aria-live="polite"
			style={{
				position: "fixed",
				bottom: "1rem",
				right: "1rem",
				display: "flex",
				flexDirection: "column",
				gap: "0.5rem",
				zIndex: 9999,
				pointerEvents: "none",
				maxWidth: "calc(100vw - 2rem)",
			}}
		>
			{toasts.map((toast) => {
				const Icon =
					toast.type && toast.type !== "loading"
						? Icons[toast.type as keyof typeof Icons]
						: null;
				return (
					<Root
						key={toast.id}
						type={toast.type}
						style={{ pointerEvents: "auto" }}
					>
						{toast.type === "loading" ? (
							<Indicator>
								<Spinner size="sm" />
							</Indicator>
						) : Icon ? (
							<Indicator>
								<Icon />
							</Indicator>
						) : null}
						<div class={stack({ gap: "3", alignItems: "start", flex: 1 })}>
							<div class={stack({ gap: "1" })}>
								{toast.title && <Title>{toast.title}</Title>}
								{toast.description && (
									<Description>{toast.description}</Description>
								)}
							</div>
							{toast.action && (
								<ActionTrigger
									onClick={() => {
										toast.action?.onClick();
										toaster.dismiss(toast.id);
									}}
								>
									{toast.action.label}
								</ActionTrigger>
							)}
						</div>
						{toast.closable && (
							<CloseTrigger onClick={() => toaster.dismiss(toast.id)} asChild>
								<CloseButton size="sm" />
							</CloseTrigger>
						)}
					</Root>
				);
			})}
		</section>
	);
}

export type { ToastOptions };
export { Toaster, toaster };
