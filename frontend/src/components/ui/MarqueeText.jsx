import { cn } from '../../lib/cn.js';

const getWordList = (value = '') =>
  String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

export const MarqueeText = ({ text = '', wordLimit = 13, className = '', title }) => {
  const safeText = String(text || '').trim();
  if (!safeText) return null;
  const words = getWordList(safeText);
  const shouldMarquee = words.length > wordLimit;
  const displayWords = shouldMarquee ? words.slice(0, wordLimit).join(' ') : safeText;
  const maxWidthCh = Math.max(12, displayWords.length + 2);
  const duration = Math.min(60, Math.max(14, safeText.length * 0.35));

  return (
    <div
      className={cn('marquee', className)}
      style={shouldMarquee ? { maxWidth: `${maxWidthCh}ch` } : undefined}
      title={title || safeText}
      aria-label={safeText}
    >
      {shouldMarquee ? (
        <div className="marquee__inner" style={{ '--marquee-duration': `${duration}s` }}>
          <span className="marquee__text">{safeText}</span>
          <span className="marquee__text" aria-hidden="true">
            {safeText}
          </span>
        </div>
      ) : (
        <span className="block truncate">{safeText}</span>
      )}
    </div>
  );
};
