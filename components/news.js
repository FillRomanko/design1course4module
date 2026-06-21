class NewsBanner extends HTMLElement {
    async connectedCallback() {
        const base = this.getAttribute('base') || '';
        const src = this.getAttribute('src');
        if (!src) {
            console.warn('news-banner: не указан атрибут src');
            this.innerHTML = '<div style="padding:2rem;">Нет данных</div>';
            return;
        }
        this._base = base;

        try {
            const response = await fetch(`${base}${src}`);
            const data = await response.json();
            this.innerHTML = this.buildHTML(data);
        } catch (err) {
            console.warn('Не удалось загрузить новости:', err);
            this.innerHTML = `<div style="padding:2rem;color:var(--pink);">Ошибка загрузки новостей</div>`;
        }
    }

    buildHTML(data) {
        const { title, items } = data;
        let html = '<div class="news-container">';

        if (title) {
            html += `<h2 class="news-title">${title}</h2>`;
        }

        html += '<ul class="news-list">';
        if (items && items.length) {
            for (const item of items) {
                // Обработка картинки
                let imageSrc = item.image;
                if (imageSrc && !imageSrc.startsWith('http://') && !imageSrc.startsWith('https://')) {
                    imageSrc = this._base + imageSrc;
                }

                // Обработка ссылки
                let link = null;
                if (item.link) {
                    link = (item.link.startsWith('http://') || item.link.startsWith('https://'))
                        ? item.link
                        : this._base + item.link;
                }

                html += `<li class="news-item">`;
                html += `<div class="news-item-content">`;
                html += `<div class="news-text">`;
                if (item.date) {
                    html += `<div class="news-date">${item.date}</div>`;
                }
                html += `<div class="news-item-title">${item.title || ''}</div>`;
                if (item.description) {
                    html += `<div class="news-description">${item.description}</div>`;
                }
                html += `</div>`;
                html += `<div class="news-image">`;
                if (link) {
                    html += `<a href="${link}" target="_blank" rel="noopener noreferrer">`;
                }
                html += `<img src="${imageSrc}" alt="${item.title || 'новость'}" loading="lazy">`;
                if (link) {
                    html += `</a>`;
                }
                html += `</div>`;
                html += `</div>`;
                html += `</li>`;
            }
        } else {
            html += `<li style="padding:2rem;text-align:center;">Новостей пока нет</li>`;
        }
        html += '</ul></div>';
        return html;
    }
}

customElements.define('news-banner', NewsBanner);