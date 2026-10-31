import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin'], default: 'admin' },
    // Sessions issued before this moment are rejected (set when the password changes)
    passwordChangedAt: { type: Date },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);
