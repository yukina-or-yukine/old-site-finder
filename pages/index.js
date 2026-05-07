import { useState, useEffect, useCallback, useRef } from 'react';
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
const MIN_SCORE = 29;

function loadFavs() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
}
function saveFavs(favs) {
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}

function getPageRange(current, total) {
  if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1);
  // Show 1-8 + ellipsis + last, with current ±2 always visible
  const pages = new Set([1, total]);
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.add(i);
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
    result.push(sorted[i]);
  }
  return result;
}

export default function Home() {
  const router = useRouter();

  const [query,           setQuery]           = useState('');
  const [region,          setRegion]          = useState('');
  const [results,         setResults]         = useState([]);
  const [analyses,        setAnalyses]        = useState({});
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [favorites,       setFavorites]       = useState([]);
  const [showFavs,        setShowFavs]        = useState(false);
  const [showBackToTop,   setShowBackToTop]   = useState(false);
  const [currentPage,     setCurrentPage]     = useState(1);
  const [totalPages,      setTotalPages]      = useState(1);

  // Queue-based analysis
  const [analysisQueue,      setAnalysisQueue]      = useState([]);
  const [currentlyAnalyzing, setCurrentlyAnalyzing] = useState(null);
  const processingRef = useRef(false);

  useEffect(() => { setFavorites(loadFavs()); }, []);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const doSearch = useCallback(async (q, r, page = 1) => {
    setResults([]);
    setAnalyses({});
    setAnalysisQueue([]);
    setCurrentlyAnalyzing(null);
    processingRef.current = false;
    setError('');
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, page: String(page) });
      if (r) params.set('region', r);
      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { msg = (await res.json()).error || msg; } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      const items = data.items || [];
      setResults(items);
      setTotalPages(data.totalPages || 1);
      setAnalysisQueue(items.slice(0, 5).map(i => i.url));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const { q, region: r, page: p } = router.query;
    if (q) {
      const qStr    = String(q);
      const rStr    = r ? String(r) : '';
      const pageNum = p ? Number(p) : 1;
      setQuery(qStr);
      setRegion(rStr);
      setCurrentPage(pageNum);
      doSearch(qStr, rStr, pageNum);
    } else {
      setResults([]);
      setQuery('');
      setCurrentPage(1);
      setTotalPages(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query]);

  const pushUrl = useCallback((q, r, page) => {
    const params = new URLSearchParams({ q });
    if (r) params.set('region', r);
    if (page && page > 1) params.set('page', String(page));
    router.push(`/?${params.toString()}`, undefined, { shallow: true });
  }, [router]);

  const search = useCallback((q) => {
    pushUrl(q, region, 1);
  }, [region, pushUrl]);

  const handleRegionChange = useCallback((newRegion) => {
    setRegion(newRegion);
    if (query) pushUrl(query, newRegion, 1);
  }, [query, pushUrl]);

  const goToPage = useCallback((page) => {
    pushUrl(query, region, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [query, region, pushUrl]);

  // Queue processor
  useEffect(() => {
    if (processingRef.current || analysisQueue.length === 0) return;
    const url = analysisQueue[0];
    if (analyses[url]) {
      setAnalysisQueue(prev => prev.slice(1));
      return;
    }

    processingRef.current = true;
    setCurrentlyAnalyzing(url);

    const cacheKey = `osf_analyze_${url}`;
    const cached = (() => { try { return JSON.parse(localStorage.getItem(cacheKey)); } catch { return null; } })();

    if (cached) {
      setAnalyses(prev => ({ ...prev, [url]: cached }));
      setAnalysisQueue(prev => prev.slice(1));
      setCurrentlyAnalyzing(null);
      processingRef.current = false;
    } else {
      fetch(`/api/analyze?url=${encodeURIComponent(url)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            localStorage.setItem(cacheKey, JSON.stringify(data));
            setAnalyses(prev => ({ ...prev, [url]: data }));
          }
        })
        .catch(() => {})
        .finally(() => {
          setTimeout(() => {
            setAnalysisQueue(prev => prev.slice(1));
            setCurrentlyAnalyzing(null);
            processingRef.current = false;
          }, 800);
        });
    }
  }, [analysisQueue, analyses]);

  const handleCardVisible = useCallback((url) => {
    setAnalysisQueue(prev => prev.includes(url) ? prev : [...prev, url]);
  }, []);

  const getItemStatus = (url) => {
    if (analyses[url])              return 'done';
    if (currentlyAnalyzing === url) return 'analyzing';
    if (analysisQueue.includes(url)) return 'queued';
    return 'idle';
  };

  const analyzedCount  = Object.keys(analyses).length;
  const analyzing      = currentlyAnalyzing !== null || analysisQueue.length > 0;
  const remainingCount = results.length - analyzedCount;
  const hasNextPage    = currentPage < totalPages;

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Skranji&display=swap" rel="stylesheet" />
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
            {!results.length && <RegionFilter value={region || '全国'} onChange={handleRegionChange} />}
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
              <div className={styles.filterSection}>
                <span className={styles.filterSectionLabel}>🗾 地域を絞り込む</span>
                <RegionFilter value={region || '全国'} onChange={handleRegionChange} showLabel={false} />
              </div>

              <div className={styles.resultsHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    「{query}」の検索結果
                    {!analyzing && <span className={styles.resultCount}> {visibleResults.length}件</span>}
                  </h2>
                  <p className={styles.filterNote}>スコア29以下は非表示</p>
                </div>
                <div className={styles.resultsActions}>
                  {analyzing && (
                    <span className={styles.analyzingBadge}>⏳ 分析中... (残り約{remainingCount}件)</span>
                  )}
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
                results.map(item => (
                  <ResultCard
                    key={item.url}
                    item={item}
                    analysis={analyses[item.url] || null}
                    isFav={favorites.some(f => f.url === item.url)}
                    onToggleFav={toggleFav}
                    status={getItemStatus(item.url)}
                    onVisible={handleCardVisible}
                  />
                ))
              )}

              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  «
                </button>
                {getPageRange(currentPage, totalPages).map((p, i) =>
                  p === '...'
                    ? <span key={`e${i}`} className={styles.pageEllipsis}>...</span>
                    : <button
                        key={p}
                        className={`${styles.pageBtn} ${p === currentPage ? styles.pageActive : ''}`}
                        onClick={() => goToPage(p)}
                      >
                        {p}
                      </button>
                )}
                <button
                  className={styles.pageBtn}
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!hasNextPage}
                >
                  »
                </button>
              </div>
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
