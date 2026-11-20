export type Role = 'CTO' | 'CAIO';
export type Engagement = 'fractional' | 'full-time' | 'advisory' | 'interim';
export type Availability = 'available' | 'limited' | 'booked';

export type ProfileLite = {
  id: string; name: string; headline: string; roles: Role[]; domains: string[]; skills: string[];
  engagement: Engagement[]; yearsExperience: number; availability?: Availability;
};
export type Filters = { q?: string; role?: Role | ''; domain?: string; engagement?: string; availability?: string; minYears?: number };

export function filterProfiles<T extends ProfileLite>(items: T[], f: Filters): T[] {
  const words = (f.q ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  const min = typeof f.minYears === 'number' && Number.isFinite(f.minYears) ? f.minYears : 0;
  return items.filter((p) => {
    if (f.role && !p.roles.includes(f.role)) return false;
    if (f.domain && !p.domains.includes(f.domain)) return false;
    if (f.engagement && !p.engagement.includes(f.engagement as Engagement)) return false;
    if (f.availability && p.availability !== f.availability) return false;
    if (p.yearsExperience < min) return false;
    if (words.length) {
      const hay = [p.name, p.headline, ...p.domains, ...p.skills, ...p.roles].join(' ').toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  });
}

const rank = (a?: Availability) => (a === 'available' ? 0 : a === 'limited' ? 1 : a === 'booked' ? 3 : 2);

export function sortProfiles<T extends ProfileLite>(items: T[]): T[] {
  return [...items].sort((x, y) => rank(x.availability) - rank(y.availability) || y.yearsExperience - x.yearsExperience || x.name.localeCompare(y.name));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0], last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function facets<T extends ProfileLite>(items: T[]) {
  const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b));
  return { domains: uniq(items.flatMap((p) => p.domains)), engagement: uniq(items.flatMap((p) => p.engagement)) };
}
