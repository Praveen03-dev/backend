import express from 'express';
import cors from 'cors';
import reportRoutes from './routes/report.routes.js';

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://frontend-gjji.onrender.com/',
  'http://localhost:3000', // keep dev
];

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: false
}));

app.use(express.json());

app.get('/health', (req, res) =>
  res.json({ status: 'ok', message: 'Backend running' })
);

app.use('/api/reports', reportRoutes);

export default app;


