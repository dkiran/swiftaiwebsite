// CTO hourly rates are Swift AI's real rates (from the founder). Everything marked PLACEHOLDER is an assumption to replace.
// All calculator output is labelled "indicative estimate, not a quote".
export const pricing = {
  cto: {
    // INR per hour [min, max]. Source: founder. Standard rate ₹1,500/hour; early-stage startups from ₹850/hour depending on scope.
    hourly: { idea: [850, 1500], mvp: [850, 1500], scaling: [1500, 1500] } as Record<string, [number, number]>,
    weeksPerMonth: 4.33,
    // Source: founder. Full-time CTO packages start from ₹50 lakh per annum on-site and ₹36 lakh per annum remote.
    fullTime: { onsite: 5000000, remote: 3600000 },
  },
  roi: {
    // Source: founder. AI automation builds are charged at ₹2,500 per hour, from an estimate of hours based on complexity.
    buildRatePerHour: 2500,
    // PLACEHOLDER: indicative build hours by complexity. Real projects are estimated individually.
    complexityHours: { simple: 40, standard: 100, complex: 200 } as Record<'simple' | 'standard' | 'complex', number>,
  },
} as const;

export const rates = { standardPerHour: 1500, startupFromPerHour: 850, aiBuildPerHour: 2500, fullTimeCtoOnsiteYearly: 5000000, fullTimeCtoRemoteYearly: 3600000 } as const;
