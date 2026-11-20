import { describe, it, expect } from 'vitest';
import { estimateCto, estimateRoi } from './calc';
import { pricing } from '../data/pricing';

const cto = { stage: 'mvp', model: 'handson', hoursPerWeek: 12, months: 6, teamSize: 5 } as const;

describe('estimateCto', () => {
  it('returns zero cost at zero hours', () => {
    const r = estimateCto({ ...cto, hoursPerWeek: 0 });
    expect([r.monthlyMin, r.monthlyMax, r.totalMin, r.totalMax]).toEqual([0, 0, 0, 0]);
  });
  it('total equals monthly times months', () => {
    const r = estimateCto(cto);
    expect(r.totalMin).toBe(r.monthlyMin * 6);
    expect(r.totalMax).toBe(r.monthlyMax * 6);
  });
  it('min never exceeds max and cost rises with hours', () => {
    const a = estimateCto(cto), b = estimateCto({ ...cto, hoursPerWeek: 24 });
    expect(a.monthlyMin).toBeLessThanOrEqual(a.monthlyMax);
    expect(b.monthlyMax).toBeGreaterThan(a.monthlyMax);
  });
  it('clamps negative and NaN inputs to zero', () => {
    const r = estimateCto({ ...cto, hoursPerWeek: -5, months: Number.NaN });
    expect(r.monthlyMin).toBe(0);
    expect(r.totalMax).toBe(0);
  });
  it('reports the full-time benchmark from pricing for the stage', () => {
    expect(estimateCto(cto).fullTimeYearly).toBe(pricing.cto.fullTimeYearly.mvp);
  });
});

describe('estimateRoi', () => {
  const roi = { process: 'support', tasksPerMonth: 100, minutesPerTask: 30, hourlyCostInr: 500, automationPct: 80 };
  it('computes hours and rupees saved', () => {
    const r = estimateRoi(roi);
    expect(r.hoursSavedMonthly).toBe(40);
    expect(r.savedMonthlyInr).toBe(20000);
    expect(r.savedYearlyInr).toBe(240000);
  });
  it('payback is build cost divided by monthly saving', () => {
    const r = estimateRoi(roi);
    expect(r.paybackMonths).toBeCloseTo(r.buildCostInr / 20000, 5);
  });
  it('payback is null when nothing is saved', () => {
    expect(estimateRoi({ ...roi, tasksPerMonth: 0 }).paybackMonths).toBeNull();
  });
  it('clamps automation share to 0–100 and ignores negatives', () => {
    expect(estimateRoi({ ...roi, automationPct: 250 }).hoursSavedMonthly).toBe(50);
    expect(estimateRoi({ ...roi, minutesPerTask: -10 }).savedMonthlyInr).toBe(0);
  });
  it('falls back to a default build cost for an unknown process', () => {
    expect(estimateRoi({ ...roi, process: 'unknown' }).buildCostInr).toBe(pricing.roi.defaultBuildCostInr);
  });
});

describe('absurd inputs stay finite', () => {
  it('estimateRoi clamps huge values to finite numbers', () => {
    const r = estimateRoi({ process: 'support', tasksPerMonth: 1e200, minutesPerTask: 1e200, hourlyCostInr: 1e200, automationPct: 70 });
    for (const v of [r.hoursSavedMonthly, r.savedMonthlyInr, r.savedYearlyInr]) expect(Number.isFinite(v)).toBe(true);
    const z = estimateRoi({ process: 'support', tasksPerMonth: 1e200, minutesPerTask: 1e200, hourlyCostInr: 0, automationPct: 70 });
    expect(z.savedMonthlyInr).toBe(0);
    expect(z.paybackMonths).toBeNull();
  });
  it('estimateCto clamps huge values to finite numbers', () => {
    const r = estimateCto({ ...cto, hoursPerWeek: 1e200, months: 1e200, teamSize: 1e200 });
    for (const v of [r.monthlyMin, r.monthlyMax, r.totalMin, r.totalMax]) expect(Number.isFinite(v)).toBe(true);
  });
});
