import mongoose from 'mongoose';
import { assertRequiredEnv, env } from './config/env.js';
import { connectDb } from './config/db.js';
import { createApp } from './app.js';

assertRequiredEnv();
await connectDb();

// Express 5 passes listen errors (e.g. EADDRINUSE) to this callback instead of throwing
const server = createApp().listen(env.port, (err) => {
  if (err) throw err;
  console.log(`API listening on port ${env.port} (${env.isProd ? 'production' : 'development'})`);
});

// Render sends SIGTERM on every deploy: stop taking new requests, finish in-flight ones, close the database
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down`);
  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Log unexpected failures instead of dying silently; an uncaught exception leaves the process in an unknown state, so exit
process.on('unhandledRejection', (reason) => console.error('Unhandled promise rejection:', reason));
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});
