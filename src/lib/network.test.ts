import { describe, it, expect } from 'vitest';
import { filterProfiles, sortProfiles, initials, facets, type ProfileLite } from './network';

const mk = (o: Partial<ProfileLite> & { id: string }): ProfileLite => ({
  name: 'Name', headline: '', roles: ['CTO'], domains: [], skills: [], engagement: ['fractional'], yearsExperience: 10, ...o,
});
const a = mk({ id: 'a', name: 'Asha Rao', headline: 'Fractional CTO for fintech', domains: ['Fintech'], skills: ['Node.js', 'AWS'], yearsExperience: 15, availability: 'available' });
const b = mk({ id: 'b', name: 'Ben Cole', headline: 'AI strategy lead', roles: ['CAIO'], domains: ['Healthtech', 'AI/ML'], engagement: ['advisory', 'interim'], yearsExperience: 8, availability: 'limited' });
const c = mk({ id: 'c', name: 'Chen Li', headline: 'CTO and CAIO', roles: ['CTO', 'CAIO'], domains: ['Transportation & mobility'], engagement: ['full-time', 'fractional'], yearsExperience: 20 });
const all = [a, b, c];
const ids = (x: ProfileLite[]) => x.map((p) => p.id).sort();

describe('filterProfiles', () => {
  it('returns everything for empty filters', () => expect(ids(filterProfiles(all, {}))).toEqual(['a', 'b', 'c']));
  it('searches name, headline, domains and skills case-insensitively', () => {
    expect(ids(filterProfiles(all, { q: 'ASHA' }))).toEqual(['a']);
    expect(ids(filterProfiles(all, { q: 'strategy' }))).toEqual(['b']);
    expect(ids(filterProfiles(all, { q: 'transportation' }))).toEqual(['c']);
    expect(ids(filterProfiles(all, { q: 'aws' }))).toEqual(['a']);
  });
  it('requires every word of a multi-word search to match', () => {
    expect(ids(filterProfiles(all, { q: 'fintech cto' }))).toEqual(['a']);
    expect(filterProfiles(all, { q: 'fintech healthtech' })).toEqual([]);
  });
  it('filters by role, including profiles that hold both roles', () => {
    expect(ids(filterProfiles(all, { role: 'CAIO' }))).toEqual(['b', 'c']);
    expect(ids(filterProfiles(all, { role: 'CTO' }))).toEqual(['a', 'c']);
  });
  it('filters by domain, engagement and availability', () => {
    expect(ids(filterProfiles(all, { domain: 'Healthtech' }))).toEqual(['b']);
    expect(ids(filterProfiles(all, { engagement: 'full-time' }))).toEqual(['c']);
    expect(ids(filterProfiles(all, { availability: 'available' }))).toEqual(['a']);
  });
  it('filters by minimum years of experience', () => {
    expect(ids(filterProfiles(all, { minYears: 15 }))).toEqual(['a', 'c']);
    expect(ids(filterProfiles(all, { minYears: 25 }))).toEqual([]);
  });
  it('combines filters with AND and tolerates whitespace and NaN', () => {
    expect(ids(filterProfiles(all, { role: 'CTO', minYears: 16 }))).toEqual(['c']);
    expect(ids(filterProfiles(all, { q: '   ', minYears: Number.NaN }))).toEqual(['a', 'b', 'c']);
  });
});

describe('sortProfiles', () => {
  it('puts available first, then limited, then unknown, then by experience and name', () => {
    expect(sortProfiles(all).map((p) => p.id)).toEqual(['a', 'b', 'c']);
    const d = mk({ id: 'd', name: 'Zed', yearsExperience: 20 });
    expect(sortProfiles([d, c]).map((p) => p.id)).toEqual(['c', 'd']);
  });
  it('does not mutate its input', () => {
    const copy = [...all]; sortProfiles(all); expect(all).toEqual(copy);
  });
});

describe('initials', () => {
  it('uses first and last word', () => expect(initials('D Kiran Kumar')).toBe('DK'));
  it('handles one word, extra spaces and empty', () => {
    expect(initials('Madonna')).toBe('M');
    expect(initials('  Asha   Rao ')).toBe('AR');
    expect(initials('')).toBe('?');
  });
});

describe('facets', () => {
  it('lists unique sorted domains and engagement types', () => {
    const f = facets(all);
    expect(f.domains).toEqual(['AI/ML', 'Fintech', 'Healthtech', 'Transportation & mobility']);
    expect(f.engagement).toEqual(['advisory', 'fractional', 'full-time', 'interim']);
  });
});
