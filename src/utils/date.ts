import { Language } from '../types/blog';

/**
 * Formats a relative time string (e.g. "منذ 3 ساعات", "منذ يومين", "3 hours ago", "2 days ago")
 * based on how much time has passed since the publication date.
 */
export function formatTimeAgo(dateInput: string | Date | number, lang: Language = 'ar'): string {
  if (!dateInput) return lang === 'ar' ? 'حديثاً' : 'Recently';

  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return lang === 'ar' ? 'حديثاً' : 'Recently';

  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  const isAr = lang === 'ar';

  if (diffInSeconds < 60) {
    return isAr ? 'الآن' : 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    if (isAr) {
      if (diffInMinutes === 1) return 'منذ دقيقة واحدة';
      if (diffInMinutes === 2) return 'منذ دقيقتين';
      if (diffInMinutes >= 3 && diffInMinutes <= 10) return `منذ ${diffInMinutes} دقائق`;
      return `منذ ${diffInMinutes} دقيقة`;
    }
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    if (isAr) {
      if (diffInHours === 1) return 'منذ ساعة واحدة';
      if (diffInHours === 2) return 'منذ ساعتين';
      if (diffInHours >= 3 && diffInHours <= 10) return `منذ ${diffInHours} ساعات`;
      return `منذ ${diffInHours} ساعة`;
    }
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    if (isAr) {
      if (diffInDays === 1) return 'منذ يوم';
      if (diffInDays === 2) return 'منذ يومين';
      if (diffInDays >= 3 && diffInDays <= 10) return `منذ ${diffInDays} أيام`;
      return `منذ ${diffInDays} يوماً`;
    }
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    if (isAr) {
      if (diffInWeeks === 1) return 'منذ أسبوع';
      if (diffInWeeks === 2) return 'منذ أسبوعين';
      if (diffInWeeks >= 3 && diffInWeeks <= 10) return `منذ ${diffInWeeks} أسابيع`;
      return `منذ ${diffInWeeks} أسبوعاً`;
    }
    return diffInWeeks === 1 ? '1 week ago' : `${diffInWeeks} weeks ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    if (isAr) {
      if (diffInMonths === 1) return 'منذ شهر';
      if (diffInMonths === 2) return 'منذ شهرين';
      if (diffInMonths >= 3 && diffInMonths <= 10) return `منذ ${diffInMonths} أشهر`;
      return `منذ ${diffInMonths} شهراً`;
    }
    return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  if (isAr) {
    if (diffInYears === 1) return 'منذ سنة';
    if (diffInYears === 2) return 'منذ سنتين';
    if (diffInYears >= 3 && diffInYears <= 10) return `منذ ${diffInYears} سنوات`;
    return `منذ ${diffInYears} سنة`;
  }
  return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
}

/**
 * Formats full exact date and optional time (e.g. "26 سبتمبر 2026" or "Sep 26, 2026")
 */
export function formatExactDate(
  dateInput: string | Date | number,
  lang: Language = 'ar',
  includeTime: boolean = false
): string {
  if (!dateInput) return '';

  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  
  if (includeTime) {
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Calculates dynamic reading duration in minutes and seconds (YouTube style)
 * based on article text length (average reading speed: 160 words/min).
 */
export function calculateReadingStats(
  content?: string,
  contentAr?: string,
  fallbackMinutes?: number
) {
  const combined = `${content || ''} ${contentAr || ''}`.trim();
  let words = 0;

  if (combined) {
    const plainText = combined.replace(/<[^>]*>?/gm, '').replace(/[#*_`~[\]()]/g, ' ');
    words = plainText.split(/\s+/).filter(Boolean).length;
  }

  // If words are low or empty, use fallback minutes or default estimate
  let totalSeconds = 0;
  if (words > 30) {
    totalSeconds = Math.max(60, Math.round((words / 160) * 60));
  } else {
    const mins = fallbackMinutes && fallbackMinutes > 0 ? fallbackMinutes : 3;
    totalSeconds = mins * 60;
  }

  const minutes = Math.max(1, Math.floor(totalSeconds / 60));
  const seconds = totalSeconds % 60;
  const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    words,
    totalSeconds,
    minutes,
    seconds,
    durationYouTubeStyle: mmss,
  };
}

/**
 * Calculates reading time in minutes based on content word count (standard: 160 words per minute)
 */
export function calculateReadingTime(content?: string, contentAr?: string): number {
  const stats = calculateReadingStats(content, contentAr);
  return stats.minutes;
}

/**
 * Formats reading time accurately in Arabic and English
 */
export function formatReadingTime(minutes: number, lang: Language = 'ar'): string {
  const mins = Math.max(1, Math.round(minutes || 1));
  if (lang === 'ar') {
    if (mins === 1) return 'دقيقة واحدة قراءة';
    if (mins === 2) return 'دقيقتان قراءة';
    if (mins >= 3 && mins <= 10) return `${mins} دقائق قراءة`;
    return `${mins} دقيقة قراءة`;
  }
  return mins === 1 ? '1 min read' : `${mins} min read`;
}

/**
 * Formats YouTube-style reading time badge for cards and thumbnails (e.g. "03:24" or "02:48")
 */
export function formatReadingTimeBadge(
  minutesOrContent: number | { content?: string; content_ar?: string; reading_time_minutes?: number },
  lang: Language = 'ar'
): string {
  if (typeof minutesOrContent === 'object' && minutesOrContent !== null) {
    const stats = calculateReadingStats(
      minutesOrContent.content,
      minutesOrContent.content_ar,
      minutesOrContent.reading_time_minutes
    );
    return stats.durationYouTubeStyle;
  }

  const mins = Math.max(1, Math.round(Number(minutesOrContent) || 1));
  // Deterministic seconds variation if only integer minutes passed
  const secs = (mins * 17) % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Returns formatted relative time and exact date combined or separate
 */
export function getFormattedDateInfo(dateInput: string | Date | number, lang: Language = 'ar') {
  const relative = formatTimeAgo(dateInput, lang);
  const exact = formatExactDate(dateInput, lang);
  const fullWithTime = formatExactDate(dateInput, lang, true);

  return {
    relative,
    exact,
    fullWithTime,
    displayBadge: `${exact} • ${relative}`,
  };
}

/**
 * Converts video duration strings (e.g. "14:20", "01:25:30", "8:45") to ISO 8601 duration format (e.g. "PT14M20S", "PT1H25M30S")
 * required by Google Schema.org VideoObject.
 */
export function formatDurationToISO8601(durationStr?: string): string {
  if (!durationStr || typeof durationStr !== 'string') return 'PT5M0S';
  const clean = durationStr.trim();
  const parts = clean.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    const [min, sec] = parts;
    return `PT${min || 0}M${sec || 0}S`;
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    const [hrs, min, sec] = parts;
    return `PT${hrs || 0}H${min || 0}M${sec || 0}S`;
  }
  return 'PT5M0S';
}
