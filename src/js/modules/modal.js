/* === MÓDULO DE MODAL === */

class ModalModule {
    constructor() {
        this.isEditing = false;
        this.currentProductId = null;
        this.elements = {
            overlay: document.getElementById('modalOverlay'),
            modal: document.querySelector('.modal'),
            title: document.getElementById('modalTitle'),
            productId: document.getElementById('productId'),
            productName: document.getElementById('productName'),
            productCategory: document.getElementById('productCategory'),
            productSku: document.getElementById('productSku'),
            myPrice: document.getElementById('myPrice'),
            myUrl: document.getElementById('myUrl'),
            competitorContainer: document.getElementById('competitorLinksContainer'),
            saveBtn: document.getElementById('saveBtn'),
            closeBtn: document.getElementById('modalCloseBtn'),
            cancelBtn: document.getElementById('modalCancelBtn'),
        };
        this._initListeners();
    }

    /**
     * Inicializa listeners del modal
     * @private
     */
    _initListeners() {
        this.elements.closeBtn.addEventListener('click', () => this.close());
        this.elements.cancelBtn.addEventListener('click', () => this.close());
        this.elements.saveBtn.addEventListener('click', () => this.save());

        // Cerrar modal al hacer click fuera
        this.elements.overlay.addEventListener('click', (e) => {
            if (e.target === this.elements.overlay) {
                this.close();
            }
        });
    }

    /**
     * Abre modal para crear nuevo producto
     */
    openForCreate() {
        this.isEditing = false;
        this.currentProductId = null;
        this.elements.title.textContent = 'Agregar Producto';
        this._clearForm();
        this._renderCompetitorFields();
        this.elements.overlay.classList.add('open');
        this.elements.productName.focus();
    }

    /**
     * Abre modal para editar producto
     * @param {string} productId
     */
    openForEdit(productId) {
        this.isEditing = true;
        this.currentProductId = productId;
        const product = productsModule.products.find(p => p.id === productId);

        if (!product) {
            alert('Producto no encontrado');
            return;
        }

        this.elements.title.textContent = 'Editar Producto';
        this._clearForm();
        this._renderCompetitorFields();

        // Llenar formulario
        this.elements.productId.value = product.id;
        this.elements.productName.value = product.name;
        this.elements.productCategory.value = product.category || 'General';
        this.elements.productSku.value = product.sku;
        this.elements.myPrice.value = product.my_price;
        this.elements.myUrl.value = extractMlId(product.my_url);

        const competitors = product.competitors || [];
        for (let i = 0; i < CONFIG.MAX_COMPETITORS; i++) {
            const comp = competitors[i] || {};
            document.getElementById(`compName_${i + 1}`).value = comp.name || '';
            document.getElementById(`compUrl_${i + 1}`).value = extractMlId(comp.url || '');
            document.getElementById(`compPrice_${i + 1}`).value = comp.price || '';
        }

        this.elements.overlay.classList.add('open');
    }

    /**
     * Abre el modal
     */
    open() {
        this.openForCreate();
    }

    /**
     * Cierra el modal
     */
    close() {
        this.elements.overlay.classList.remove('open');
        this._clearForm();
    }

    /**
     * Limpia el formulario
     * @private
     */
    _clearForm() {
        this.elements.productId.value = '';
        this.elements.productName.value = '';
        this.elements.productCategory.value = '';
        this.elements.productSku.value = '';
        this.elements.myPrice.value = '';
        this.elements.myUrl.value = '';
    }

    /**
     * Renderiza campos de competidores
     * @private
     */
    _renderCompetitorFields() {
        let html = '';

        for (let i = 1; i <= CONFIG.MAX_COMPETITORS; i++) {
            html += `
                <div class="comp-field-row">
                    <p class="comp-title"><i data-lucide="target"></i> Competidor ${i}</p>

                    <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label">Nombre</label>
                        <input type="text" id="compName_${i}" class="input-control" placeholder="Ej: TiendaOficial">
                    </div>

                    <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label">ID Publicación (ML)</label>
                        <div class="input-group">
                            <span class="input-group-addon" style="padding: 0 0.5rem;">MLA-</span>
                            <input type="text" id="compUrl_${i}" class="input-control" placeholder="123456789">
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label">Precio ($)</label>
                        <input type="text" id="compPrice_${i}" class="input-control" placeholder="Ej: 179.158,03">
                    </div>
                </div>
            `;
        }

        this.elements.competitorContainer.innerHTML = html;
        lucide.createIcons();
    }

    /**
     * Valida y guarda el producto
     */
    async save() {
        // Validar campos obligatorios
        const name = this.elements.productName.value.trim();
        const category = this.elements.productCategory.value.trim() || 'General';
        const sku = this.elements.productSku.value.trim();
        const myUrlInput = this.elements.myUrl.value.trim();
        const myPrice = parseLocalPrice(this.elements.myPrice.value.trim());

        if (!name || !sku || !myUrlInput || isNaN(myPrice)) {
            alert('Por favor, rellena los campos obligatorios (*) correctamente.');
            return;
        }

        // Construir datos del producto
        const productData = {
            name,
            category,
            sku,
            my_url: buildMlUrl(myUrlInput),
            my_price: myPrice,
            competitors: [],
        };

        // Validar y procesar competidores
        for (let i = 1; i <= CONFIG.MAX_COMPETITORS; i++) {
            const cName = document.getElementById(`compName_${i}`).value.trim();
            const cUrlInput = document.getElementById(`compUrl_${i}`).value.trim();
            const cPrice = parseLocalPrice(document.getElementById(`compPrice_${i}`).value.trim());

            if (cUrlInput) {
                productData.competitors.push({
                    name: cName || null,
                    url: buildMlUrl(cUrlInput),
                    price: isNaN(cPrice) ? null : cPrice,
                });
            } else if (cName || (!isNaN(cPrice))) {
                alert(`El competidor ${i} tiene datos pero le falta el ID de Publicación.`);
                return;
            }
        }

        // Guardar
        this.elements.saveBtn.disabled = true;
        this.elements.saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';
        lucide.createIcons();

        try {
            if (this.isEditing) {
                await productsModule.updateProduct(this.currentProductId, productData);
            } else {
                await productsModule.createProduct(productData);
            }

            this.close();
            dashboardModule.render();
        } catch (error) {
            alert('Error al guardar: ' + error.message);
        } finally {
            this.elements.saveBtn.disabled = false;
            this.elements.saveBtn.innerHTML = '<i data-lucide="save"></i> Guardar Producto';
            lucide.createIcons();
        }
    }
}

// Instancia global
const modalModule = new ModalModule();
