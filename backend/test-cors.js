import express from 'express';
import cors from 'cors';

const app = express();

// Enable CORS for all origins
app.use(cors({
  origin: true,
  credentials: true
}));

app.get('/test', (req, res) => {
  res.json({ message: 'CORS test successful', origin: req.headers.origin });
});

app.post('/test', (req, res) => {
  res.json({ message: 'POST CORS test successful', origin: req.headers.origin });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Test endpoints:');
  console.log(`- GET http://localhost:${PORT}/test`);
  console.log(`- POST http://localhost:${PORT}/test`);
});
