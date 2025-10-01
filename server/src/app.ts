import express from 'express';
import cors from 'cors';
import { router } from './routes.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', router);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Basic error handler
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});
