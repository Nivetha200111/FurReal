import dotenv from 'dotenv';
import { createServer } from 'http';
import { app } from './app.js';

dotenv.config();

const PORT = Number(process.env.PORT || 3001);

const server = createServer(app);

// For Vercel deployment
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, () => {
    console.log(`FurReal server listening on http://localhost:${PORT}`);
  });
}
