/* === PUNTO DE ENTRADA === */

class App {
    constructor() {
        this.elements = {
            connectionIndicator: document.getElementById('connectionIndicator'),
            connectionText: document.getElementById('connectionText'),
            dbConfigSection: document.getElementById('dbConfigSection'),
            dashboardSection: document.getElementById('dashboardSection'),
            headerActions: document.getElementById('headerActions'),
            supabaseUrl: document.getElementById('supabaseUrl'),
            supabaseKey: document.getElementById('supabaseKey'),
            connectBtn: document.getElementById('connectBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            addProductBtn: document.getElementById('addProductBtn'),
            addProductFromEmptyBtn: document.getElementById('addProductFromEmptyBtn'),
        };
        this._initListeners();
        this._initApp();
    }

    /**
     * Inicializa los listeners
     * @private
     */
    _initListeners() {
        this.elements.connectBtn.addEventListener('click', () => this._handleConnect());
        this.elements.refreshBtn.addEventListener('click', () => this._handleRefresh());
        this.elements.addProductBtn.addEventListener('click', () => modalModule.openForCreate());
        this.elements.addProductFromEmptyBtn.addEventListener('click', () => modalModule.openForCreate());
    }

    /**
     * Inicializa la aplicación
     * @private
     */
    _initApp() {
        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();

            // Intentar auto-conectar si hay credenciales en caché
            if (supabaseService.hasCachedCredentials()) {
                const { url, key } = supabaseService.cachedCredentials;
                this._connectToSupabase(url, key, true);
            }
        });
    }

    /**
     * Maneja la conexión a Supabase
     * @private
     */
    async _handleConnect() {
        const url = this.elements.supabaseUrl.value.trim();
        const key = this.elements.supabaseKey.value.trim();

        if (!url || !key) {
            alert('Por favor, introduce la URL y la Anon Key de Supabase.');
            return;
        }

        this._connectToSupabase(url, key, false);
    }

    /**
     * Conecta a Supabase
     * @private
     */
    async _connectToSupabase(url, key, silent = false) {
        if (!silent) {
            this.elements.connectBtn.disabled = true;
            this.elements.connectBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Conectando...';
            lucide.createIcons();
        }

        try {
            await supabaseService.connect(url, key);

            this.elements.connectionIndicator.classList.add('connected');
            this.elements.connectionIndicator.classList.remove('error');
            this.elements.connectionText.textContent = CONFIG.MESSAGES.CONNECTED;

            this.elements.dbConfigSection.classList.add('hidden');
            this.elements.dashboardSection.classList.remove('hidden');
            this.elements.headerActions.classList.remove('hidden');

            await this._loadDashboard();
        } catch (error) {
            this.elements.connectionIndicator.classList.add('error');
            this.elements.connectionText.textContent = CONFIG.MESSAGES.ERROR;
            alert('Error al conectar: ' + (error.message || 'Verifica tus credenciales'));
        } finally {
            if (!silent) {
                this.elements.connectBtn.disabled = false;
                this.elements.connectBtn.innerHTML = '<i data-lucide="link-2"></i> Conectar y Cargar Datos';
                lucide.createIcons();
            }
        }
    }

    /**
     * Carga el dashboard
     * @private
     */
    async _loadDashboard() {
        try {
            await productsModule.loadProducts();
            dashboardModule.render();
        } catch (error) {
            alert('Error cargando productos: ' + error.message);
        }
    }

    /**
     * Maneja el refresco de datos
     * @private
     */
    async _handleRefresh() {
        this.elements.refreshBtn.disabled = true;
        try {
            await this._loadDashboard();
        } catch (error) {
            alert('Error refrescando datos: ' + error.message);
        } finally {
            this.elements.refreshBtn.disabled = false;
        }
    }
}

// Inicializar app cuando el DOM está listo
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    lucide.createIcons();
});
