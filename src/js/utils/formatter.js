/* === UTILIDADES DE FORMATO === */

/**
 * Formatea un número como moneda ARS
 * @param {number} value - Valor a formatear
 * @returns {string} HTML con moneda formateada
 */
function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return '<span class="no-data">N/D</span>';
    }
    return '<span class="price-value">$' + value.toLocaleString('es-AR') + '</span>';
}

/**
 * Parsea precio en formato local argentino (179.158,03 -> 179158.03)
 * @param {string|number} priceStr - Precio como string o número
 * @returns {number} Precio parseado
 */
function parseLocalPrice(priceStr) {
    if (!priceStr) return NaN;
    if (typeof priceStr === 'number') return priceStr;

    // Quitar todos los puntos (separadores de miles)
    let cleanedStr = priceStr.replace(/\./g, '');
    // Reemplazar coma por punto (separador decimal)
    cleanedStr = cleanedStr.replace(',', '.');
    // Convertir a Float
    return parseFloat(cleanedStr);
}

/**
 * Extrae ID de MercadoLibre de una URL
 * @param {string} url - URL completa o ID parcial
 * @returns {string} ID de ML
 */
function extractMlId(url) {
    if (!url) return '';
    const ML_PREFIX = 'https://articulo.mercadolibre.com.ar/MLA-';
    if (url.startsWith(ML_PREFIX)) {
        return url.replace(ML_PREFIX, '');
    }
    return url;
}

/**
 * Construye URL completa de ML a partir de ID
 * @param {string} id - ID de publicación
 * @returns {string} URL completa
 */
function buildMlUrl(id) {
    const ML_PREFIX = 'https://articulo.mercadolibre.com.ar/MLA-';
    return ML_PREFIX + id.replace('MLA-', '');
}

/**
 * Calcula porcentaje de diferencia de precio
 * @param {number} myPrice - Mi precio
 * @param {number} compPrice - Precio del competidor
 * @returns {number} Porcentaje de diferencia
 */
function calculatePriceDiff(myPrice, compPrice) {
    if (!myPrice || !compPrice) return 0;
    return ((compPrice - myPrice) / myPrice) * 100;
}

/**
 * Formatea porcentaje con sign
 * @param {number} percent - Porcentaje
 * @returns {string} Porcentaje formateado con + o -
 */
function formatPercent(percent) {
    const sign = percent > 0 ? '+' : '';
    return sign + percent.toFixed(1) + '%';
}

/**
 * Determina clase CSS para diferencia de precio
 * @param {number} percent - Porcentaje
 * @returns {string} Clase CSS ('positive' o 'negative')
 */
function getPriceDiffClass(percent) {
    return percent > 0 ? 'positive' : 'negative';
}
