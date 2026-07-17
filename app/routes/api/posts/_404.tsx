import type { NotFoundHandler } from "hono";

// Overrides the site-wide HTML _404 page for everything under /api/posts/*
// — honox replaces any 404-status response with the nearest _404 handler,
// and an API namespace should hand back JSON, not an HTML page.
const handler: NotFoundHandler = (c) => {
	return c.json({ error: "Not found" }, 404);
};

export default handler;
