const express = require('express');
const axios = require('axios');
const getSupabase = require('../config/supabase');

const router = express.Router();

// Redirige al usuario a la pantalla de autorización de MercadoLibre
router.get('/mercadolibre', (req, res) => {
  const authUrl = 'https://auth.mercadolibre.com.ar/authorization'
    + `?response_type=code`
    + `&client_id=${process.env.ML_APP_ID}`
    + `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}`;

  res.redirect(authUrl);
});

// Callback: recibe el code, intercambia por tokens y guarda en Supabase
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No se recibió el código de autorización' });
  }

  try {
    // Intercambiar code por tokens
    const { data } = await axios.post('https://api.mercadolibre.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: process.env.ML_APP_ID,
      client_secret: process.env.ML_CLIENT_SECRET,
      code,
      redirect_uri: process.env.REDIRECT_URI,
    });

    const { access_token, refresh_token, expires_in, user_id } = data;

    // Calcular fecha de vencimiento
    const fecha_vencimiento_token = new Date(Date.now() + expires_in * 1000).toISOString();

    // Upsert en Supabase
    const supabase = getSupabase();
    const { error } = await supabase
      .from('vendedores_meli')
      .upsert({
        id_vendedor: user_id,
        access_token,
        refresh_token,
        fecha_vencimiento_token,
      }, { onConflict: 'id_vendedor' });

    if (error) {
      console.error('Error guardando en Supabase:', error);
      return res.status(500).json({ error: 'Error guardando tokens en la base de datos' });
    }

    res.json({
      message: 'Autorización exitosa',
      id_vendedor: user_id,
      token_expira: fecha_vencimiento_token,
    });
  } catch (err) {
    console.error('Error en OAuth:', err.response?.data || err.message);
    res.status(500).json({ error: 'Error al obtener tokens de MercadoLibre' });
  }
});

module.exports = router;
