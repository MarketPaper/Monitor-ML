require('dotenv').config();
const express = require('express');
const getSupabase = require('./config/supabase');

const authRoutes = require('./routes/auth');
const preciosRoutes = require('./routes/precios');
const mlAuth = require('./middleware/mlAuth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Monitor ML API corriendo' });
});

app.use('/auth', authRoutes);
app.use(authRoutes);

app.use('/api/precios', preciosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
