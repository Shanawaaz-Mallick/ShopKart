// Keep the Express app visible at the repository root so Vercel can detect it.
// The existing API implementation remains in Server/index.js.
import express from 'express';
import shopKartApp from './Server/index.js';

const app = express();
app.use(shopKartApp);

export default app;
