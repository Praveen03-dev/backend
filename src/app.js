import express from 'express';
import cors from 'cors';
import reportRoutes from './routes/report.routes.js';

const app = express();

app.use(
  cors({
    origin: "https://frontend-gjji.onrender.com",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json());

app.get('/health', (req, res) =>
  res.json({ status: 'ok', message: 'Backend running' })
);

app.use('/api/reports', reportRoutes);

export default app;


