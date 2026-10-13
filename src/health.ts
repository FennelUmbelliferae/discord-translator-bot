export function healthResponse(request: Request): Response {
  const url = new URL(request.url);
  const healthy = url.pathname === "/health" && !url.search;
  return new Response(healthy ? "OK" : "Not Found", {
    status: healthy ? 200 : 404,
    headers: { "Content-Type": "text/plain" },
  });
}
