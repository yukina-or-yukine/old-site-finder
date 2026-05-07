import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SearchBar from '../components/SearchBar';
import CategoryGrid from '../components/CategoryGrid';
import TagCloud from '../components/TagCloud';
import RegionFilter from '../components/RegionFilter';
import ResultCard from '../components/ResultCard';
import FavoritesPanel from '../components/FavoritesPanel';
import styles from '../styles/Home.module.css';

const FAV_KEY   = 'osf_favorites';
const MIN_SCORE = 20;

function loadFavs() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
}
function saveFavs(favs) {
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}

export default function Home() {
  const router = useRouter();

  const [query,        setQuery]        = useState('');
  const [region,       setRegion]       = useState('');
  const [results,      setResults]      = useState([]);
  const [analyses,     setAnalyses]     = useState({});
  const [loading,      setLoading]      = useState(false);
  const [analyzing,    setAnalyzing]    = useState(false);
  const [error,        setError]        = useState('');
  const [favorites,    setFavorites]    = useState([]);
  const [showFavs,     setShowFavs]     = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => { setFavorites(loadFavs()); }, []);

  // トップへ戻るボタンの表示制御
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 実際の検索APIコール（q と r を引数で受け取る）
  const doSearch = useCallback(async (q, r) => {
    setResults([]);
    setAnalyses({});
    setError('');
    setLoading(true);
    try {
      const params = new URLSearchParams({ q });
      if (r) params.set('region', r);
      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { msg = (await res.json()).error || msg; } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      setResults(data.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // URL変化（ブラウザバック含む）を監視して検索を実行
  useEffect(() => {
    if (!router.isReady) return;
    const { q, region: r } = router.query;
    if (q) {
      const qStr = String(q);
      const rStr = r ? String(r) : '';
      setQuery(qStr);
      setRegion(rStr);
      doSearch(qStr, rStr);
    } else {
      setResults([]);
      setQuery('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query]);

  // 検索トリガー：URLを更新する（履歴に積む）→ 上の useEffect が検索を実行
  const search = useCallback((q) => {
    const params = new URLSearchParams({ q });
    if (region) params.set('region', region);
    router.push(`/?${params.toString()}`, undefined, { shallow: true });
  }, [region, router]);

  // 検索結果が出たら1件ずつ古さ分析
  useEffect(() => {
    if (results.length === 0) return;
    let cancelled = false;
    setAnalyzing(true);

    (async () => {
      for (const item of results) {
        if (cancelled) break;
        const cacheKey = `osf_analyze_${item.url}`;
        const cached = (() => {
          try { return JSON.parse(localStorage.getItem(cacheKey)); } catch { return null; }
        })();
        if (cached) {
          setAnalyses(prev => ({ ...prev, [item.url]: cached }));
        } else {
          try {
            const r = await fetch(`/api/analyze?url=${encodeURIComponent(item.url)}`);
            if (r.ok) {
              const data = await r.json();
              localStorage.setItem(cacheKey, JSON.stringify(data));
              if (!cancelled) setAnalyses(prev => ({ ...prev, [item.url]: data }));
            }
          } catch {}
        }
        await new Promise(r => setTimeout(r, 800));
      }
      if (!cancelled) setAnalyzing(false);
    })();

    return () => { cancelled = true; };
  }, [results]);

  // スコア 20 超 or 未分析のみ表示
  const visibleResults = results.filter(item => {
    const a = analyses[item.url];
    return !a || a.score > MIN_SCORE;
  });
  const allAnalyzed = results.length > 0 && results.every(item => analyses[item.url]);
  const noOldSites  = allAnalyzed && visibleResults.length === 0;

  const exportAllCSV = () => {
    const header = 'タイトル,URL,古さスコア,バッジ,最終確認年,著作権年,SSL,モバイル対応,Flash';
    const rows = visibleResults.map(item => {
      const a = analyses[item.url];
      return [
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.url}"`,
        a?.score ?? '',
        a?.badge?.label ?? '',
        a?.lastWaybackYear ?? '',
        a?.copyrightYear ?? '',
        a?.hasSSL ? 'あり' : 'なし',
        a?.hasMobileViewport ? 'あり' : 'なし',
        a?.hasFlash ? 'あり' : 'なし',
      ].join(',');
    });
    const blob = new Blob(['﻿' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `old-site-finder_${query}.csv`;
    a.click();
  };

  const toggleFav = (item) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.url === item.url);
      const next = exists
        ? prev.filter(f => f.url !== item.url)
        : [...prev, { title: item.title, url: item.url }];
      saveFavs(next);
      return next;
    });
  };

  const removeFav = (url) => {
    setFavorites(prev => {
      const next = prev.filter(f => f.url !== url);
      saveFavs(next);
      return next;
    });
  };

  const handleBack = () => {
    router.push('/', undefined, { shallow: true });
  };

  return (
    <>
      <Head>
        <title>Old Site Finder</title>
        <meta name="description" content="古くなったWebサイトを発見・評価するツール" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            <Link href="/" className={styles.titleLink}>🦕 Old Site Finder</Link>
          </h1>
          <p className={styles.subtitle}>更新が止まった古いWebサイトを見つけ、古さをスコアで評価します</p>
          <button className={styles.favToggle} onClick={() => setShowFavs(v => !v)}>
            ★ お気に入り ({favorites.length})
          </button>
        </header>

        {showFavs && (
          <FavoritesPanel
            favorites={favorites}
            onRemove={removeFav}
            onClose={() => setShowFavs(false)}
          />
        )}

        <main className={styles.main}>
          <div className={styles.searchSection}>
            <SearchBar onSearch={search} loading={loading} />
            <RegionFilter value={region || '全国'} onChange={setRegion} />
          </div>

          {error && <p className={styles.error}>⚠️ {error}</p>}

          {!results.length && !loading && !error && (
            <>
              <CategoryGrid onSelect={search} />
              <TagCloud onSelect={search} />
            </>
          )}

          {results.length > 0 && (
            <div className={styles.results}>
              <div className={styles.resultsHeader}>
                <h2 className={styles.sectionTitle}>
                  古いサイト {analyzing ? '...' : `${visibleResults.length}件`}
                  <span className={styles.filterNote}>（スコア20以下は非表示）</span>
                </h2>
                <div className={styles.resultsActions}>
                  {analyzing && <span className={styles.analyzingBadge}>⏳ 分析中...</span>}
                  {!analyzing && visibleResults.length > 0 && (
                    <button className={styles.csvBtn} onClick={exportAllCSV}>CSV出力</button>
                  )}
                  <button className={styles.backBtn} onClick={handleBack}>← 戻る</button>
                </div>
              </div>

              {noOldSites ? (
                <p className={styles.noOldSites}>
                  🔍 古いサイトが見つかりませんでした。<br />
                  <span>検索キーワードや地域を変えてお試しください。</span>
                </p>
              ) : (
                visibleResults.map(item => (
                  <ResultCard
                    key={item.url}
                    item={item}
                    analysis={analyses[item.url] || null}
                    isFav={favorites.some(f => f.url === item.url)}
                    onToggleFav={toggleFav}
                  />
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {showBackToTop && (
        <button
          className={styles.backToTop}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="トップへ戻る"
        >
          ↑
        </button>
      )}
    </>
  );
}
