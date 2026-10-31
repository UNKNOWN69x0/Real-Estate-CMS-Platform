import { z } from 'zod';
import { orderField, seoSchema, statusEnum, urlOrEmpty } from './common.js';

const text = (max = 200) => z.string().trim().max(max);

// Section.content is free-form, but any link/image field in it must be http(s), a #anchor or a /path
// (never javascript: or data:). Issue paths mirror the admin form's field names (content.stats.0.url).
const LINK_KEY = /(url|href|image)$/i;
const SAFE_LINK = /^(https?:\/\/|#|\/(?!\/))/i;

function checkContentLinks(value, path, ctx) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => checkContentLinks(item, [...path, i], ctx));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => checkContentLinks(item, [...path, key], ctx));
  } else if (typeof value === 'string' && LINK_KEY.test(String(path.at(-1))) && value.trim() && !SAFE_LINK.test(value.trim())) {
    ctx.addIssue({ code: 'custom', path, message: 'Must be an http(s) URL, a #anchor or a /path' });
  }
}

const sectionContent = z
  .record(z.string(), z.unknown())
  .superRefine((content, ctx) => checkContentLinks(content, [], ctx));

export const sectionSchema = z.object({
  key: z.string().trim().regex(/^[a-z][a-zA-Z0-9-]{1,39}$/, 'Use letters, numbers or dashes (2-40 chars)'),
  title: text(200).default(''),
  subtitle: text(300).default(''),
  body: z.string().max(10000).default(''),
  image: urlOrEmpty.default(''),
  content: sectionContent.default({}),
  seo: seoSchema.default({ metaTitle: '', metaDescription: '', ogImage: '' }),
  status: statusEnum.default('draft'),
  order: orderField.default(0),
});

export const amenitySchema = z.object({
  title: text(120).min(1, 'Title is required'),
  description: text(500).default(''),
  icon: text(60).default('Sparkles'),
  image: urlOrEmpty.default(''),
  status: statusEnum.default('draft'),
  order: orderField.default(0),
});

export const gallerySchema = z.object({
  title: text(120).min(1, 'Title is required'),
  image: urlOrEmpty.refine((v) => v !== '', 'Image is required'),
  category: text(60).default('general'),
  status: statusEnum.default('draft'),
  order: orderField.default(0),
});

const area = z.coerce.number().min(0, 'Must be 0 or more').max(100000);

export const floorPlanSchema = z.object({
  unitType: text(80).min(1, 'Unit type is required'),
  carpetArea: area,
  balcony: area.default(0),
  totalArea: area,
  floors: text(40).default(''),
  image: urlOrEmpty.default(''),
  pdfUrl: urlOrEmpty.default(''),
  status: statusEnum.default('draft'),
  order: orderField.default(0),
});

export const inquiryCreateSchema = z.object({
  name: text(100).min(2, 'Please enter your name'),
  phone: z.string().trim().regex(/^\+?[\d\s-]{7,18}$/, 'Enter a valid phone number'),
  email: z.union([z.literal(''), z.email('Enter a valid email').max(200)]).default(''),
  message: text(1000).default(''),
  source: text(60).default('website'),
});

export const inquiryUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'closed']).optional(),
  notes: text(1000).optional(),
});

export const loginSchema = z.object({
  email: z.email('Enter a valid email').max(200),
  password: z.string().min(1, 'Password is required').max(200),
});

export const publishSchema = z.object({ status: statusEnum.optional() }).default({});
