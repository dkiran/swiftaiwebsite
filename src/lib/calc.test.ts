import { describe, it, expect } from 'vitest';
import { estimateCto, estimateRoi, defaultBuildHours } from './calc';
import { pricing } from '../data/pricing';

const cto = { stage: 'mvp', hoursPerWeek: 12, months: 6 } as const;

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
  it('reports full-time CTO packages from ₹50 lakh on-site and ₹36 lakh remote per year, for any stage', () => {
    for (const stage of ['idea', 'mvp', 'scaling'] as const) {
      const r = estimateCto({ ...cto, stage });
      expect(r.fullTimeOnsiteYearly).toBe(5000000);
      expect(r.fullTimeRemoteYearly).toBe(3600000);
    }
  });
  it('prices startups at ₹850–₹1,500 per hour (10 h/week ≈ 43.3 h/month)', () => {
    const r = estimateCto({ stage: 'mvp', hoursPerWeek: 10, months: 1 });
    expect(r.monthlyMin).toBe(37000);
    expect(r.monthlyMax).toBe(65000);
  });
  it('prices scaling companies at a flat ₹1,500 per hour', () => {
    const r = estimateCto({ stage: 'scaling', hoursPerWeek: 10, months: 1 });
    expect(r.monthlyMin).toBe(65000);
    expect(r.monthlyMax).toBe(65000);
  });
});

describe('estimateRoi', () => {
  const roi = { buildHours: 80, tasksPerMonth: 100, minutesPerTask: 30, hourlyCostInr: 500, automationPct: 80 };
  it('computes hours and rupees saved', () => {
    const r = estimateRoi(roi);
    expect(r.hoursSavedMonthly).toBe(40);
    expect(r.savedMonthlyInr).toBe(20000);
    expect(r.savedYearlyInr).toBe(240000);
  });
  it('prices the build at ₹2,500 per hour of estimated effort', () => {
    expect(estimateRoi(roi).buildCostInr).toBe(200000);
    expect(pricing.roi.buildRatePerHour).toBe(2500);
  });
  it('payback is build cost divided by monthly saving', () => {
    expect(estimateRoi(roi).paybackMonths).toBeCloseTo(10, 5);
  });
  it('payback is null when nothing is saved', () => {
    expect(estimateRoi({ ...roi, tasksPerMonth: 0 }).paybackMonths).toBeNull();
  });
  it('clamps automation share to 0–100 and ignores negatives', () => {
    expect(estimateRoi({ ...roi, automationPct: 250 }).hoursSavedMonthly).toBe(50);
    expect(estimateRoi({ ...roi, minutesPerTask: -10 }).savedMonthlyInr).toBe(0);
  });
  it('treats negative or missing build hours as zero cost', () => {
    expect(estimateRoi({ ...roi, buildHours: -5 }).buildCostInr).toBe(0);
  });
});

describe('absurd inputs stay finite', () => {
  it('estimateRoi clamps huge values to finite numbers', () => {
    const r = estimateRoi({ tasksPerMonth: 1e200, minutesPerTask: 1e200, hourlyCostInr: 1e200, automationPct: 70, buildHours: 1e200 });
    for (const v of [r.hoursSavedMonthly, r.savedMonthlyInr, r.savedYearlyInr, r.buildCostInr]) expect(Number.isFinite(v)).toBe(true);
    const z = estimateRoi({ tasksPerMonth: 1e200, minutesPerTask: 1e200, hourlyCostInr: 0, automationPct: 70, buildHours: 50 });
    expect(z.savedMonthlyInr).toBe(0);
    expect(z.paybackMonths).toBeNull();
  });
  it('estimateCto clamps huge values to finite numbers', () => {
    const r = estimateCto({ ...cto, hoursPerWeek: 1e200, months: 1e200 });
    for (const v of [r.monthlyMin, r.monthlyMax, r.totalMin, r.totalMax]) expect(Number.isFinite(v)).toBe(true);
  });
});
