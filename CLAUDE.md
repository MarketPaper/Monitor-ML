# Monitor ML — Guía del Proyecto

## ¿De qué va esto?
Monitor de precios para MercadoLibre Argentina. Consulta los precios de tus productos y los de la competencia, y los persiste en Supabase.

## Stack
- **Runtime**: Node.js (sin transpilación, CommonJS puro)
- **Base de datos**: Supabase — tabla `ml_products`
- **API externa**: MercadoLibre Argentina (OAuth2 con PKCE + refresh token)

## Arquitectura

### Archivos principales
| Archivo | Rol |
|---|---|
| `auth.js` | Flujo OAuth inicial (una sola vez). Genera `ml_token.json` vía PKCE. |
| `monitor.js` | Script principal. Lee productos de Supabase, consulta precios y los actualiza. |
| `ml_token.json` | Persiste el `refresh_token` activo. **No commitear.** |

### Flujo del monitor (`monitor.js`)
1. **Renovación de token** — hace un `refresh_token` grant contra ML y guarda el nuevo `refresh_token` en `ml_token.json`.
2. **Fase 1 — API oficial** — consulta precios en lotes de 20 via `/items?ids=...`. Solo devuelve precios de productos propios (ML bloquea competidores).
3. **Fase 2 — Scraper** — para los IDs bloqueados, scrapea la página de articulo con headers de Chrome. Usa 3 métodos de extracción (JSON embebido, meta itemprop, span de Andes). Delay de 1.5s entre requests.
4. **Fase 3 — Supabase** — actualiza solo los registros cuyo precio cambió (`my_price` o campos dentro del array `competitors`).

### Estructura de un registro en `ml_products`
```json
{
  "id": "uuid",
  "name": "Nombre del producto",
  "category": "categoria",
  "my_url": "https://articulo.mercadolibre.com.ar/MLA-XXXXXXX-...",
  "my_price": 12500,
  "competitors": [
    { "url": "https://articulo.mercadolibre.com.ar/MLA-YYYYYYY-...", "price": 11900 }
  ],
  "updated_at": "2026-04-10T..."
}
```

## Comandos de uso
```bash
# Actualizar todos los productos
node monitor.js

# Actualizar solo una categoría
node monitor.js "nombre_categoria"

# Re-autenticar con MercadoLibre (solo si el refresh_token expira)
node auth.js
```

## Credenciales y variables sensibles
- `ML_APP_ID`, `ML_CLIENT_SECRET`, `SUPABASE_URL`, `SUPABASE_KEY` están hardcodeadas en los scripts por ahora.
- `ml_token.json` contiene el `refresh_token` activo — **nunca subir a git**.
- `REDIRECT_URI` de OAuth: `https://art2mart.com.ar`

## Frontend (Nuevo)

### Estructura modular (`src/`)
```
src/
├── index.html              ← HTML limpio, solo estructura
├── assets/
│   └── styles/
│       ├── theme.css       ← Variables CSS, tema oscuro
│       ├── base.css        ← Reset, tipografía
│       ├── layout.css      ← Header, main, secciones
│       └── components.css  ← Botones, tablas, modales, formularios
└── js/
    ├── config.js           ← Constantes y configuración
    ├── services/
    │   └── supabase.js     ← Clase SupabaseService (CRUD)
    ├── modules/
    │   ├── products.js     ← ProductsModule (lógica de productos)
    │   ├── dashboard.js    ← DashboardModule (render UI)
    │   └── modal.js        ← ModalModule (CRUD form)
    ├── utils/
    │   └── formatter.js    ← Funciones de formato (currency, precios, etc)
    └── main.js             ← App class, entry point
```

### Patrones y decisiones
- **Clases encapsuladas**: ProductsModule, DashboardModule, ModalModule, SupabaseService
- **Separación de responsabilidades**: servicios (BD), módulos (lógica), utilidades (helpers)
- **CSS modular**: variables globales, estilos por capas (base → layout → componentes)
- **Sin bundler**: vanilla JS, estilos CSS plano, importados en orden en index.html
- **Atributos data-**: para IDs y acciones en el DOM (data-category, data-edit-id, data-delete-id)

## Historial de decisiones arquitectónicas

### 2026-04-11 — Refactor frontend: HTML monolítico → estructura modular
- **Antes**: 771 líneas en un archivo HTML (difícil de mantener).
- **Ahora**: Estructura profesional con separación clara:
  - HTML limpio (solo marcado semántico)
  - CSS en 4 archivos temáticos (theme, base, layout, components)
  - JS con clases y módulos (SupabaseService, ProductsModule, etc)
  - Utilidades helpers centralizadas
- **Por qué**: Escalabilidad, mantenibilidad, reutilización, fácil testing.
- **No usamos bundler**: Proyecto pequeño, sin dependencias npm complejas, Supabase y Lucide vía CDN.

### 2026-04-10 — Arquitectura inicial (Backend)
- Sistema híbrido: API oficial para productos propios + scraper para competidores.
- Se eligió scraper con headers de Chrome porque ML bloquea la API para productos de terceros.
- Delay de 1.5s entre requests de scraping para evitar detección.
- Supabase elegido como BaaS por simplicidad (sin servidor propio).
- Auth con PKCE porque ML lo exige desde 2023 para nuevas apps.

---
> **Regla del proyecto**: Cada vez que se agregue un cambio importante a la arquitectura, documentarlo en la sección "Historial de decisiones arquitectónicas" con fecha y motivación.
