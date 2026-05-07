import styles from '../styles/Home.module.css';

export default function FavoritesPanel({ favorites, onRemove, onClose }) {
  const exportCSV = () => {
    const header = 'タイトル,URL';
    const rows = favorites.map(f => `"${f.title.replace(/"/g, '""')}","${f.url}"`);
    const blob = new Blob(['﻿' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'favorites.csv';
    link.click();
  };

  return (
    <div className={styles.favPanel}>
      <div className={styles.favPanelHeader}>
        <h3>お気に入り ({favorites.length})</h3>
        <div>
          {favorites.length > 0 && (
            <button className={styles.csvBtn} onClick={exportCSV}>CSV出力</button>
          )}
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
      </div>
      {favorites.length === 0 ? (
        <p className={styles.favEmpty}>まだお気に入りはありません。</p>
      ) : (
        <ul className={styles.favList}>
          {favorites.map(f => (
            <li key={f.url} className={styles.favItem}>
              <a href={f.url} target="_blank" rel="noopener noreferrer">{f.title}</a>
              <button className={styles.favRemove} onClick={() => onRemove(f.url)}>削除</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
