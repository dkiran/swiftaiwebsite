// CTO hourly rates are Swift AI's real rates (from the founder). Everything marked PLACEHOLDER is an assumption to replace.
// All calculator output is labelled "indicative estimate, not a quote".
export const pricing = {
  cto: {
    // INR per hour [min, max]. Source: founder. Standard rate ₹1,500/hour; early-stage startups from ₹850/hour depending on scope.
    hourly: { idea: [850, 1500], mvp: [850, 1500], scaling: [1500, 1500] } as Record<string, [number, number]>,
    weeksPerMonth: 4.33,
    // PLACEHOLDER: indicative yearly cost of a full-time CTO (salary + benefits), INR. Not provided by founder.
    fullTimeYearly: { idea: 3000000, mvp: 3600000, scaling: 6000000 } as Record<string, number>,
  },
  roi: {
    defaultBuildCostInr: 150000,
    buildCostInr: { support: 150000, sales: 120000, finance: 180000, hr: 120000, reporting: 90000, documents: 200000 } as Record<string, number>,
  },
} as const;

export const rates = { standardPerHour: 1500, startupFromPerHour: 850 } as const;
