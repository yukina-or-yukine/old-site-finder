import { useState } from 'react';
import styles from '../styles/Home.module.css';

export default function ResultCard({ item, analysis, isFav, onToggleFav }) {
  const [imgError, setImgError] = useState(false);
  const badge = analysis?.badge;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardSite}>
          {!imgError ? (
            <img
              src={item.favicon}
              alt=""
              width={20}
              height={20}
              onError={() => setImgError(true)}
              className={styles.favicon}
            />
          ) : (
            <span className={styles.faviconFallback}>🌐</span>
          )}
          <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.cardTitle}>
            {item.title}
          </a>
        </div>
        <button
          className={`${styles.favBtn} ${isFav ? styles.favActive : ''}`}
          onClick={() => onToggleFav(item)}
          title={isFav ? 'お気に入りから削除' : 'お気に入りに追加'}
        >
          {isFav ? '★' : '☆'}
        </button>
      </div>

      <p className={styles.cardUrl}>{item.displayUrl}</p>
      <p className={styles.cardSnippet}>{item.snippet}</p>

      <div className={styles.cardMeta}>
        {analysis ? (
          <>
            <span
              className={styles.badge}
              style={{ background: badge?.color }}
              title={`古さスコア: ${analysis.score}/100`}
            >
              {badge?.emoji} {badge?.label}
            </span>
            <span className={styles.metaItem}>
              スコア: <strong>{analysis.score}</strong>/100
            </span>
            {analysis.lastWaybackYear && (
              <span className={styles.metaItem}>
                最終確認: {analysis.lastWaybackYear}年
              </span>
            )}
            {analysis.copyrightYear && (
              <span className={styles.metaItem}>
                © {analysis.copyrightYear}
              </span>
            )}
            {analysis.hasFlash && (
              <span className={`${styles.metaItem} ${styles.warn}`} title="Flash使用を検出">⚡ Flash</span>
            )}
            {!analysis.hasMobileViewport && (
              <span className={`${styles.metaItem} ${styles.warn}`} title="モバイル非対応の可能性">📵 非モバイル</span>
            )}
            {!analysis.hasSSL && (
              <span className={`${styles.metaItem} ${styles.warn}`} title="SSL未対応">🔓 非SSL</span>
            )}
            {analysis.lastWaybackUrl && (
              <a
                href={`https://web.archive.org/web/*/${item.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.waybackLink}
              >
                📦 Wayback
              </a>
            )}
          </>
        ) : (
          <span className={styles.analyzing}>分析中...</span>
        )}
      </div>
    </div>
  );
}
