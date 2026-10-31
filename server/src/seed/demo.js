/*
 * Demo data for screenshots, demos and dashboard testing.
 *   npm run seed:demo                  insert demo records (safe to run twice)
 *   npm run seed:demo -- --reset       remove demo records, then insert them again with fresh dates
 *   npm run seed:demo:clear            remove only the demo records
 *
 * Every demo record carries a hidden `demo` key (e.g. "inq-07"). Inserts are keyed on it, so re-running
 * never duplicates, and clearing deletes by it, so real content and the admin user are never touched.
 * Writes go through the raw collections so createdAt/updatedAt can be backdated.
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDb } from '../config/db.js';
import { User } from '../models/User.js';
import { Section } from '../models/Section.js';
import { Amenity } from '../models/Amenity.js';
import { GalleryItem } from '../models/GalleryItem.js';
import { FloorPlan } from '../models/FloorPlan.js';
import { Inquiry } from '../models/Inquiry.js';
import { ActivityLog } from '../models/ActivityLog.js';

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

// Small seeded PRNG so every run builds the same data
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffle = (list, rand) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

// `daysAgo` days back at hh:mm local time; never in the future
function at(now, daysAgo, hh, mm) {
  const d = new Date(now);
  d.setHours(hh, mm, 0, 0);
  let t = d.getTime() - daysAgo * DAY;
  if (t > now.getTime()) t -= DAY;
  return new Date(t);
}

// ---------- Inquiries (25) ----------
const PEOPLE = [
  'Aarav Mehta', 'Priya Nair', 'Rohan Deshmukh', 'Sneha Kulkarni', 'Vikram Singh Rathore', 'Ananya Iyer',
  'Mohammed Faizan Shaikh', 'Kavita Joshi', 'Arjun Reddy', 'Pooja Bhatt', 'Sandeep Patil', 'Neha Agarwal',
  'Imran Qureshi', 'Divya Menon', 'Rajesh Gupta', 'Meera Pillai', 'Harpreet Kaur', 'Siddharth Jain',
  'Tanvi Chavan', 'Amitabh Banerjee', 'Farah Khan', 'Nikhil Sawant', 'Lakshmi Narayanan', 'Gurpreet Sandhu',
  'Swati Mishra',
];
const MAIL_DOMAINS = ['gmail.com', 'gmail.com', 'gmail.com', 'yahoo.co.in', 'outlook.com', 'rediffmail.com'];
const MESSAGES = [
  'Interested in 2 BHK Alto, please share price and brochure',
  'Want to schedule a site visit this weekend',
  'Please share the floor plan and carpet area details for 1 BHK Grand',
  'Is the project RERA registered? Need the possession timeline.',
  'What are the payment plans and home loan options?',
  'Looking for a 1 RK for investment. Please call me.',
  'Please send the brochure on WhatsApp',
  'Can we visit on Sunday morning? Family of four.',
  'Interested in the 1 BHK Classic, what is the price per sq ft?',
  'Need details on amenities and parking allotment',
  'Please call after 6 pm',
  'Calling from Dubai, can you arrange a virtual walkthrough?',
  '',
];
const NOTES = [
  'Called, wants a site visit on Saturday 11am',
  'Sent brochure on WhatsApp, follow up in 2 days',
  'Not interested, budget mismatch',
  'Site visit booked for Sunday',
  'Looking elsewhere, closing',
  'Duplicate enquiry, merged with earlier lead',
  'Needs home loan assistance, shared bank contacts',
];

export function buildInquiries(now) {
  const rand = rng(20251031);
  const statuses = shuffle([...Array(10).fill('new'), ...Array(8).fill('contacted'), ...Array(7).fill('closed')], rand);
  const sources = shuffle([...Array(9).fill('hero'), ...Array(8).fill('cta'), ...Array(8).fill('floor-plans')], rand);
  const phones = new Set();
  let notesUsed = 0;

  return PEOPLE.map((name, i) => {
    let phone;
    do phone = `+91 98${String(Math.floor(rand() * 1e8)).padStart(8, '0')}`;
    while (phones.has(phone));
    phones.add(phone);

    const [first, ...rest] = name.toLowerCase().split(' ');
    const email = rand() < 0.2 ? '' : `${first}.${rest.at(-1)}${Math.floor(10 + rand() * 89)}@${MAIL_DOMAINS[Math.floor(rand() * MAIL_DOMAINS.length)]}`;

    // Spread across the last 30 days, oldest first, working-hours timestamps
    const createdAt = at(now, 29 - Math.floor((i * 29) / 24), 9 + Math.floor(rand() * 12), Math.floor(rand() * 60));
    const status = statuses[i];
    const handled = status !== 'new';
    const note = handled && notesUsed < NOTES.length && rand() < 0.7 ? NOTES[notesUsed++] : '';
    const updatedAt = handled ? new Date(Math.min(createdAt.getTime() + (2 + Math.floor(rand() * 46)) * HOUR, now.getTime())) : createdAt;

    return {
      key: `inq-${String(i + 1).padStart(2, '0')}`,
      doc: { name, phone, email, message: MESSAGES[Math.floor(rand() * MESSAGES.length)], source: sources[i], status, notes: note, createdAt, updatedAt },
    };
  });
}

// ---------- Extra amenities (3) and floor plans (3); 2 of each stay in draft ----------
export function buildAmenities(now) {
  const base = at(now, 11, 10, 5);
  return [
    { key: 'amn-01', doc: { title: 'Rooftop Sky Garden', description: 'Landscaped terrace with seating and city views', icon: 'Trees', image: '', order: 9, status: 'published', publishedAt: base } },
    { key: 'amn-02', doc: { title: "Children's Play Area", description: 'Safe, shaded play zone for young residents', icon: 'Baby', image: '', order: 10, status: 'draft' } },
    { key: 'amn-03', doc: { title: 'EV Charging Points', description: 'Charging stations in the podium parking', icon: 'Zap', image: '', order: 11, status: 'draft' } },
  ].map(({ key, doc }, i) => ({ key, doc: { ...doc, createdAt: at(now, 11 - i * 2.5, 10, 5), updatedAt: at(now, 6, 9, 22) } }));
}

export function buildFloorPlans(now) {
  const placeholder = (label) => `https://placehold.co/700x600/8B5E3C/FAF7F2?text=${encodeURIComponent(label)}`;
  const plans = [
    { key: 'plan-01', doc: { unitType: '1 BHK Premium', carpetArea: 410, balcony: 70, totalArea: 480, floors: '4-12', order: 3, status: 'published', publishedAt: at(now, 9, 9, 41) } },
    { key: 'plan-02', doc: { unitType: '2 BHK Grande', carpetArea: 640, balcony: 95, totalArea: 735, floors: '9-16', order: 4, status: 'draft' } },
    { key: 'plan-03', doc: { unitType: '3 BHK Penthouse', carpetArea: 820, balcony: 120, totalArea: 940, floors: '15-16', order: 5, status: 'draft' } },
  ];
  return plans.map(({ key, doc }, i) => ({
    key,
    doc: { ...doc, image: placeholder(`${doc.unitType} Floor Plan`), pdfUrl: '', createdAt: at(now, 9 - i * 4, 9, 30), updatedAt: at(now, 1, 18, 5) },
  }));
}

// ---------- Activity log (40 entries over 14 days) ----------
const UPDATED = { create: 'Created', update: 'Updated', delete: 'Deleted', publish: 'Published', unpublish: 'Unpublished' };

// [daysAgo, 'HH:MM', action, entity, label] — entity names match what the admin writes
const inquiryName = (i) => PEOPLE[i];
export const LOG_EVENTS = [
  [13, '09:42', 'update', 'section', 'about'],
  [13, '09:58', 'update', 'section', 'connectivity'],
  [12, '11:15', 'update', 'gallery item', 'Gymnasium / Fitness Center'],
  [12, '11:22', 'update', 'gallery item', 'Yoga & Meditation Area'],
  [12, '16:40', 'update', 'floor plan', '1 BHK Grand'],
  [11, '10:05', 'create', 'amenity', 'Rooftop Sky Garden'],
  [11, '10:09', 'publish', 'amenity', 'Rooftop Sky Garden'],
  [11, '14:30', 'create', 'amenity', "Children's Play Area"],
  [11, '14:36', 'update', 'amenity', "Children's Play Area"],
  [10, '12:10', 'update', 'section', 'footer'],
  [10, '12:25', 'update', 'section', 'rera'],
  [10, '17:02', 'update', 'inquiry', inquiryName(0)],
  [9, '09:30', 'create', 'floor plan', '1 BHK Premium'],
  [9, '09:41', 'publish', 'floor plan', '1 BHK Premium'],
  [9, '15:15', 'create', 'floor plan', '2 BHK Grande'],
  [9, '15:20', 'update', 'floor plan', '2 BHK Grande'],
  [8, '11:48', 'update', 'gallery item', 'Grand Entrance Lobby'],
  [8, '13:05', 'delete', 'gallery item', 'Test Banner'],
  [8, '18:20', 'update', 'inquiry', inquiryName(1)],
  [7, '10:00', 'unpublish', 'section', 'video'],
  [7, '10:26', 'update', 'section', 'video'],
  [7, '10:29', 'publish', 'section', 'video'],
  [6, '09:15', 'create', 'amenity', 'EV Charging Points'],
  [6, '09:22', 'update', 'amenity', 'EV Charging Points'],
  [6, '16:10', 'update', 'inquiry', inquiryName(2)],
  [5, '11:35', 'update', 'section', 'developer'],
  [5, '12:00', 'update', 'section', 'cta'],
  [5, '19:45', 'update', 'inquiry', inquiryName(3)],
  [4, '10:20', 'unpublish', 'amenity', 'Intercom System'],
  [4, '10:45', 'publish', 'amenity', 'Intercom System'],
  [4, '14:55', 'update', 'floor plan', '2 BHK Alto'],
  [3, '09:50', 'update', 'gallery item', 'Ample Parking'],
  [3, '17:30', 'delete', 'inquiry', 'Spam Enquiry'],
  [2, '11:05', 'update', 'inquiry', inquiryName(4)],
  [2, '15:40', 'update', 'section', 'hero'],
  [2, '15:52', 'publish', 'section', 'hero'],
  [1, '10:30', 'update', 'section', 'amenities'],
  [1, '12:15', 'update', 'inquiry', inquiryName(5)],
  [1, '18:05', 'create', 'floor plan', '3 BHK Penthouse'],
  [0, '08:40', 'update', 'inquiry', inquiryName(6)],
];

export async function buildLogs(now, admin) {
  // Point entries at real documents where they exist so they look genuine in the log
  const ids = new Map();
  const remember = (entity, label, id) => ids.set(`${entity}|${label}`, String(id));
  (await Section.find().select('key').lean()).forEach((d) => remember('section', d.key, d._id));
  (await Amenity.find().select('title').lean()).forEach((d) => remember('amenity', d.title, d._id));
  (await GalleryItem.find().select('title').lean()).forEach((d) => remember('gallery item', d.title, d._id));
  (await FloorPlan.find().select('unitType').lean()).forEach((d) => remember('floor plan', d.unitType, d._id));
  (await Inquiry.find().select('name').lean()).forEach((d) => remember('inquiry', d.name, d._id));

  return LOG_EVENTS.map(([daysAgo, time, action, entity, label], i) => {
    const [hh, mm] = time.split(':').map(Number);
    return {
      key: `log-${String(i + 1).padStart(2, '0')}`,
      doc: {
        user: admin._id,
        userEmail: admin.email,
        action,
        entity,
        entityId: ids.get(`${entity}|${label}`) ?? new mongoose.Types.ObjectId().toString(),
        summary: `${UPDATED[action]} ${entity} "${label}"`,
        createdAt: at(now, daysAgo, hh, mm),
      },
    };
  });
}

// ---------- Insert / clear ----------
// Keyed upsert with $setOnInsert: existing demo records are left exactly as they are
async function insertDemo(Model, entries) {
  const result = await Model.collection.bulkWrite(
    entries.map(({ key, doc }) => ({ updateOne: { filter: { demo: key }, update: { $setOnInsert: doc }, upsert: true } })),
    { ordered: false },
  );
  return `${result.upsertedCount} created, ${entries.length - result.upsertedCount} already present`;
}

const MODELS = { inquiries: Inquiry, 'activity logs': ActivityLog, amenities: Amenity, 'floor plans': FloorPlan };

export async function clearDemo() {
  const counts = {};
  for (const [label, Model] of Object.entries(MODELS)) {
    const { deletedCount } = await Model.collection.deleteMany({ demo: { $exists: true } });
    counts[label] = deletedCount;
  }
  return counts;
}

export async function seedDemo({ reset = false, now = new Date() } = {}) {
  if (env.isProd && !process.argv.includes('--force')) {
    throw new Error('Refusing to add demo data with NODE_ENV=production (pass --force if you really mean it)');
  }
  const admin = (await User.findOne({ email: env.seedAdmin.email })) ?? (await User.findOne({ role: 'admin' }));
  if (!admin) throw new Error('No admin user found. Run `npm run seed` first.');

  if (reset) console.log('cleared  :', JSON.stringify(await clearDemo()));

  const summary = {};
  summary.inquiries = await insertDemo(Inquiry, buildInquiries(now));
  summary.amenities = await insertDemo(Amenity, buildAmenities(now));
  summary['floor plans'] = await insertDemo(FloorPlan, buildFloorPlans(now));
  // Logs last so their entityIds can point at the demo amenities, plans and inquiries just inserted
  summary['activity logs'] = await insertDemo(ActivityLog, await buildLogs(now, admin));
  return summary;
}

// CLI
if (process.argv[1]?.endsWith('demo.js')) {
  try {
    if (!env.mongoUri) throw new Error('MONGODB_URI is not set');
    await connectDb();
    if (process.argv.includes('--clear')) {
      const counts = await clearDemo();
      Object.entries(counts).forEach(([label, n]) => console.log(`${label.padEnd(13)}: ${n} removed`));
    } else {
      const summary = await seedDemo({ reset: process.argv.includes('--reset') });
      Object.entries(summary).forEach(([label, text]) => console.log(`${label.padEnd(13)}: ${text}`));
    }
  } catch (err) {
    // Never echo connection strings
    console.error('Demo seed failed:', String(err.message).replace(/mongodb(\+srv)?:\/\/\S+/g, 'mongodb://<redacted>'));
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
