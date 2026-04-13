/* === MÓDULO DE DASHBOARD === */

class DashboardModule {
    constructor() {
        this.elements = {
            statsGrid: null,
            categoryTabs: null,
            table: null,
            tableBody: null,
            emptyState: null,
        };
        this._initElements();
    }

    /**
     * Inicializa referencias a elementos del DOM
     * @private
     */
    _initElements() {
        this.elements.categoryTabs = document.getElementById('categoryTabs');
        this.elements.table = document.getElementById('productsTable');
        this.elements.tableBody = document.getElementById('tableBody');
        this.elements.emptyState = document.getElementById('emptyState');
    }

    /**
     * Renderiza las pestañas de categoría
     */
    renderTabs() {
        const categories = productsModule.getCategories();
        let html = `<button class="tab-btn ${productsModule.currentCategory === 'Todas' ? 'active' : ''}" data-category="Todas">Todas</button>`;

        categories.forEach(cat => {
            html += `<button class="tab-btn ${productsModule.currentCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</button>`;
        });

        this.elements.categoryTabs.innerHTML = html;

        // Agregar listeners a los botones
        this.elements.categoryTabs.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                productsModule.setCategory(category);
                this.renderTabs();
                this.renderTable();
                this.renderStats();
            });
        });
    }

    /**
     * Renderiza la tabla de productos
     */
    renderTable() {
        const products = productsModule.getFilteredProducts();
        this.elements.tableBody.innerHTML = '';

        if (products.length === 0) {
            this.elements.emptyState.classList.remove('hidden');
            this.elements.table.classList.add('hidden');
            return;
        }

        this.elements.emptyState.classList.add('hidden');
        this.elements.table.classList.remove('hidden');

        products.forEach(product => {
            const tr = document.createElement('tr');
            const competitors = product.competitors || [];
            const status = productsModule.getCompetitionStatus(product);

            let competitorCells = '';
            for (let i = 0; i < CONFIG.MAX_COMPETITORS; i++) {
                const comp = competitors[i];

                if (comp && comp.price && comp.price > 0) {
                    const diffPercent = calculatePriceDiff(product.my_price, comp.price);
                    const diffClass = getPriceDiffClass(diffPercent);
                    const badge = `<span class="price-diff ${diffClass}">${formatPercent(diffPercent)}</span>`;

                    competitorCells += `<td>
                        ${comp.name ? `<span class="comp-name" title="${comp.name}">${comp.name}</span>` : ''}
                        ${formatCurrency(comp.price)}
                        <div style="margin-top:4px;">
                            ${badge} <a href="${comp.url}" target="_blank" class="comp-link"><i data-lucide="external-link"></i> Ver</a>
                        </div>
                    </td>`;
                } else if (comp && comp.url) {
                    competitorCells += `<td>
                        ${comp.name ? `<span class="comp-name" title="${comp.name}">${comp.name}</span>` : ''}
                        <span class="no-data" style="display:block; margin-top:4px;">Sin stock/precio</span>
                        <a href="${comp.url}" target="_blank" class="comp-link" style="margin-top:6px;"><i data-lucide="external-link"></i> Ver</a>
                    </td>`;
                } else {
                    competitorCells += '<td><span class="no-data">N/D</span></td>';
                }
            }

            tr.innerHTML = `
                <td>
                    <div class="product-info">
                        <i data-lucide="box" class="product-icon"></i>
                        <div>
                            <p class="product-name" title="${product.name}">${product.name}</p>
                            <p class="product-sku">${product.sku}</p>
                        </div>
                    </div>
                </td>
                <td><a href="${product.my_url}" target="_blank" class="my-link"><i data-lucide="external-link"></i> Abrir</a></td>
                <td class="col-my-price">${formatCurrency(product.my_price)}</td>
                ${competitorCells}
                <td>
                    <span class="status-badge ${status.class}">
                        <i data-lucide="${status.icon}"></i> ${status.badge}
                    </span>
                </td>
                <td>
                    <div class="header-actions">
                        <button class="btn btn-secondary btn-icon-only" data-edit-id="${product.id}" title="Editar">
                            <i data-lucide="edit-2"></i>
                        </button>
                        <button class="btn btn-danger btn-icon-only" data-delete-id="${product.id}" title="Eliminar">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            `;

            this.elements.tableBody.appendChild(tr);
        });

        lucide.createIcons();

        // Agregar listeners a botones de acción
        this.elements.tableBody.querySelectorAll('[data-edit-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.editId;
                modalModule.openForEdit(id);
            });
        });

        this.elements.tableBody.querySelectorAll('[data-delete-id]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.deleteId;
                if (confirm('¿Está seguro de que desea eliminar este producto?')) {
                    try {
                        await productsModule.deleteProduct(id);
                        this.renderTable();
                        this.renderStats();
                    } catch (error) {
                        alert('Error al eliminar: ' + error.message);
                    }
                }
            });
        });
    }

    /**
     * Renderiza las estadísticas
     */
    renderStats() {
        const stats = productsModule.calculateStats();

        document.getElementById('totalProducts').textContent = stats.total;
        document.getElementById('winningProducts').textContent = stats.winning;
        document.getElementById('losingProducts').textContent = stats.losing;
        document.getElementById('noRefProducts').textContent = stats.noRef;
    }

    /**
     * Renderiza todo el dashboard
     */
    render() {
        this.renderTabs();
        this.renderTable();
        this.renderStats();
    }
}

// Instancia global
const dashboardModule = new DashboardModule();
