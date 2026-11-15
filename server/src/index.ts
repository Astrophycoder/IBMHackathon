import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import member4Routes from './routes/member4';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT ?? '4000', 10);

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Member 4 routes — matching, search, radar, assistant
app.use('/api', member4Routes);

app.listen(PORT, () => {
  console.log(`MORETOGETHER API running on http://localhost:${PORT}`);
});

export default app;
