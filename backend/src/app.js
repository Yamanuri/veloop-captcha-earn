import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
app.set('trust proxy', config.env === 'production' ? 1 : false); // Render/Railway sit behind one proxy
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => (!origin || config.corsOrigins.includes(origin) ? cb(null, true) : cb(new Error('CORS blocked'))),
  })
);
app.use(express.json({ limit: '10kb' }));
if (config.env !== 'test') app.use(morgan('tiny'));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', globalLimiter, routes);
app.use(notFound);
app.use(errorHandler);

export default app;
