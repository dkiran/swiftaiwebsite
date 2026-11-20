import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().max(70),
    description: z.string().min(70).max(160),
    tldr: z.string().min(40),
    date: z.coerce.date(),
    category: z.enum(['AI Automation', 'Fractional CTO', 'Transportation Tech']),
    readingMinutes: z.number().int().positive(),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  }),
});
// Network profiles. `.strict()` on purpose: there is NO rate field, and adding one (or any unknown key) fails the build,
// because hourly rates are shared by Swift AI only after a company requests an introduction.
const profiles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/profiles' }),
  schema: z.object({
    name: z.string().min(2),
    headline: z.string().min(10).max(110),
    roles: z.array(z.enum(['CTO', 'CAIO'])).min(1),
    yearsExperience: z.number().int().min(1),
    domains: z.array(z.string()).min(1),
    skills: z.array(z.string()).default([]),
    engagement: z.array(z.enum(['fractional', 'full-time', 'advisory', 'interim'])).min(1),
    availability: z.enum(['available', 'limited', 'booked']).optional(),
    location: z.string().optional(),
    linkedin: z.string().url().optional(),
    highlights: z.array(z.string()).default([]),
    status: z.enum(['published', 'draft']).default('published'),
  }).strict(),
});

export const collections = { blog, profiles };
