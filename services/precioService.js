const axios = require('axios');

const ML_API = 'https://api.mercadolibre.com';

/**
 * Aumenta el precio de un ítem de MercadoLibre de forma inteligente.
 * Si el ítem tiene promociones activas, actualiza el precio dentro de la promoción
 * manteniendo el porcentaje de descuento. Si no tiene, actualiza el precio base directamente.
 *
 * @param {string} itemId       - ID del ítem (ej: "MLA12345678")
 * @param {number} porcentajeAumento - Porcentaje a aumentar (ej: 10 = +10%)
 * @param {string} accessToken  - Access token válido del vendedor
 * @returns {object} Resultado con precio anterior, nuevo precio y modo de actualización
 */
async function aumentarPrecio(itemId, porcentajeAumento, accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  // 1. Consultar el ítem actual
  let item;
  try {
    const { data } = await axios.get(`${ML_API}/items/${itemId}`, { headers });
    item = data;
  } catch (err) {
    const detalle = err.response?.data?.message || err.message;
    throw new Error(`No se pudo obtener el ítem ${itemId}: ${detalle}`);
  }

  const tienePromocion = Array.isArray(item.promotions) && item.promotions.length > 0;

  if (tienePromocion) {
    return await aumentarConPromocion(item, porcentajeAumento, headers);
  } else {
    return await aumentarSinPromocion(item, porcentajeAumento, headers);
  }
}

// ─── Caso: ítem SIN promoción ────────────────────────────────────────────────

async function aumentarSinPromocion(item, porcentajeAumento, headers) {
  const precioActual = item.price;
  const nuevoPrecio = redondear(precioActual * (1 + porcentajeAumento / 100));

  try {
    await axios.put(
      `${ML_API}/items/${item.id}`,
      { price: nuevoPrecio },
      { headers }
    );
  } catch (err) {
    const detalle = err.response?.data?.message || err.message;
    throw new Error(`Error actualizando precio de ${item.id}: ${detalle}`);
  }

  return {
    itemId: item.id,
    modo: 'precio_base',
    precioAnterior: precioActual,
    nuevoPrecio,
    porcentajeAplicado: porcentajeAumento,
  };
}

// ─── Caso: ítem CON promoción ────────────────────────────────────────────────

async function aumentarConPromocion(item, porcentajeAumento, headers) {
  // original_price es el precio base antes del descuento de la promoción
  const precioBase = item.original_price ?? item.price;
  const precioConDescuento = item.price;

  // Calcular el porcentaje de descuento actual para preservarlo
  const descuentoPct = precioBase > 0
    ? (precioBase - precioConDescuento) / precioBase
    : 0;

  // Nuevo precio base con el aumento aplicado
  const nuevoPrecioBase = redondear(precioBase * (1 + porcentajeAumento / 100));

  // Nuevo precio de deal manteniendo el mismo % de descuento
  const nuevoPrecioDeal = redondear(nuevoPrecioBase * (1 - descuentoPct));

  // Obtener el ID de la primera promoción activa
  const promocion = item.promotions[0];
  const promotionId = promocion.id;

  try {
    // Actualizar el precio base del ítem
    await axios.put(
      `${ML_API}/items/${item.id}`,
      { original_price: nuevoPrecioBase },
      { headers }
    );
  } catch (err) {
    const detalle = err.response?.data?.message || err.message;
    throw new Error(`Error actualizando precio base de ${item.id}: ${detalle}`);
  }

  try {
    // Actualizar el deal_price dentro de la promoción
    await axios.put(
      `${ML_API}/seller-promotions/${promotionId}/items/${item.id}`,
      { deal_price: nuevoPrecioDeal },
      { headers }
    );
  } catch (err) {
    const detalle = err.response?.data?.message || err.message;
    throw new Error(`Error actualizando precio de promoción ${promotionId} para ${item.id}: ${detalle}`);
  }

  return {
    itemId: item.id,
    modo: 'con_promocion',
    promotionId,
    descuentoPreservado: `${(descuentoPct * 100).toFixed(1)}%`,
    precioBaseAnterior: precioBase,
    nuevoPrecioBase,
    precioPromocionAnterior: precioConDescuento,
    nuevoPrecioDeal,
    porcentajeAplicado: porcentajeAumento,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Redondea al entero más cercano (ML no acepta decimales en precios AR)
function redondear(precio) {
  return Math.round(precio);
}

module.exports = aumentarPrecio;
