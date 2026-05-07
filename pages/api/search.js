export default async function handler(req, res) {
  const { q, region, page } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });

  const apiKey = process.env.SERPER_API_KEY?.trim();
  if (!apiKey) return res.status(500).json({
    error: 'Vercel の環境変数 SERPER_API_KEY が設定されていません',
  });

  const baseQuery = region ? `${q} ${region}` : q;

  // 2020年以前の古いサイトを優先的に取得 + 行政・政府・PDF除外
  const cpYears = [2019, 2018, 2017, 2016]
    .map(y => `"copyright ${y}"`)
    .join(' OR ');
  const exclude = '-site:go.jp -site:lg.jp -site:ac.jp -site:or.jp -filetype:pdf';
  const query = `${baseQuery} (before:2020 OR ${cpYears}) ${exclude}`;

  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, gl: 'jp', hl: 'ja', num: 10, page: page ? Number(page) : 1 }),
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      const message = err?.message || `HTTP ${r.status}`;
      console.error('[search] Serper API error:', message);
      return res.status(r.status).json({ error: message });
    }

    const data = await r.json();

    const items = (data.organic || []).map(item => ({
      url:        item.link,
      title:      item.title,
      snippet:    item.snippet || '',
      favicon:    `https://www.google.com/s2/favicons?sz=32&domain=${new URL(item.link).hostname}`,
      displayUrl: item.displayLink || new URL(item.link).hostname,
    }));

    const totalStr = String(data.searchInformation?.totalResults || '0').replace(/[^0-9]/g, '');
    const totalNum = parseInt(totalStr, 10) || 0;
    const totalPages = Math.min(Math.max(1, Math.ceil(totalNum / 10)), 10);

    res.json({ items, totalPages });
  } catch (e) {
    console.error('[search] fetch error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
