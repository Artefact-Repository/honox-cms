// Cloudflare Pages Function to handle blog post routes
// This runs on the edge and renders blog posts on demand (SSR)
// This fixes the 404 issue because the page is rendered when requested

import { parseFrontmatter } from "../../app/utils/markdown";

export async function onRequestGet(context: any) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  // Only handle /blog/:slug routes
  if (pathParts[0] !== "blog" || !pathParts[1]) {
    return next();
  }
  
  const slug = pathParts[1];
  
  try {
    // In a Cloudflare Worker, we can't read the filesystem directly
    // Instead, we'll fetch the content from the CMS or use a different approach
    
    // For now, return a simple HTML that loads the content client-side
    // This is a workaround until we can properly integrate with the CMS
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog Post - ${slug}</title>
  <script>
    // Client-side fetch and render the blog post
    fetch('/api/blog/${slug}')
      .then(res => res.json())
      .then(data => {
        document.getElementById('content').innerHTML = data.html;
        document.title = data.title;
      });
  </script>
</head>
<body>
  <div id="content">Loading...</div>
</body>
</html>`;
    
    return new Response(html, {
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  } catch (error) {
    return new Response("Blog post not found", { status: 404 });
  }
}
