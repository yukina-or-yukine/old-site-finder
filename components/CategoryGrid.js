import {
  Utensils, Scissors, Stethoscope, Home, Scale, ShoppingBag,
  Building2, Hammer, BookOpen, Heart, Compass, Factory,
} from 'lucide-react';
import styles from '../styles/Home.module.css';

const CATEGORIES = [
  { label: '飲食店',         Icon: Utensils,    bg: '#FFF3E0', color: '#E65100' },
  { label: '美容院',         Icon: Scissors,    bg: '#FCE4EC', color: '#C2185B' },
  { label: '医療・病院',     Icon: Stethoscope, bg: '#E3F2FD', color: '#1565C0' },
  { label: '不動産',         Icon: Home,        bg: '#E8F5E9', color: '#2E7D32' },
  { label: '士業',           Icon: Scale,       bg: '#E8EAF6', color: '#1A237E' },
  { label: '小売・ショップ', Icon: ShoppingBag, bg: '#F3E5F5', color: '#6A1B9A' },
  { label: 'ホテル・旅館',   Icon: Building2,   bg: '#E0F2F1', color: '#00695C' },
  { label: '建設・工務店',   Icon: Hammer,      bg: '#FFFDE7', color: '#F57F17' },
  { label: '教育・塾',       Icon: BookOpen,    bg: '#F1F8E9', color: '#33691E' },
  { label: '福祉・介護',     Icon: Heart,       bg: '#FFEBEE', color: '#B71C1C' },
  { label: '観光・レジャー', Icon: Compass,     bg: '#E0F7FA', color: '#006064' },
  { label: '製造業',         Icon: Factory,     bg: '#ECEFF1', color: '#37474F' },
];

export default function CategoryGrid({ onSelect }) {
  return (
    <div>
      <h2 className={styles.sectionTitle}>業種から探す</h2>
      <div className={styles.categoryGrid}>
        {CATEGORIES.map(({ label, Icon, bg, color }) => (
          <button
            key={label}
            className={styles.categoryCard}
            style={{ '--cat-bg': bg, '--cat-color': color }}
            onClick={() => onSelect(label)}
          >
            <Icon size={26} className={styles.categoryIcon} strokeWidth={1.5} />
            <span className={styles.categoryLabel}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
