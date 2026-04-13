const axios = require('axios');
const getSupabase = require('../config/supabase');

const MARGEN_RENOVACION_MS = 30 * 60 * 1000; // 30 minutos

async function verificarYRenovarToken(id_vendedor) {
  const supabase = getSupabase();

  // Buscar el vendedor en la base de datos
  const { data: vendedor, error } = await supabase
    .from('vendedores_meli')
    .select('access_token, refresh_token, fecha_vencimiento_token')
    .eq('id_vendedor', id_vendedor)
    .single();

  if (error || !vendedor) {
    throw new Error(`Vendedor ${id_vendedor} no encontrado en la base de datos`);
  }

  const ahora = Date.now();
  const vencimiento = new Date(vendedor.fecha_vencimiento_token).getTime();
  const tokenVigente = vencimiento - ahora > MARGEN_RENOVACION_MS;

  if (tokenVigente) {
    return vendedor.access_token;
  }

  // Renovar token
  const { data } = await axios.post('https://api.mercadolibre.com/oauth/token', {
    grant_type: 'refresh_token',
    client_id: process.env.ML_APP_ID,
    client_secret: process.env.ML_CLIENT_SECRET,
    refresh_token: vendedor.refresh_token,
  });

  const fecha_vencimiento_token = new Date(Date.now() + data.expires_in * 1000).toISOString();

  // Actualizar tokens en Supabase
  const { error: updateError } = await supabase
    .from('vendedores_meli')
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      fecha_vencimiento_token,
    })
    .eq('id_vendedor', id_vendedor);

  if (updateError) {
    throw new Error(`Error actualizando tokens del vendedor ${id_vendedor}: ${updateError.message}`);
  }

  console.log(`Token renovado para vendedor ${id_vendedor}, vence: ${fecha_vencimiento_token}`);
  return data.access_token;
}

module.exports = verificarYRenovarToken;
