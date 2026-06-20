import adapter from "@hono/vite-dev-server/node";
import ssg from "@hono/vite-ssg";
import tailwindcss from "@tailwindcss/vite";
import honox from "honox/vite";
import { defineConfig } from "vite";

const config = defineConfig(({ mode }) =>
	mode === "client" ? clientConfig : mainConfig,
);

const mainConfig = {
	build: {
		emptyOutDir: false,
	},
	plugins: [
		honox({
			devServer: { adapter },
		}),
		tailwindcss(),
		ssg({ entry: "app/server.ts" }),
	],
};

const clientConfig = {
	plugins: [
		honox({
			client: { input: ["/app/client.ts", "/app/style.css"] },
		}),
		tailwindcss(),
	],
};

export default config;
