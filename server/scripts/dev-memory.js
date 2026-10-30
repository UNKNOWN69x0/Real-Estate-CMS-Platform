// Runs the API against a throwaway in-memory MongoDB (no Atlas needed) and seeds it.
// Usage: npm run dev:memory   — data is lost when the process exits.
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri('one_chembur');
process.env.JWT_SECRET ||= 'dev-only-secret-dev-only-secret-dev-only';
process.env.SEED_ADMIN_PASSWORD ||= 'ChangeMe@123';

const { connectDb } = await import('../src/config/db.js');
const { seed } = await import('../src/seed/seed.js');
const { createApp } = await import('../src/app.js');
const { env } = await import('../src/config/env.js');

await connectDb();
await seed();
const server = createApp().listen(env.port, (err) => {
  if (err) throw err;
  console.log(`In-memory API listening on port ${env.port}`);
});

const shutdown = async () => {
  server.close();
  await mongod.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
