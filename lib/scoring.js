const CURRENT_YEAR = new Date().getFullYear();

function agePoints(year, maxPoints) {
  if (!year) return 0;
  const age = CURRENT_YEAR - year;
  if (age >= 15) return maxPoints;
  if (age >= 10) return Math.round(maxPoints * 0.75);
  if (age >= 5)  return Math.round(maxPoints * 0.45);
  if (age >= 2)  return Math.round(maxPoints * 0.15);
  return 0;
}

export function calculateScore({ hasSSL, lastWaybackYear, copyrightYear, hasFlash, hasMobileViewport }) {
  let score = 0;

  if (!hasSSL) score += 10;
  if (hasFlash) score += 20;
  if (!hasMobileViewport) score += 15;

  // Wayback year is primary; copyright year adds up to 20 extra
  score += agePoints(lastWaybackYear, 35);
  if (copyrightYear && copyrightYear !== lastWaybackYear) {
    score += agePoints(copyrightYear, 20);
  }

  return Math.min(score, 100);
}

export function getBadge(score) {
  if (score >= 80) return { label: '化石級',   emoji: '🦕', color: '#8B4513' };
  if (score >= 60) return { label: '時代遅れ', emoji: '🕰️', color: '#CC4400' };
  if (score >= 40) return { label: 'やや古い', emoji: '📅', color: '#BB8800' };
  if (score >= 20) return { label: '普通',     emoji: '🔄', color: '#4488CC' };
  return              { label: '新しめ',   emoji: '✨', color: '#228822' };
}
