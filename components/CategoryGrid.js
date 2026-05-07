import styles from '../styles/Home.module.css';

const CATEGORIES = [
  { label: '飲食店',       emoji: '🍜' },
  { label: '美容院',       emoji: '💇' },
  { label: '医療・病院',   emoji: '🏥' },
  { label: '不動産',       emoji: '🏠' },
  { label: '士業',         emoji: '⚖️' },
  { label: '小売・ショップ', emoji: '🛒' },
  { label: 'ホテル・旅館', emoji: '🏨' },
  { label: '建設・工務店', emoji: '🔨' },
  { label: '教育・塾',     emoji: '📚' },
  { label: '福祉・介護',   emoji: '🤝' },
  { label: '観光・レジャー', emoji: '🎡' },
  { label: '製造業',       emoji: '🏭' },
];

export default function CategoryGrid({ onSelect }) {
  return (
    <div>
      <h2 className={styles.sectionTitle}>業種から探す</h2>
      <div className={styles.categoryGrid}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.label}
            className={styles.categoryCard}
            onClick={() => onSelect(cat.label)}
          >
            <span className={styles.categoryEmoji}>{cat.emoji}</span>
            <span className={styles.categoryLabel}>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
