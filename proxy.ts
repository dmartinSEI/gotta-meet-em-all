import { NextResponse } from "next/server";

// The site has been retired. Every route returns this page; no app code or data is reachable.
const CLOSED_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Site closed</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
         font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #1a0e36; color: #fff; padding: 0 16px; }
  main { max-width: 420px; text-align: center; }
  h1 { font-size: 24px; margin: 0 0 12px; }
  p { color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6; margin: 0; }
</style>
</head>
<body>
<main>
  <h1>This site has closed</h1>
  <p>The beta has ended and all data has been deleted. Thanks to everyone who took part.</p>
</main>
</body>
</html>`;

export function proxy() {
  return new NextResponse(CLOSED_HTML, {
    status: 410,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

export const config = {
  matcher: "/:path*",
};
