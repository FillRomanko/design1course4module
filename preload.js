const filesToPreload = [
    'assets/images/logo.png',

    'styles/base.css',
    'styles/reset.css',
    'styles/variables.css',
    'styles/global.css',
    'anchor-scroll.js',
    'styles/store.css',

    'assets/images/pattern1.png',
    'assets/images/pattern2.png',
    'assets/images/pattern3.png',
    'assets/images/pattern4.png',

    'components/nav.json',
    'components/nav.js',
    'styles/nav.css',

    'components/hero.json',
    'components/hero.js',
    'styles/hero.css',

    'components/merch.json',
    'components/merch.js',
    'styles/merch.css',

    'components/news.js',
    'styles/news.css',

    'data/json/projects.json',
    'data/json/updates.json',

    '404.html',

    'data/json/store.json',
    'components/store.js',

    'data/images/projects1.jpg',
    'data/images/projects2.jpg',
    'data/images/projects3.jpg',
    'data/images/news1.jpg',
    'data/images/news2.jpg',


    'assets/audio/NeverGonnaGiveYouUp.mp3',
];

function getBaseFromScript() {
    const scripts = document.querySelectorAll('script[src]');
    for (const script of scripts) {
        if (script.src && script.src.includes('preload.js')) {
            const base = script.getAttribute('data-base');
            if (base !== null) {
                // Убираем ведущие и завершающие слеши для аккуратности
                return base.replace(/^\/+/, '').replace(/\/+$/, '') + '/';
            }
        }
    }
    return '';
}

async function preloadResources(urls, base) {
    for (const url of urls) {
        const fullUrl = base + url;
        try {
            await fetch(fullUrl, { cache: 'default' });
        } catch (err) {
            console.warn('Не удалось предзагрузить:', fullUrl, err);
        }
    }
    console.log('Предзагрузка завершена (база: ' + base + ')');
}

// Запускаем, когда DOM готов
const basePath = getBaseFromScript();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => preloadResources(filesToPreload, basePath));
} else {
    preloadResources(filesToPreload, basePath);
}