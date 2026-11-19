import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().max(70),
    description: z.string().min(70).max(160),
    tldr: z.string().min(40),
    date: z.coerce.date(),
    category: z.enum(['AI Automation', 'Fractional CTO']),
    readingMinutes: z.number().int().positive(),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  }),
});
export const collections = { blog };
