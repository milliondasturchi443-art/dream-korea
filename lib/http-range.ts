// RFC 7233 bo'yicha yagona "bytes" diapazonini yechadi (GridFS stream'lar uchun).
//   bytes=0-99 | bytes=100- | bytes=-500
// null → diapazon yo'q/qo'llab-quvvatlanmaydi (200 bilan javob beriladi)
// "unsatisfiable" → 416
export type ParsedRange = { start: number; end: number } | null | "unsatisfiable";

export function parseRange(header: string | null, total: number): ParsedRange {
  if (!header || !Number.isFinite(total) || total <= 0) return null;
  const m = /^bytes\s*=\s*(.+)$/i.exec(header.trim());
  if (!m) return null;
  const parts = m[1].split(",");
  if (parts.length !== 1) return null; // ko'p qismli so'rov — 200 bilan o'tkazib yuboramiz
  const spec = /^(\d*)-(\d*)$/.exec(parts[0].trim());
  if (!spec) return "unsatisfiable";
  const [, sRaw, eRaw] = spec;
  if (!sRaw && !eRaw) return "unsatisfiable";

  let start: number;
  let end: number;
  if (!sRaw) {
    // oxiridan N bayt (bytes=-500)
    const suffix = Number(eRaw);
    if (!Number.isFinite(suffix) || suffix <= 0) return "unsatisfiable";
    start = Math.max(0, total - suffix);
    end = total - 1;
  } else {
    start = Number(sRaw);
    if (!Number.isFinite(start) || start >= total) return "unsatisfiable";
    end = eRaw ? Number(eRaw) : total - 1;
    if (!Number.isFinite(end) || end < start) return "unsatisfiable";
    if (end > total - 1) end = total - 1;
  }
  return { start, end };
}
