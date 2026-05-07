import { calculateScore, getBadge } from '../../lib/scoring';

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(6000), ...options });
      if (r.ok) return r;
    } catch {}
    if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
  }
  return null;
}

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url is required' });

  let hasSSL           = false;
  let lastWaybackYear  = null;
  let lastWaybackUrl   = null;
  let copyrightYear    = null;
  let hasFlash         = false;
  let hasMobileViewport = false;

  // SSL check
  try { hasSSL = new URL(url).protocol === 'https:'; } catch {}

  // Wayback Machine availability — 5s timeout, no retry to avoid blocking
  const wb = await fetchWithRetry(
    `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
    { signal: AbortSignal.timeout(5000) },
    1
  );
  if (wb) {
    const wbData = await wb.json();
    const closest = wbData?.archived_snapshots?.closest;
    if (closest?.timestamp) {
      lastWaybackYear = parseInt(closest.timestamp.slice(0, 4), 10);
      lastWaybackUrl  = closest.url;
    }
  }

  // Fetch page HTML for deeper signals
  const page = await fetchWithRetry(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OldSiteFinder/1.0; +personal-use)' },
  });
  if (page) {
    const html = await page.text();

    hasFlash = /\.swf["'\s]|<object[^>]+classid|<embed[^>]+\.swf/i.test(html);

    hasMobileViewport = /name=["']viewport["'][^>]*content=["'][^"']*width\s*=\s*device-width/i.test(html)
                     || /content=["'][^"']*width\s*=\s*device-width/i.test(html);

    const cpMatch = html.match(/(?:copyright|©|&copy;|&#169;)\s*(?:20|19)(\d{2})/i)
                 || html.match(/(?:20|19)(\d{2})\s*(?:copyright|©|&copy;|&#169;)/i);
    if (cpMatch) {
      const raw = html.match(/(?:copyright|©|&copy;|&#169;)[^\d]*((20|19)\d{2})/i)
               || html.match(/((20|19)\d{2})[^\d]*(?:copyright|©|&copy;|&#169;)/i);
      if (raw) copyrightYear = parseInt(raw[1], 10);
    }
  }

  const score = calculateScore({ hasSSL, lastWaybackYear, copyrightYear, hasFlash, hasMobileViewport });
  const badge = getBadge(score);

  res.json({
    url,
    hasSSL,
    lastWaybackYear,
    lastWaybackUrl,
    copyrightYear,
    hasFlash,
    hasMobileViewport,
    score,
    badge,
  });
}
