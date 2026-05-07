import styles from '../styles/Home.module.css';

const TAGS = [
  // 既存（ホームページ制作会社を削除）
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
  // 古いサイトが残りやすい業種を追加
  '旅館',
  '葬儀社',
  '畳屋',
  '印刷会社',
  '電気工事店',
  '左官業者',
  '造園業',
  'クリーニング店',
  '時計修理',
  '眼鏡店',
  '仏壇店',
  '和菓子屋',
  '写真館',
  '自動車整備工場',
  '洋服のお直し',
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
