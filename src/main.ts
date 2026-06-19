import { parseArgs } from "node:util";
import { createServer } from "vite";

const { values } = parseArgs({
	args: Bun.argv.slice(2),
	options: {
		port: {
			type: "string",
			short: "p",
			default: "3000",
		},
	},
	strict: true,
});

const port = Number.parseInt(values.port ?? "3000", 10);

const vite = await createServer({
	server: { middlewareMode: true, hmr: false },
	appType: "custom",
});

const { default: app } = await vite.ssrLoadModule("./app/server.ts");

const server = Bun.serve({
	fetch: async (request) => {
		const url = new URL(request.url);

		return new Promise<Response>((resolve) => {
			const req = {
				url: url.pathname + url.search,
				method: request.method,
				headers: Object.fromEntries(request.headers),
			};
			const res = {
				statusCode: 200,
				headers: {} as Record<string, string>,
				getHeader(name: string) {
					return this.headers[name.toLowerCase()];
				},
				setHeader(name: string, value: string) {
					this.headers[name.toLowerCase()] = value;
				},
				writeHead(status: number, headers: any) {
					this.statusCode = status;
					if (headers) {
						for (const [k, v] of Object.entries(headers)) {
							this.setHeader(k, v as string);
						}
					}
				},
				end(content: any) {
					resolve(
						new Response(content, {
							status: this.statusCode,
							headers: this.headers,
						}),
					);
				},
			};
			vite.middlewares(req as any, res as any, () => {
				resolve(app.fetch(request));
			});
		});
	},
	port,
});

console.log(`Server running at ${server.url}`);
