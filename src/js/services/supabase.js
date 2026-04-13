/* === SERVICIO DE SUPABASE === */

class SupabaseService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.cachedCredentials = this._loadCachedCredentials();
    }

    /**
     * Carga credenciales del localStorage
     * @private
     */
    _loadCachedCredentials() {
        return {
            url: localStorage.getItem('sb_url'),
            key: localStorage.getItem('sb_key'),
        };
    }

    /**
     * Guarda credenciales en localStorage
     * @private
     */
    _saveCachedCredentials(url, key) {
        localStorage.setItem('sb_url', url);
        localStorage.setItem('sb_key', key);
        this.cachedCredentials = { url, key };
    }

    /**
     * Conecta a Supabase
     * @param {string} url - URL de Supabase
     * @param {string} key - Anon key
     * @returns {Promise<boolean>} True si se conectó exitosamente
     */
    async connect(url, key) {
        try {
            this.client = window.supabase.createClient(url, key);

            // Validar conexión
            const { error } = await this.client
                .from(CONFIG.TABLE_NAME)
                .select('id')
                .limit(1);

            if (error) throw error;

            this._saveCachedCredentials(url, key);
            this.isConnected = true;
            return true;
        } catch (error) {
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Desconecta de Supabase
     */
    disconnect() {
        this.client = null;
        this.isConnected = false;
        localStorage.removeItem('sb_url');
        localStorage.removeItem('sb_key');
    }

    /**
     * Obtiene todos los productos
     * @returns {Promise<Array>} Array de productos
     */
    async getAllProducts() {
        if (!this.client) throw new Error('No conectado a Supabase');

        const { data, error } = await this.client
            .from(CONFIG.TABLE_NAME)
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Obtiene un producto por ID
     * @param {string} id - ID del producto
     * @returns {Promise<Object>} Producto
     */
    async getProductById(id) {
        if (!this.client) throw new Error('No conectado a Supabase');

        const { data, error } = await this.client
            .from(CONFIG.TABLE_NAME)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Crea un nuevo producto
     * @param {Object} product - Datos del producto
     * @returns {Promise<Object>} Producto creado
     */
    async createProduct(product) {
        if (!this.client) throw new Error('No conectado a Supabase');

        const { data, error } = await this.client
            .from(CONFIG.TABLE_NAME)
            .insert([{
                ...product,
                id: Date.now().toString(),
                updated_at: new Date().toISOString(),
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Actualiza un producto
     * @param {string} id - ID del producto
     * @param {Object} updates - Cambios a realizar
     * @returns {Promise<Object>} Producto actualizado
     */
    async updateProduct(id, updates) {
        if (!this.client) throw new Error('No conectado a Supabase');

        const { data, error } = await this.client
            .from(CONFIG.TABLE_NAME)
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Elimina un producto
     * @param {string} id - ID del producto
     * @returns {Promise<void>}
     */
    async deleteProduct(id) {
        if (!this.client) throw new Error('No conectado a Supabase');

        const { error } = await this.client
            .from(CONFIG.TABLE_NAME)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Indica si hay credenciales en caché
     * @returns {boolean}
     */
    hasCachedCredentials() {
        return !!(this.cachedCredentials.url && this.cachedCredentials.key);
    }
}

// Instancia global
const supabaseService = new SupabaseService();
