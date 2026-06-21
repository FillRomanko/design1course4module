class MerchBanner extends HTMLElement {
    constructor() {
        super();
        this._resizeHandler = null;
    }

    async connectedCallback() {
        const base = this.getAttribute('base') || '';
        this._base = base;

        try {
            const response = await fetch(`${base}components/merch.json`);
            const data = await response.json();
            this.innerHTML = this.buildHTML(data);
        } catch (err) {
            console.warn('Не удалось загрузить merch.json', err);
            this.innerHTML = `
                <div class="merch">
                    <div class="merch-content">
                        <h1>Наш мерч</h1>
                        <a href="${base}Store/#sells" class="btn-merch">Перейти в магазин →</a>
                    </div>
                </div>`;
        }

        // Инициализация кнопки
        this.initButton();

        // Настройка высоты
        this.scheduleHeightUpdate();
        this._resizeHandler = () => this.setHeight();
        window.addEventListener('resize', this._resizeHandler);

        if (document.readyState === 'complete') {
            this.setHeight();
        } else {
            window.addEventListener('load', () => this.setHeight());
        }
    }

    disconnectedCallback() {
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
        }
    }

    buildHTML(data) {
        const { title, buttonText, buttonLink, image } = data;
        const imageSrc = this._base + image.src;
        const link = this._base + buttonLink;
        return `
            <div class="merch">
                <div class="merch-content">
                    <h1>${title}</h1>
                    <a href="${link}" class="btn-merch">
                        ${buttonText} <span class="arrow">→</span>
                    </a>
                </div>
                <div class="merch-image">
                    <img src="${imageSrc}" alt="${image.alt}" loading="lazy">
                </div>
            </div>
        `;
    }

    initButton() {
        const btn = this.querySelector('.btn-merch');
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            const href = btn.getAttribute('href');
            if (!href) return;
            const [path, hash] = href.split('#');
            if (!hash) return;

            const currentPath = window.location.pathname.replace(/\/$/, '');
            const targetPath = path.replace(/\/$/, '');

            // Если мы уже на целевой странице (или путь пустой)
            if (targetPath === '' || currentPath === targetPath || currentPath === '/' + targetPath) {
                e.preventDefault();
                const targetElement = document.getElementById(hash);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
            // Иначе – переходим на новую страницу, там anchor-scroll.js подхватит якорь
        });
    }

    scheduleHeightUpdate() {
        requestAnimationFrame(() => {
            setTimeout(() => {
                this.setHeight();
            }, 100);
        });
    }

    setHeight() {
        const nav = document.querySelector('site-navigation');
        if (!nav) {
            setTimeout(() => this.setHeight(), 200);
            return;
        }
        const navHeight = nav.offsetHeight;
        const availableHeight = window.innerHeight - navHeight;
        if (availableHeight <= 0) return;
        this.style.height = availableHeight + 'px';
        this.style.minHeight = availableHeight + 'px';
    }
}

customElements.define('merch-banner', MerchBanner);