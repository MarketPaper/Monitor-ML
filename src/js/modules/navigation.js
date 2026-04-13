/* === NAVIGATION MODULE === */

class NavigationModule {
    constructor() {
        this.elements = {
            sidebar: document.getElementById('sidebar'),
            navItems: Array.from(document.querySelectorAll('[data-section]')),
            sections: {},
        };

        // Mapear todas las secciones por ID
        const sectionIds = ['panel', 'mercadolibre', 'rentabilidad', 'lucro-cesante', 'full-semanal', 'demanda', 'opiniones', 'preguntas', 'competencia'];
        sectionIds.forEach(id => {
            const el = document.getElementById(`section-${id}`);
            if (el) this.elements.sections[id] = el;
        });

        this._initListeners();
    }

    _initListeners() {
        this.elements.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const sectionId = item.getAttribute('data-section');
                this.setActive(sectionId);
            });
        });
    }

    showSidebar() {
        this.elements.sidebar.classList.remove('hidden');
    }

    setActive(sectionId) {
        // Desactivar todos los items
        this.elements.navItems.forEach(item => {
            item.classList.remove('active');
        });

        // Activar el item clickeado
        const activeItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }

        // Ocultar todas las secciones
        Object.values(this.elements.sections).forEach(section => {
            section.classList.add('hidden');
        });

        // Mostrar la sección activa
        if (this.elements.sections[sectionId]) {
            this.elements.sections[sectionId].classList.remove('hidden');
        }
    }
}

const navigationModule = new NavigationModule();
