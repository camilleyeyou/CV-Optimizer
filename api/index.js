// Vercel Serverless Function entry point
// Env vars are set via Vercel dashboard, dotenv is only for local dev
const app = require('../server/src/server');

module.exports = app;
