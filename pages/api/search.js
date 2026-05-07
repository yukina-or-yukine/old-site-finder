export default async function handler(req, res) {
  const { q, region, start = 1 } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });

  // .trim() で Vercel 環境変数の余分なスペースを除去
  const apiKey = process.env.GOOGLE_API_KEY?.trim();
  const cseId  = process.env.GOOGLE_CSE_ID?.trim();
  if (!apiKey || !cseId) return res.status(500).json({
    error: 'Vercel の環境変数 GOOGLE_API_KEY と GOOGLE_CSE_ID が設定されていません',
  });

  const query = region ? `${q} ${region}` : q;

  // 専用エンドポイントを使用
  const url = new URL('https://customsearch.googleapis.com/customsearch/v1');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('cx', cseId);
  url.searchParams.set('q', query);
  url.searchParams.set('start', String(start));
  url.searchParams.set('num', '10');

  try {
    const r = await fetch(url.toString());
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      // Google のエラー詳細をそのまま返してデバッグしやすくする
      const message = err?.error?.message || `HTTP ${r.status}`;
      console.error('[search] Google API error:', JSON.stringify(err?.error));
      return res.status(r.status).json({ error: message, googleError: err?.error });
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
    console.error('[search] fetch error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
