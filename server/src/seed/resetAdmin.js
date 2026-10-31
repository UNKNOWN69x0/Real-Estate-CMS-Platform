/*
 * Emergency admin password reset, for when you're locked out.
 *
 *   bash:        ADMIN_NEW_PASSWORD='a-new-long-password' npm run reset-admin
 *   PowerShell:  $env:ADMIN_NEW_PASSWORD='a-new-long-password'; npm run reset-admin
 *
 * Runs against whatever MONGODB_URI points to. The password comes only from the ADMIN_NEW_PASSWORD
 * environment variable and is never printed or logged. Every existing session is signed out.
 * Targets SEED_ADMIN_EMAIL (default admin@onechembur.com), or the first admin if that account doesn't exist.
 */
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDb } from '../config/db.js';
import { BCRYPT_ROUNDS, passwordProblem } from '../config/password.js';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';

export async function resetAdminPassword(newPassword) {
  const problem = passwordProblem(newPassword);
  if (problem) throw new Error(`ADMIN_NEW_PASSWORD is not acceptable: ${problem}`);

  const admin = (await User.findOne({ email: env.seedAdmin.email })) ?? (await User.findOne({ role: 'admin' }));
  if (!admin) throw new Error('No admin user found. Run `npm run seed` first.');

  admin.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  admin.passwordChangedAt = new Date();
  await admin.save();

  // Audit trail without any password data
  await ActivityLog.create({
    user: admin._id,
    userEmail: admin.email,
    action: 'update',
    entity: 'user',
    entityId: String(admin._id),
    summary: 'Reset password via reset-admin script',
  });
  return admin.email;
}

if (process.argv[1]?.endsWith('resetAdmin.js')) {
  try {
    if (!env.mongoUri) throw new Error('MONGODB_URI is not set');
    if (!process.env.ADMIN_NEW_PASSWORD) {
      throw new Error('Set the ADMIN_NEW_PASSWORD environment variable (see the usage notes at the top of this file)');
    }
    await connectDb();
    const email = await resetAdminPassword(process.env.ADMIN_NEW_PASSWORD);
    console.log(`Password updated for ${email}. All existing sessions were signed out.`);
    console.log('Remove ADMIN_NEW_PASSWORD from your environment and shell history now.');
  } catch (err) {
    // Never echo connection strings
    console.error('reset-admin failed:', String(err.message).replace(/mongodb(\+srv)?:\/\/\S+/g, 'mongodb://<redacted>'));
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
