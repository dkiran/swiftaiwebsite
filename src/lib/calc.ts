import { pricing } from '../data/pricing';

/** Non-negative finite number, capped so extreme inputs can never overflow to NaN/Infinity. */
const num = (v: unknown, max = 1e9) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.min(v, max) : 0);
const round = (v: number) => Math.round(v);
const roundK = (v: number) => Math.round(v / 1000) * 1000; // estimates read as estimates

export type CtoInput = { stage: 'idea' | 'mvp' | 'scaling'; hoursPerWeek: number; months: number };
export type CtoEstimate = { monthlyMin: number; monthlyMax: number; totalMin: number; totalMax: number; fullTimeYearly: number };

export function estimateCto(i: CtoInput): CtoEstimate {
  const p = pricing.cto;
  const [lo, hi] = p.hourly[i.stage] ?? p.hourly.mvp;
  const hours = num(i.hoursPerWeek, 80) * p.weeksPerMonth;
  const monthlyMin = roundK(hours * lo);
  const monthlyMax = roundK(hours * hi);
  const months = num(i.months, 120);
  return { monthlyMin, monthlyMax, totalMin: monthlyMin * months, totalMax: monthlyMax * months, fullTimeYearly: p.fullTimeYearly[i.stage] ?? p.fullTimeYearly.mvp };
}

export type RoiInput = { process: string; tasksPerMonth: number; minutesPerTask: number; hourlyCostInr: number; automationPct: number };
export type RoiEstimate = { hoursSavedMonthly: number; savedMonthlyInr: number; savedYearlyInr: number; buildCostInr: number; paybackMonths: number | null };

export function estimateRoi(i: RoiInput): RoiEstimate {
  const pct = Math.min(num(i.automationPct), 100) / 100;
  const hoursSavedMonthly = (num(i.tasksPerMonth, 1e6) * num(i.minutesPerTask, 1e4)) / 60 * pct;
  const savedMonthlyInr = round(hoursSavedMonthly * num(i.hourlyCostInr, 1e6));
  const buildCostInr = pricing.roi.buildCostInr[i.process] ?? pricing.roi.defaultBuildCostInr;
  return { hoursSavedMonthly, savedMonthlyInr, savedYearlyInr: savedMonthlyInr * 12, buildCostInr, paybackMonths: savedMonthlyInr > 0 ? buildCostInr / savedMonthlyInr : null };
}

export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
