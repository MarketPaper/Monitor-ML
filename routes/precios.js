const express = require('express');
const mlAuth = require('../middleware/mlAuth');
const aumentarPrecio = require('../services/precioService');

const router = express.Router();

// POST /api/precios/:id_vendedor/aumentar
// Body: { "itemId": "MLA12345678", "porcentajeAumento": 10 }
router.post('/:id_vendedor/aumentar', mlAuth, async (req, res) => {
  const { itemId, porcentajeAumento } = req.body;

  if (!itemId || porcentajeAumento === undefined) {
    return res.status(400).json({ error: 'Se requieren itemId y porcentajeAumento' });
  }

  if (typeof porcentajeAumento !== 'number' || porcentajeAumento <= 0) {
    return res.status(400).json({ error: 'porcentajeAumento debe ser un número mayor a 0' });
  }

  try {
    const resultado = await aumentarPrecio(itemId, porcentajeAumento, req.ml_access_token);
    res.json(resultado);
  } catch (err) {
    console.error('Error en aumento de precio:', err.message);
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;
