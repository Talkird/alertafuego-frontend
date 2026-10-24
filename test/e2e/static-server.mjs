// Serves the `nuxt generate` output the way production's CloudFront does
// (terraform/cloudfront.tf): extensionless paths get their index.html, and
// anything missing falls back to /index.html with a 200, so Vue Router takes
// over (the pages behind sign-in are client-rendered).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = join(import.meta.dirname, "../../.output/public");
const PORT = Number(process.env.PORT ?? 3100);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".woff2": "font/woff2",
};

async function resolve(pathname) {
  let file = normalize(join(ROOT, decodeURIComponent(pathname)));
  if (!file.startsWith(ROOT)) return null;
  if (!extname(file)) file = join(file, "index.html");
  try {
    return (await stat(file)).isFile() ? file : null;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  const file = (await resolve(pathname)) ?? join(ROOT, "index.html");
  res.writeHead(200, {
    "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
  });
  res.end(await readFile(file));
}).listen(PORT, () =>
  console.log(`Serving ${ROOT} on http://localhost:${PORT}`),
);
