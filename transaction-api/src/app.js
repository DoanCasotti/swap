const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const store = {}; // in-memory transactions

app.post('/transactions', (req, res) => {
  const { user_id, amount, currency } = req.body || {};
  if (!user_id || !amount || !currency) return res.status(400).json({ error: 'invalid payload' });
  const id = `txn_${uuidv4()}`;
  const txn = { id, user_id, amount, currency, status: 'completed', created_at: new Date().toISOString() };
  store[id] = txn;
  // NOTE: webhook to notification service omitted in skeleton
  res.status(201).json(txn);
});

app.get('/transactions/:id', (req, res) => {
  const t = store[req.params.id];
  if (!t) return res.status(404).json({ error: 'not found' });
  res.json(t);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// export app for tests; start server when invoked directly
if (require.main === module) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`transaction-api listening on ${port}`));
}

module.exports = app;
