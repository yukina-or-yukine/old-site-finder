export default async function handler(req, res) {
  const { q, region, start = 1 } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });

  const apiKey = process.env.GOOGLE_API_KEY;
  const cseId  = process.env.GOOGLE_CSE_ID;
  if (!apiKey || !cseId) return res.status(500).json({ error: 'API keys not configured' });

  const query = region ? `${q} ${region}` : q;
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('cx', cseId);
  url.searchParams.set('q', query);
  url.searchParams.set('start', String(start));
  url.searchParams.set('num', '10');

  try {
    const r = await fetch(url.toString());
    if (!r.ok) {
      const err = await r.json();
      return res.status(r.status).json({ error: err?.error?.message || 'Google API error' });
    }
    const data = await r.json();

    const items = (data.items || []).map(item => ({
      url:        item.link,
      title:      item.title,
      snippet:    item.snippet,
      favicon:    `https://www.google.com/s2/favicons?sz=32&domain=${new URL(item.link).hostname}`,
      displayUrl: item.displayLink,
    }));

    res.json({ items, totalResults: data.searchInformation?.totalResults || '0' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
