// PLACEHOLDER: every number below is an illustrative assumption, NOT Swift AI's real pricing.
// Replace with real rates before launch. All calculator output is labelled "indicative estimate, not a quote".
export const pricing = {
  cto: {
    // INR per hour, [min, max]
    hourly: { advisory: [1500, 3000], handson: [1800, 3500], teambuild: [2200, 4000] } as Record<string, [number, number]>,
    stageMultiplier: { idea: 1, mvp: 1, scaling: 1.2 } as Record<string, number>,
    teamSizeUplift: 0.01, // +1% per engineer managed, capped at 30 engineers
    weeksPerMonth: 4.33,
    // Indicative yearly cost of a full-time CTO (salary + benefits), INR
    fullTimeYearly: { idea: 3000000, mvp: 3600000, scaling: 6000000 } as Record<string, number>,
  },
  roi: {
    defaultBuildCostInr: 150000,
    buildCostInr: { support: 150000, sales: 120000, finance: 180000, hr: 120000, reporting: 90000, documents: 200000 } as Record<string, number>,
  },
} as const;
