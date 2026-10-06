require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const { startScheduler } = require('./scheduler');
const appointmentRoutes = require('./routes/appointments');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/appointments', appointmentRoutes);

// In production, serve the built React app from the same server.
const dist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

(async () => {
  try {
    await initDb();
    startScheduler();
    app.listen(PORT, () => console.log(`[server] listening on port ${PORT}`));
  } catch (err) {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  }
})();
