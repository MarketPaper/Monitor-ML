/* === MÓDULO DE PRODUCTOS === */

class ProductsModule {
    constructor() {
        this.products = [];
        this.currentCategory = 'Todas';
    }

    /**
     * Carga todos los productos
     * @returns {Promise<Array>}
     */
    async loadProducts() {
        try {
            this.products = await supabaseService.getAllProducts();
            return this.products;
        } catch (error) {
            console.error('Error cargando productos:', error);
            throw error;
        }
    }

    /**
     * Obtiene productos filtrados por categoría
     * @returns {Array}
     */
    getFilteredProducts() {
        if (this.currentCategory === 'Todas') {
            return this.products;
        }
        return this.products.filter(p => (p.category || 'General') === this.currentCategory);
    }

    /**
     * Obtiene categorías únicas
     * @returns {Array}
     */
    getCategories() {
        return [...new Set(this.products.map(p => p.category || 'General'))];
    }

    /**
     * Cambia categoría activa
     * @param {string} category
     */
    setCategory(category) {
        this.currentCategory = category;
    }

    /**
     * Crea un nuevo producto
     * @param {Object} productData
     * @returns {Promise<Object>}
     */
    async createProduct(productData) {
        try {
            const product = await supabaseService.createProduct(productData);
            this.products.push(product);
            return product;
        } catch (error) {
            console.error('Error creando producto:', error);
            throw error;
        }
    }

    /**
     * Actualiza un producto
     * @param {string} id
     * @param {Object} updates
     * @returns {Promise<Object>}
     */
    async updateProduct(id, updates) {
        try {
            const updatedProduct = await supabaseService.updateProduct(id, updates);
            const index = this.products.findIndex(p => p.id === id);
            if (index !== -1) {
                this.products[index] = updatedProduct;
            }
            return updatedProduct;
        } catch (error) {
            console.error('Error actualizando producto:', error);
            throw error;
        }
    }

    /**
     * Elimina un producto
     * @param {string} id
     * @returns {Promise<void>}
     */
    async deleteProduct(id) {
        try {
            await supabaseService.deleteProduct(id);
            this.products = this.products.filter(p => p.id !== id);
        } catch (error) {
            console.error('Error eliminando producto:', error);
            throw error;
        }
    }

    /**
     * Calcula estadísticas de competencia
     * @returns {Object} Estadísticas
     */
    calculateStats() {
        const filtered = this.getFilteredProducts();
        let winning = 0;
        let losing = 0;
        let noRef = 0;

        filtered.forEach(product => {
            const competitors = product.competitors || [];
            const activePrices = competitors
                .map(c => c.price)
                .filter(p => p !== null && p > 0);

            if (activePrices.length === 0) {
                noRef++;
            } else {
                const minCompPrice = Math.min(...activePrices);
                product.my_price <= minCompPrice ? winning++ : losing++;
            }
        });

        return {
            total: filtered.length,
            winning,
            losing,
            noRef,
        };
    }

    /**
     * Obtiene el estado de competencia de un producto
     * @param {Object} product
     * @returns {Object} Estado con badge y clase CSS
     */
    getCompetitionStatus(product) {
        const competitors = product.competitors || [];
        const activePrices = competitors
            .map(c => c.price)
            .filter(p => p !== null && p > 0);

        if (activePrices.length === 0) {
            return {
                badge: 'Sin Referencia',
                class: 'badge-losing',
                icon: 'help-circle',
            };
        }

        const minCompPrice = Math.min(...activePrices);
        if (product.my_price <= minCompPrice) {
            return {
                badge: 'LÍDER DE PRECIO',
                class: 'badge-winning',
                icon: 'award',
            };
        } else {
            return {
                badge: 'PRECIO ALTO',
                class: 'badge-losing',
                icon: 'alert-triangle',
            };
        }
    }
}

// Instancia global
const productsModule = new ProductsModule();
