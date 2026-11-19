import { site } from '../data/site';

export const serviceSchema = (name: string, description: string, path: string) => ({
  '@context': 'https://schema.org', '@type': 'Service', name, description, url: new URL(path, site.url).href,
  serviceType: name, areaServed: { '@type': 'Country', name: 'India' }, provider: { '@id': `${site.url}/#org` },
});

export const breadcrumbSchema = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: new URL(it.path, site.url).href })),
});
