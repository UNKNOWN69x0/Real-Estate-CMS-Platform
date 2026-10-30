import { assertRequiredEnv, env } from './config/env.js';
import { connectDb } from './config/db.js';
import { createApp } from './app.js';

assertRequiredEnv();
await connectDb();

// Express 5 passes listen errors (e.g. EADDRINUSE) to this callback instead of throwing
createApp().listen(env.port, (err) => {
  if (err) throw err;
  console.log(`API listening on port ${env.port} (${env.isProd ? 'production' : 'development'})`);
});
