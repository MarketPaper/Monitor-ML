# Frontend - Monitor ML

Interfaz web modular para el monitor de precios de MercadoLibre Argentina.

## Estructura

### `index.html`
Archivo HTML limpio. Contiene:
- Cabecera con estado de conexión y acciones
- Sección de configuración de BD (formulario inicial)
- Dashboard con estadísticas, pestañas de categoría, tabla de productos
- Modal para CRUD (crear/editar productos)
- Scripts importados en orden correcto

### `assets/styles/`
CSS modular y reutilizable:

- **`theme.css`** — Variables CSS (colores, tipografía, sombras, bordes)
- **`base.css`** — Reset, estilos base, tipografía
- **`layout.css`** — Estructura (header, main, db-config, responsive)
- **`components.css`** — Componentes reutilizables (botones, inputs, tarjetas, tablas, modales)

### `js/`
JavaScript orientado a objetos, sin transpilación.

#### `config.js`
Constantes y configuración global:
```javascript
CONFIG.ML_API_BASE
CONFIG.TABLE_NAME
CONFIG.MAX_COMPETITORS
CONFIG.MESSAGES
// etc
```

#### `utils/formatter.js`
Funciones helper para formato:
- `formatCurrency(value)` — Formatea dinero ARS
- `parseLocalPrice(str)` — Parsea "179.158,03" → 179158.03
- `extractMlId(url)` — Extrae ID de URL ML
- `buildMlUrl(id)` — Construye URL ML desde ID
- `calculatePriceDiff()`, `formatPercent()`, etc

#### `services/supabase.js`
**Clase `SupabaseService`** — Encapsula toda la comunicación con BD:
```javascript
supabaseService.connect(url, key)
supabaseService.getAllProducts()
supabaseService.createProduct(data)
supabaseService.updateProduct(id, updates)
supabaseService.deleteProduct(id)
// etc
```

#### `modules/products.js`
**Clase `ProductsModule`** — Lógica de negocio de productos:
```javascript
productsModule.loadProducts()
productsModule.getFilteredProducts()
productsModule.getCategories()
productsModule.createProduct(data)
productsModule.calculateStats()
productsModule.getCompetitionStatus(product)
// etc
```

#### `modules/dashboard.js`
**Clase `DashboardModule`** — Renderiza UI:
```javascript
dashboardModule.renderTabs()
dashboardModule.renderTable()
dashboardModule.renderStats()
dashboardModule.render()  // todos
```

#### `modules/modal.js`
**Clase `ModalModule`** — Gestiona el formulario CRUD:
```javascript
modalModule.openForCreate()
modalModule.openForEdit(productId)
modalModule.save()
modalModule.close()
```

#### `main.js`
**Clase `App`** — Punto de entrada, orquesta todo:
- Inicializa listeners
- Maneja conexión a Supabase
- Carga dashboard
- Coordina módulos

## Cómo usar

### Desarrollo local
1. Abre `src/index.html` en un navegador
2. Introduce tus credenciales de Supabase
3. Se guardan en localStorage (auto-conecta después)

### Agregar nueva funcionalidad
1. **Nueva página**: Agrega HTML en `index.html`, crea módulo en `js/modules/`
2. **Nuevo estilo**: Agrega a `assets/styles/` según tema (tema → base → layout → componentes)
3. **Helper**: Agrega función a `js/utils/formatter.js`
4. **Llamada a BD**: Usa métodos de `SupabaseService`

### Estructura de datos (en Supabase)
```json
{
  "id": "uuid",
  "name": "Producto",
  "category": "Cajas",
  "sku": "SONY-XM5",
  "my_url": "https://articulo.mercadolibre.com.ar/MLA-...",
  "my_price": 179158.03,
  "competitors": [
    {
      "name": "TiendaX",
      "url": "https://articulo.mercadolibre.com.ar/MLA-...",
      "price": 168900
    }
  ],
  "updated_at": "2026-04-11T..."
}
```

## Patrones

### Listeners
En lugar de `onclick=""`, usa `data-*` attributes:
```html
<button data-edit-id="123">Editar</button>
```
```javascript
btn.addEventListener('click', () => {
  const id = btn.dataset.editId;
  modalModule.openForEdit(id);
});
```

### Renderizado
Módulos retornan datos, DOM se actualiza:
```javascript
await productsModule.loadProducts();
dashboardModule.render();  // lee de productsModule.products
```

### Errores
Usa try-catch y alerta al usuario:
```javascript
try {
  await productsModule.deleteProduct(id);
  dashboardModule.render();
} catch (error) {
  alert('Error: ' + error.message);
}
```

## Debugging

### Consola
```javascript
console.log(productsModule.products);
console.log(supabaseService.cachedCredentials);
console.log(CONFIG);
```

### localStorage
```javascript
localStorage.getItem('sb_url');  // credenciales guardadas
localStorage.clear();             // limpiar todo
```

## Próximas mejoras posibles
- [ ] Persistencia de filtro de categoría
- [ ] Modo oscuro/claro toggle
- [ ] Exportar a CSV
- [ ] Gráficos de tendencia de precios
- [ ] Sincronización en tiempo real (Supabase subscriptions)
- [ ] Validación de formularios mejorada
