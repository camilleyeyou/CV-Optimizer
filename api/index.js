// Vercel Serverless Function entry point — wraps the Express app
const path = require('path');

// Load env vars from server/.env (local dev only; Vercel uses dashboard env vars)
try {
  require(path.resolve(__dirname, '../server/node_modules/dotenv')).config({
    path: path.resolve(__dirname, '../server/.env'),
  });
} catch {
  // dotenv not available or .env missing — fine in production (env vars come from Vercel dashboard)
}

const app = require('../server/src/server');

module.exports = app;
