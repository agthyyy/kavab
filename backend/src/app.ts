import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRouter from './routes/auth';
import contentRouter from './routes/content';
import progressRouter from './routes/progress';
import adminRouter from './routes/admin';
import notificationsRouter from './routes/notifications';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/content', contentRouter);
app.use('/api/progress', progressRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);

// Error handler (must be last)
app.use(errorHandler);

export default app;
