// All company facts live here. Values marked PLACEHOLDER must be replaced before launch.
export const site = {
  name: 'Swift AI',
  legalName: 'Swift AI Tech Solutions Private Limited',
  url: 'https://swiftai.in', // PLACEHOLDER: keep in sync with astro.config.mjs
  slogan: 'Business at the speed of AI.',
  tagline: 'AI automation and fractional CTO services for transportation, logistics and growing businesses in India.',
  email: 'hello@swiftai.in', // PLACEHOLDER
  phone: '+91 00000 00000', // PLACEHOLDER
  address: 'India', // PLACEHOLDER: registered office address
  cin: 'CIN: to be added', // PLACEHOLDER
  gst: 'GSTIN: to be added', // PLACEHOLDER
  social: { linkedin: '', x: '' }, // PLACEHOLDER: add profile URLs
  products: {
    singleqr: 'https://singleqr.in',
    singlestaff: 'https://www.singlestaff.com',
  },
} as const;

// Founder facts: ONLY what the founder has confirmed. Add `name` (exact form) when confirmed; it is shown only if non-empty.
export const founder = {
  name: '', // PLACEHOLDER: confirm exact name and title with the founder
  title: 'Founder',
  facts: [
    '20+ years of experience in software development',
    'Experience as a fractional CTO for startups and companies',
    'CTO experience in transportation, including mobile app development for ride-hailing-style products',
    'Hands-on experience with GPS telematics',
  ],
} as const;

export const nav = [
  { label: 'Transportation', href: '/transportation/' },
  { label: 'AI Automations', href: '/ai-automations/' },
  { label: 'Fractional CTO', href: '/fractional-cto/' },
  { label: 'Products', href: '/products/' },
  { label: 'Consultation', href: '/consultation/' },
  { label: 'Blog', href: '/blog/' },
] as const;
