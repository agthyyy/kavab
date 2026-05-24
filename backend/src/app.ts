import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

import authRouter from './routes/auth';
import contentRouter from './routes/content';
import progressRouter from './routes/progress';
import adminRouter from './routes/admin';
import notificationsRouter from './routes/notifications';
import rankingRouter from './routes/ranking';
import rolesRouter from './routes/roles';
import gamificationRouter from './routes/gamification';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Статическая раздача загруженных файлов
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
app.use('/api/ranking', rankingRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/gamification', gamificationRouter);

// Error handler (must be last)
app.use(errorHandler);

export default app;
