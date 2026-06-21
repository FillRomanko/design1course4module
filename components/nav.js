class SiteNavigation extends HTMLElement {
    constructor() {
        super();
        this.style.position = 'sticky';
        this.style.top = '0';
        this.style.zIndex = '1000';
        this._forceOpaque = false;
        this._isHovered = false;
        this._scrollProgress = 0;
    }

    async connectedCallback() {
        this._base = this.getAttribute('base') || '';
        const data = await fetch(this._base + 'components/nav.json').then(r => r.json());
        this._data = data;
        this.innerHTML = this.buildHTML(data);

        this._header = this.querySelector('.nav-header');
        this._navList = this.querySelector('.nav-list');
        this._burger = this.querySelector('.burger');
        this._navMenu = this.querySelector('.nav-menu');
        this._navContainer = this.querySelector('.nav-container');

        this.initBurger();
        this.initDropdowns();
        this.initScrollEffect();
        this.initAdaptiveMenu();
        this.highlightActiveLink();
        this.initHoverEffect();
        this.closeMenuOnLinkClick(); // новый метод
    }

    buildHTML(data) {
        const { logo, nav, loginButton } = data;
        const menuHTML = this.buildMenuHTML(nav);
        const logoSrc = `../${logo.src}`;
        const logoLink = `${this._base}Main/`;

        return `
      <div class="nav-header">
        <div class="logo">
          <a href="${logoLink}">
            <img src="${logoSrc}" alt="${logo.alt}" width="${logo.width}" height="${logo.height}">
          </a>
        </div>
        <div class="nav-container">
          <nav class="nav-menu">
            ${menuHTML}
          </nav>
        </div>
        <div class="login-btn">
          <a href="${this._base + loginButton.path}" class="btn-login">${loginButton.text}</a>
        </div>
        <button class="burger" aria-label="Открыть меню">
          <span></span><span></span><span></span>
        </button>
      </div>
    `;
    }

    buildMenuHTML(items) {
        if (!items || items.length === 0) return '';
        let html = '<ul class="nav-list">';
        for (const item of items) {
            const hasChildren = item.children && item.children.length > 0;
            const liClass = hasChildren ? 'nav-item has-children' : 'nav-item';
            let linkPath = this._base + item.path;
            if (item.filters && item.filters.length > 0) {
                linkPath += '?filter=' + item.filters.join(',') + '#sells';
            }
            html += `<li class="${liClass}">`;
            html += `<a href="${linkPath}" class="nav-link" data-path="${item.path}">${item.title}</a>`;
            if (hasChildren) {
                html += `<button class="dropdown-toggle" aria-label="Раскрыть подменю">▼</button>`;
                html += `<div class="sub-menu-wrapper">`;
                html += this.buildMenuHTML(item.children);
                html += `</div>`;
            }
            html += `</li>`;
        }
        html += '</ul>';
        return html;
    }

    // ---------- Бургер ----------
    initBurger() {
        this._burger.addEventListener('click', () => {
            const wasOpen = this.classList.contains('menu-open');
            this.classList.toggle('menu-open');
            const isOpen = this.classList.contains('menu-open');
            this._forceOpaque = isOpen;
            // При закрытии бургера игнорируем ховер, чтобы фон стал по скроллу
            if (!isOpen && wasOpen) {
                this._isHovered = false;
            }
            this.updateHeaderBackground();
        });
    }

    // ---------- Дропдауны ----------
    initDropdowns() {
        const menu = this._navMenu;
        if (!menu) return;
        menu.addEventListener('click', (e) => {
            const toggleBtn = e.target.closest('.dropdown-toggle');
            if (!toggleBtn) return;
            e.preventDefault();
            e.stopPropagation();
            const parentLi = toggleBtn.closest('.has-children');
            if (!parentLi) return;
            parentLi.classList.toggle('sub-open');
            void parentLi.offsetHeight;
        });
    }

    // ---------- Скролл ----------
    initScrollEffect() {
        const header = this._header;
        const headerHeight = header.offsetHeight;
        this._scrollProgress = 0;

        const onScroll = () => {
            const scrollY = window.scrollY;
            this._scrollProgress = Math.min(scrollY / headerHeight, 1);
            this.updateHeaderBackground();
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    // ---------- Обновление фона (центральная логика) ----------
    updateHeaderBackground() {
        let alpha;
        if (this._forceOpaque || this._isHovered) {
            alpha = 1;
        } else {
            alpha = 1 - this._scrollProgress * 0.5;
        }
        this._header.style.backgroundColor = `rgba(26, 26, 26, ${alpha})`;
    }

    // ---------- Ховер ----------
    initHoverEffect() {
        const header = this._header;
        header.addEventListener('mouseenter', () => {
            this._isHovered = true;
            this.updateHeaderBackground();
        });
        header.addEventListener('mouseleave', () => {
            this._isHovered = false;
            this.updateHeaderBackground();
        });
    }

    // ---------- Закрытие меню при клике на ссылку ----------
    closeMenuOnLinkClick() {
        this.addEventListener('click', (e) => {
            const link = e.target.closest('.nav-link');
            if (link && this.classList.contains('menu-open')) {
                // Закрываем бургер-меню
                this.classList.remove('menu-open');
                this._forceOpaque = false;
                this._isHovered = false; // опционально
                this.updateHeaderBackground();
            }
        });
    }

    // ---------- Адаптивность ----------
    initAdaptiveMenu() {
        const getMenuWidth = () => {
            const menu = this._navMenu;
            if (!menu) return 0;
            const isHidden = window.getComputedStyle(menu).display === 'none';
            if (isHidden) {
                const originalDisplay = menu.style.display;
                const originalVisibility = menu.style.visibility;
                const originalPosition = menu.style.position;
                menu.style.display = 'flex';
                menu.style.position = 'absolute';
                menu.style.visibility = 'hidden';
                const width = menu.scrollWidth;
                menu.style.display = originalDisplay || '';
                menu.style.position = originalPosition || '';
                menu.style.visibility = originalVisibility || '';
                return width;
            }
            return menu.scrollWidth;
        };

        const checkOverflow = () => {
            const container = this._navContainer;
            if (!container) return;
            const containerWidth = container.clientWidth;
            const menuWidth = getMenuWidth();
            if (menuWidth === 0) return;

            if (menuWidth > containerWidth + 2) {
                this.classList.add('overflow');
            } else {
                this.classList.remove('overflow');
                this.classList.remove('menu-open');
                this._forceOpaque = false;
                this.updateHeaderBackground();
            }
        };

        this._checkOverflow = checkOverflow;
        requestAnimationFrame(() => checkOverflow());
        window.addEventListener('resize', checkOverflow);
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(checkOverflow);
            ro.observe(this._navContainer);
        }
    }

    // ---------- Подсветка активной ссылки ----------
    highlightActiveLink() {
        const currentPath = window.location.pathname;
        const links = this.querySelectorAll('.nav-link');
        links.forEach(link => {
            const absoluteUrl = link.href;
            if (absoluteUrl) {
                const url = new URL(absoluteUrl);
                const linkPath = url.pathname;
                const isTopLevel = !link.closest('.sub-menu-wrapper');
                if (isTopLevel && (currentPath === linkPath || (currentPath.startsWith(linkPath) && linkPath.length > 1))) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            }
        });
    }
}

customElements.define('site-navigation', SiteNavigation);