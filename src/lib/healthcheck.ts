export type Area = 'tracking' | 'dispatch' | 'onboarding' | 'billing' | 'support' | 'reporting' | 'app' | 'compliance';
export type Question = { id: string; area: Area; text: string; options: { label: string; points: 0 | 1 | 2 }[] };

const opt = (a: string, b: string, c: string): Question['options'] => [{ label: a, points: 0 }, { label: b, points: 1 }, { label: c, points: 2 }];

export const questions: Question[] = [
  { id: 'q1', area: 'tracking', text: 'How reliable is your vehicle or trip tracking data?', options: opt('Gaps and errors are common', 'Mostly fine, some manual fixing', 'Accurate and trusted by the team') },
  { id: 'q2', area: 'dispatch', text: 'How are trips or jobs assigned to drivers and vehicles?', options: opt('Manually, by phone or chat', 'Partly in software, with manual overrides', 'Largely automated by rules in software') },
  { id: 'q3', area: 'onboarding', text: 'How do you onboard drivers and verify vehicle documents?', options: opt('Paper or photos checked by hand', 'Digital copies, checked manually', 'Captured and verified in a system with reminders') },
  { id: 'q4', area: 'billing', text: 'How do you handle trip billing, invoices and reconciliation?', options: opt('Spreadsheets and manual entry', 'Software, but with a lot of manual matching', 'Mostly automatic, exceptions only') },
  { id: 'q5', area: 'support', text: 'How do customers and drivers get answers to routine questions?', options: opt('Staff answer every call or message', 'Some canned replies or an FAQ', 'Self-service or automated, staff handle exceptions') },
  { id: 'q6', area: 'reporting', text: 'How do managers see daily performance (utilisation, delays, costs)?', options: opt('Someone compiles it by hand, if at all', 'A dashboard that needs manual updates', 'Automatic reports delivered on schedule') },
  { id: 'q7', area: 'app', text: 'How stable and fast is your mobile app or driver app?', options: opt('Frequent crashes or complaints', 'Works, but updates are slow and risky', 'Stable, monitored and released regularly') },
  { id: 'q8', area: 'compliance', text: 'How do you track permits, device and data-handling requirements?', options: opt('We find out when something expires', 'A spreadsheet or calendar', 'Tracked with alerts and clear ownership') },
];

export const areaLabels: Record<Area, string> = {
  tracking: 'Tracking data quality', dispatch: 'Dispatch and assignment', onboarding: 'Driver and document onboarding', billing: 'Billing and reconciliation',
  support: 'Customer and driver support', reporting: 'Operations reporting', app: 'App stability and delivery', compliance: 'Compliance tracking',
};

export const recommendations: Record<Area, string> = {
  tracking: 'Audit your telematics pipeline: device health, data gaps, and how location events are stored and validated.',
  dispatch: 'Map your assignment rules, then automate the repeatable ones and keep humans on exceptions.',
  onboarding: 'Automate document capture and checking, with expiry reminders sent before a document lapses.',
  billing: 'Match trips to invoices automatically and surface only the mismatches for a person to review.',
  support: 'Put an assistant on WhatsApp and chat for routine questions, with a clean handover to staff.',
  reporting: 'Replace hand-built reports with automatic daily summaries that flag delays and cost anomalies.',
  app: 'Review architecture, monitoring and release process to make the app stable and quick to improve.',
  compliance: 'Create one register of permits, devices and obligations with alerts, and verify current rules for your vehicle types.',
};

export type Result = { complete: boolean; score: number; band: 'foundation' | 'growing' | 'strong'; weakest: Area[] };

export function scoreHealthCheck(answers: Record<string, number>): Result {
  let total = 0, complete = true;
  const pts: { area: Area; p: number; i: number }[] = [];
  questions.forEach((q, i) => {
    const raw = answers[q.id];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) { complete = false; return; }
    const p = Math.max(0, Math.min(2, Math.round(raw)));
    total += p; pts.push({ area: q.area, p, i });
  });
  const score = Math.round((total / (questions.length * 2)) * 100);
  const band = score < 40 ? 'foundation' : score < 75 ? 'growing' : 'strong';
  const weakest = pts.filter((x) => x.p < 2).sort((a, b) => a.p - b.p || a.i - b.i).slice(0, 3).map((x) => x.area);
  return { complete, score: complete ? score : 0, band, weakest };
}
