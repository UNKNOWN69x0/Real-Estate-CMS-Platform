import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDb } from '../config/db.js';
import { User } from '../models/User.js';
import { Section } from '../models/Section.js';
import { Amenity } from '../models/Amenity.js';
import { GalleryItem } from '../models/GalleryItem.js';
import { FloorPlan } from '../models/FloorPlan.js';
import { sections, amenities, gallery, floorPlans } from './content.js';

/**
 * Upserts content by natural key. By default existing documents are left untouched so
 * re-running the seed never overwrites edits made in the admin panel; pass reset=true to overwrite.
 */
async function upsertAll(Model, docs, keyField, reset) {
  const now = new Date();
  const ops = docs.map((doc) => {
    const withStatus = { status: 'published', publishedAt: now, ...doc };
    return {
      updateOne: {
        filter: { [keyField]: doc[keyField] },
        update: reset ? { $set: withStatus } : { $setOnInsert: withStatus },
        upsert: true,
      },
    };
  });
  const result = await Model.bulkWrite(ops);
  return `${result.upsertedCount} created, ${result.modifiedCount} overwritten`;
}

export async function seed({ reset = false } = {}) {
  const { email, name, password } = env.seedAdmin;
  if (!password) throw new Error('Set SEED_ADMIN_PASSWORD in server/.env before seeding');

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ email });
  if (existing) {
    if (reset) await User.updateOne({ _id: existing._id }, { passwordHash, name });
    console.log(`admin user: ${email} ${reset ? '(password reset)' : '(already exists)'}`);
  } else {
    await User.create({ name, email, passwordHash, role: 'admin' });
    console.log(`admin user: ${email} (created)`);
  }

  console.log('sections   :', await upsertAll(Section, sections, 'key', reset));
  console.log('amenities  :', await upsertAll(Amenity, amenities, 'title', reset));
  console.log('gallery    :', await upsertAll(GalleryItem, gallery, 'title', reset));
  console.log('floor plans:', await upsertAll(FloorPlan, floorPlans, 'unitType', reset));
}

// CLI: `npm run seed` (keep edits) or `npm run seed -- --reset` (overwrite seeded content)
if (process.argv[1]?.endsWith('seed.js')) {
  try {
    if (!env.mongoUri) throw new Error('MONGODB_URI is not set');
    await connectDb();
    await seed({ reset: process.argv.includes('--reset') });
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
