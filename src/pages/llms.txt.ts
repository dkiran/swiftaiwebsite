import { getCollection } from 'astro:content';
import { site } from '../data/site';

export async function GET() {
  const posts = (await getCollection('blog')).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const u = (p: string) => new URL(p, site.url).href;
  const body = `# ${site.name}

> ${site.slogan} ${site.name} is the brand of ${site.legalName}, an Indian AI and technology company. We help SMEs, MSMEs and startups automate work with AI, provide fractional and full-time CTOs, build software quickly with AI-assisted engineering, and run our own products.

## Services
- [AI Automations](${u('/ai-automations/')}): we study how a business runs, then implement AI automations (support, sales follow-up, finance, HR, reporting) wherever they save time and money. Start with a free AI Audit.
- [Fractional CTO](${u('/fractional-cto/')}): part-time or full-time CTO leadership for startups and companies.
- [Consultation](${u('/consultation/')}): software development at high speed using AI-assisted engineering.
- [Transportation and mobility](${u('/transportation/')}): our specialty. Fractional CTO, GPS telematics consulting, ride-hailing-style mobile apps and AI automation for fleets, logistics and mobility companies. Free [fleet health check](${u('/transportation/health-check/')}).
- [Pricing](${u('/pricing/')}): fractional CTO at INR 1,500 per hour; early-stage startups from INR 850 per hour. AI automation builds at INR 2,500 per hour. Full-time CTO packages from INR 36 lakh per year (remote) and INR 50 lakh (on-site). First AI Audit is free.
- [Products](${u('/products/')}): SingleQR (${site.products.singleqr}) and SingleStaff (${site.products.singlestaff}).

## Get started
- [Book a free AI Audit](${u('/book-ai-audit/')}): free 45-minute call for SMEs and MSMEs, with a written opportunity map.
- [Startup founders: request an appointment](${u('/get-started/')})
- [Hire a CTO](${u('/hire-a-cto/')}) and [Join as a CTO](${u('/join-as-a-cto/')})
- [Fractional CTO cost calculator](${u('/fractional-cto/cost-calculator/')}) and [AI automation ROI calculator](${u('/ai-automations/roi-calculator/')})

## Blog
${posts.map((p) => `- [${p.data.title}](${u(`/blog/${p.id}/`)}): ${p.data.description}`).join('\n')}

## Company
- Founder: D Kiran Kumar (20+ years in software development; fractional CTO; transportation CTO experience; GPS telematics; Founder of SingleQR; CTO of BharatSelfDrive.com, a self-drive platform)
- Contact: ${site.email}, ${site.phone}
- Legal name: ${site.legalName}
- Office: ${site.address}
- Registered office: ${site.registeredAddress}
- Country: India
- Contact: ${u('/contact/')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
