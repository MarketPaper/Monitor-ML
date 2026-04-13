/* === CONFIGURACIÓN GLOBAL === */

// Nota: Las credenciales reales deben ir en un .env
// Este archivo es para constantes y configuración NO sensible

const CONFIG = {
    // URLs y endpoints
    ML_API_BASE: 'https://api.mercadolibre.com',
    ML_SITE: 'https://articulo.mercadolibre.com.ar',

    // Tabla en Supabase
    TABLE_NAME: 'ml_products',

    // Límites y constantes
    MAX_COMPETITORS: 4,
    PRICE_FETCH_DELAY_MS: 1500,  // Delay para scraper (evitar detección)
    MODAL_ANIMATION_TIME: 300,

    // Mensajes
    MESSAGES: {
        CONNECTING: 'Conectando...',
        CONNECTED: 'Conectado',
        ERROR: 'Error',
        SAVING: 'Guardando...',
        LOADING: 'Cargando...',
    },
};

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
