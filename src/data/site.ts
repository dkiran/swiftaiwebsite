// All company facts live here. Values marked PLACEHOLDER must be replaced before launch.
export const site = {
  name: 'Swift AI',
  legalName: 'Swift AI Tech Solutions Private Limited',
  url: 'https://swiftai.in', // PLACEHOLDER: keep in sync with astro.config.mjs
  slogan: 'Business at the speed of AI.',
  tagline: 'AI automation and fractional CTO services that make businesses faster.',
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

export const nav = [
  { label: 'AI Automations', href: '/ai-automations/' },
  { label: 'Fractional CTO', href: '/fractional-cto/' },
  { label: 'Products', href: '/products/' },
  { label: 'Consultation', href: '/consultation/' },
  { label: 'Blog', href: '/blog/' },
] as const;
