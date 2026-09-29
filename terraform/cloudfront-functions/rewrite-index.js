// `nuxi generate` produces one static HTML file per route, each named
// index.html inside a directory matching the route (login/index.html,
// dashboard/index.html, etc.) - the same layout Nuxt's own dev/preview
// server resolves transparently. CloudFront's default_root_object only
// does that rewrite for the bucket root ("/"), not for sub-paths, so a
// request for "/login" would otherwise look for an S3 object literally
// named "login" (doesn't exist), 403, and fall through to the SPA-fallback
// error response instead of ever reaching the real page.
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.endsWith("/")) {
    request.uri += "index.html";
  } else if (!uri.slice(uri.lastIndexOf("/") + 1).includes(".")) {
    request.uri += "/index.html";
  }

  return request;
}
