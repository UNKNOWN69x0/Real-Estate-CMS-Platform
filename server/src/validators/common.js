import { z } from 'zod';

export const statusEnum = z.enum(['draft', 'published']);

// Media/links may be empty (not uploaded yet) or an http(s) URL
export const urlOrEmpty = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === '' || /^https?:\/\//i.test(v), 'Must be a valid http(s) URL');

export const orderField = z.coerce.number().int('Must be a whole number').min(0, 'Must be 0 or more').max(100000, 'Must be 100000 or less');

export const seoSchema = z.object({
  metaTitle: z.string().trim().max(70, 'Keep the meta title under 70 characters').default(''),
  metaDescription: z.string().trim().max(160, 'Keep the meta description under 160 characters').default(''),
  ogImage: urlOrEmpty.default(''),
});
