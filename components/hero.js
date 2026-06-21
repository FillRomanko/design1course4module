class HeroBanner extends HTMLElement {
    constructor() {
        super();
        this._resizeHandler = null;
    }

    async connectedCallback() {
        const base = this.getAttribute('base') || '';
        this._base = base;

        try {
            const response = await fetch(`${base}components/hero.json`);
            const data = await response.json();
            this.innerHTML = this.buildHTML(data);
        } catch (err) {
            console.warn('Не удалось загрузить hero.json', err);
            this.innerHTML = `
                <div class="hero">
                    <div class="hero-content">
                        <h1>Be Whale</h1>
                        <p>Стань частью сообщества</p>
                    </div>
                </div>`;
        }

        // === ОТЛОЖЕННЫЙ ПЕРВЫЙ ВЫЗОВ ===
        this.scheduleHeightUpdate();

        // Подписываемся на resize (он уже работает правильно)
        this._resizeHandler = () => this.setHeight();
        window.addEventListener('resize', this._resizeHandler);

        // Пересчитываем при полной загрузке страницы (на случай, если навигация загрузилась позже)
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
        const { title, subtitle, image } = data;
        const imageSrc = this._base + image.src;
        return `
            <div class="hero">
                <div class="hero-content">
                    <h1>${title}</h1>
                    <p>${subtitle}</p>
                </div>
                <div class="hero-image">
                    <img src="${imageSrc}" alt="${image.alt}" loading="lazy">
                </div>
            </div>
        `;
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
            setTimeout(() => this.setHeight(), 1);
            return;
        }
        const navHeight = nav.offsetHeight;
        const availableHeight = window.innerHeight - navHeight;
        if (availableHeight <= 0) return;
        this.style.height = availableHeight + 'px';
        this.style.minHeight = availableHeight + 'px';
    }
}

customElements.define('hero-banner', HeroBanner);