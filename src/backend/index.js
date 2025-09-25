// src/backend/index.js
import express from 'express';

const app = express();
const PORT = 4000;

app.get('/', (req, res) => {
  res.send('Knowledge Base Backend is running 🚀');
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});

