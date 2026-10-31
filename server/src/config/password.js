// One place for password hashing cost and rules, shared by the API, the seed and reset-admin.

// Same cost the seed script has always used
export const BCRYPT_ROUNDS = 12;

export const MIN_PASSWORD_LENGTH = 10;
// bcrypt only reads the first 72 bytes; reject longer input instead of silently truncating it
export const MAX_PASSWORD_BYTES = 72;

/** Returns a human-readable problem with a new password, or null if it is acceptable. */
export function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    return `Must be ${MAX_PASSWORD_BYTES} bytes or fewer (shorter if it uses emoji or accented characters)`;
  }
  return null;
}
