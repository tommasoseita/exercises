import express from 'express';
import cors from 'cors';
import path from 'path';
import exercisesRouter from './routes/exercises';
import chatRouter from './routes/chat';
import scormRouter from './routes/scorm';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (origin, callback) => {
        if (!origin
          || origin === 'https://frontend-production-bd08.up.railway.app'
          || /\.up\.railway\.app$/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : true,
}));
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/exercises', exercisesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/scorm', scormRouter);

// Serve frontend in production
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
