// All company facts live here. Values marked PLACEHOLDER must be replaced before launch.
export const site = {
  name: 'Swift AI',
  legalName: 'Swift AI Tech Solutions Private Limited',
  url: 'https://swift-ai.in', // ASSUMED from the email domain swift-ai.in: confirm; keep in sync with astro.config.mjs and public/robots.txt
  slogan: 'Business at the speed of AI.',
  tagline: 'AI automation and fractional CTO services for transportation, logistics and growing businesses in India.',
  email: 'hello@swift-ai.in',
  phone: '+91 8008575757',
  phoneHref: '+918008575757',
  address: 'India', // PLACEHOLDER: registered office address
  gstin: '29ABTCS1111K1Z0',
  social: { linkedin: '', x: '' }, // PLACEHOLDER: add profile URLs
  products: {
    singleqr: 'https://singleqr.in',
    singlestaff: 'https://www.singlestaff.com',
  },
} as const;

// Founder facts: ONLY what the founder has confirmed (name, title and BharatSelfDrive.com confirmed 2026-11-20).
export const founder = {
  name: 'D Kiran Kumar',
  title: 'Founder',
  roles: [
    { org: 'SingleQR', role: 'Founder', url: 'https://singleqr.in' },
    { org: 'BharatSelfDrive.com', role: 'CTO', url: 'https://www.bharatselfdrive.com' },
  ],
  facts: [
    '20+ years of experience in software development',
    'Experience as a fractional CTO for startups and companies',
    'CTO experience in transportation, including mobile app development for ride-hailing-style products',
    'Hands-on experience with GPS telematics',
    'Founder of SingleQR',
    'CTO of BharatSelfDrive.com, a self-drive platform',
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
