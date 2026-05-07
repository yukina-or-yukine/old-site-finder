import styles from '../styles/Home.module.css';

const TAGS = [
  'ホームページ制作会社',
  '税理士事務所',
  '歯科医院',
  '不動産会社',
  '美容院',
  '整体院',
  '工務店',
  '保育園',
  '料理教室',
  '司法書士',
  '学習塾',
  '接骨院',
];

export default function TagCloud({ onSelect }) {
  return (
    <div>
      <h2 className={styles.sectionTitle}>よく使われる検索</h2>
      <div className={styles.tagCloud}>
        {TAGS.map(tag => (
          <button key={tag} className={styles.tag} onClick={() => onSelect(tag)}>
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
