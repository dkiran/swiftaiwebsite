// Validates the built site in dist/. This is the project's build-level test.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const fails = [];
const fail = (m) => fails.push(m);

if (!existsSync(DIST)) {
  console.error('FAIL: dist not found. Run `npm run build` first.');
  process.exit(1);
}

const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const pages = walk(DIST).filter((p) => p.endsWith('.html'));
const count = (s, re) => (s.match(re) || []).length;
const rel = (p) => '/' + p.slice(DIST.length + 1).replace(/index\.html$/, '');

for (const p of pages) {
  const h = readFileSync(p, 'utf8');
  const r = rel(p);
  if (r === '/404.html') continue;
  if (count(h, /<h1[\s>]/g) !== 1) fail(`${r}: expected exactly one <h1>`);
  const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  if (!title || title.length > 70) fail(`${r}: title missing or >70 chars (${title.length})`);
  const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (desc.length < 70 || desc.length > 170) fail(`${r}: description length ${desc.length} not in 70–170`);
  if (!/<link rel="canonical"/.test(h)) fail(`${r}: missing canonical`);
  if (!/property="og:title"/.test(h)) fail(`${r}: missing og:title`);
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { fail(`${r}: invalid JSON-LD`); }
  }
}

const mustExist = ['sitemap-index.xml', 'robots.txt', 'llms.txt', 'rss.xml'];
for (const f of mustExist) if (!existsSync(join(DIST, f))) fail(`missing dist/${f}`);

// Page-specific expectations
const html = (path) => {
  const f = join(DIST, path, 'index.html');
  return existsSync(f) ? readFileSync(f, 'utf8') : null;
};
const expect = (path, test, msg) => {
  const h = html(path);
  if (h === null) return fail(`${path || '/'}: page missing`);
  if (!test(h)) fail(`${path || '/'}: ${msg}`);
};
const hasType = (t) => (h) => new RegExp(`"@type":\\s*"${t}"`).test(h);

if (process.env.CHECK_STAGE >= 2 || !process.env.CHECK_STAGE) {
  expect('', (h) => h.includes('Book a free AI Audit'), 'missing audit CTA');
  expect('', hasType('FAQPage'), 'missing FAQPage JSON-LD');
}
if (process.env.CHECK_STAGE >= 3 || !process.env.CHECK_STAGE) {
  for (const s of ['ai-automations', 'fractional-cto', 'consultation'])
    expect(s, hasType('Service'), 'missing Service JSON-LD');
  expect('products', (h) => h.includes('singleqr.in') && h.includes('singlestaff.com'), 'missing product links');
}
if (process.env.CHECK_STAGE >= 5 || !process.env.CHECK_STAGE) {
  const posts = existsSync(join(DIST, 'blog'))
    ? readdirSync(join(DIST, 'blog')).filter((d) => statSync(join(DIST, 'blog', d)).isDirectory())
    : [];
  if (posts.length < 6) fail(`blog: expected ≥6 posts, found ${posts.length}`);
  for (const s of posts) expect('blog/' + s, hasType('Article'), 'missing Article JSON-LD');
}

if (fails.length) {
  console.error(`FAIL (${fails.length}):\n - ` + fails.join('\n - '));
  process.exit(1);
}
console.log(`OK: ${pages.length} pages checked`);
