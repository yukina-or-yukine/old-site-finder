export default async function handler(req, res) {
  const { q, region } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });

  const apiKey = process.env.SERPER_API_KEY?.trim();
  if (!apiKey) return res.status(500).json({
    error: 'Vercel の環境変数 SERPER_API_KEY が設定されていません',
  });

  const query = region ? `${q} ${region}` : q;

  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, gl: 'jp', hl: 'ja', num: 10 }),
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

    res.json({
      items,
      totalResults: data.searchInformation?.totalResults || String(items.length),
    });
  } catch (e) {
    console.error('[search] fetch error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
