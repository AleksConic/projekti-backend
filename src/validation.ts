// 2. sloj validacije (server): regularni izrazi i provere duzine
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const NAME_RE = /^[\p{L}][\p{L} '\-]{0,49}$/u;

export const isNonEmpty = (v: unknown, max: number): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;

export const STATUSES = ["To Do", "Doing", "Done"] as const;
export type Status = (typeof STATUSES)[number];

export const MIN_LOZINKA = 8;
export const MAX_OPIS = 2000;
