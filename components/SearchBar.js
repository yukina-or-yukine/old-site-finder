import { useState } from 'react';
import styles from '../styles/Home.module.css';

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <form onSubmit={submit} className={styles.searchForm}>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="例：税理士事務所、美容院、工務店..."
        className={styles.searchInput}
        disabled={loading}
      />
      <button type="submit" className={styles.searchBtn} disabled={loading || !query.trim()}>
        {loading ? '検索中...' : '検索'}
      </button>
    </form>
  );
}
