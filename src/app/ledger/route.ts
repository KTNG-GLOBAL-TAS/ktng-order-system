import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermissionAsync } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * The page of the price & discount ledger.
 *
 * It is one self-contained document (its own styles and script in public/ledger-assets, four languages inside the script), so it is
 * served as plain HTML rather than through the React layout: the ordering system's Tailwind styles and the ledger's never meet.
 * Access: the middleware (live permissions) and the check below; the data comes from /api/ledger.
 */

function assetVersion(): string {
  try {
    const dir = path.join(process.cwd(), 'public', 'ledger-assets');
    return String(Math.max(...['app.js', 'ledger.css'].map(f => Math.floor(fs.statSync(path.join(dir, f)).mtimeMs))));
  } catch {
    return String(Date.now());
  }
}

const VERSION = assetVersion();

const PAGE = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Price &amp; Discount Ledger</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📦</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/ledger-assets/ledger.css?v=${VERSION}">
</head>
<body>
<header class="top">
  <div class="wrap">
    <div class="brand">
      <a class="back" id="h-back" href="/">←</a>
      <h1 id="h-title">Price &amp; Discount Ledger</h1>
      <span class="meta" id="h-meta"></span>
      <span class="who" id="h-user"></span>
      <label class="lang"><span class="sr" id="lang-lbl">Language</span><select id="lang" aria-labelledby="lang-lbl">
        <option value="ko">한국어</option><option value="en">English</option><option value="ru">Русский</option><option value="uz">Oʻzbekcha</option></select></label>
    </div>
    <nav class="tabs" role="tablist" id="tabs"></nav>
  </div>
</header>
<main class="wrap">
  <div id="banners"></div>
  <div id="controls"></div>
  <div id="content"></div>
</main>
<div id="ov" hidden></div>
<div id="toast" hidden></div>
<script src="/ledger-assets/app.js?v=${VERSION}"></script>
</body>
</html>`;

export async function GET(req: NextRequest) {
  try {
    await requirePermissionAsync(req, ['ledger:view', 'ledger:edit']);
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return new NextResponse(PAGE, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
