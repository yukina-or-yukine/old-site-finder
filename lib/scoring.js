const CURRENT_YEAR = new Date().getFullYear();

export function calculateScore({ hasSSL, lastWaybackYear, copyrightYear, hasMobileViewport }) {
  let score = 0;

  if (copyrightYear) {
    if      (copyrightYear <= 2015) score += 40;
    else if (copyrightYear <= 2017) score += 35;
    else if (copyrightYear <= 2019) score += 30;
    else if (copyrightYear <= 2021) score += 20;
    else                            score += 5;
  }

  if (!hasSSL)           score += 20;
  if (!hasMobileViewport) score += 20;

  if (lastWaybackYear && (CURRENT_YEAR - lastWaybackYear) >= 3) score += 20;

  return Math.min(score, 100);
}

export function getBadge(score) {
  if (score >= 70) return { label: 'かなり古い', emoji: '🦕', color: '#CC2222' };
  if (score >= 50) return { label: 'やや古い',   emoji: '🕰️', color: '#DD6600' };
  if (score >= 30) return { label: '普通',       emoji: '🔄', color: '#888888' };
  return              { label: '',            emoji: '',    color: '#AAAAAA' };
}
