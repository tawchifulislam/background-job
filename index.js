import express from 'express';
import { randomUUID } from 'node:crypto';
import { serve } from 'inngest/express';
import { inngest, functions } from './inngest.js';
import { reports } from './store.js';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/reports', async (req, res) => {
  const { topic } = req.body;
  const id = randomUUID();

  reports.set(id, { id, topic, status: 'pending' });

  await inngest.send({
    name: 'report/requested',
    data: { id, topic },
  });

  res.status(202).json({ id, status: 'pending' });
});

app.get('/reports/:id', (req, res) => {
  const report = reports.get(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
});

app.use('/api/inngest', serve({ client: inngest, functions }));

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
