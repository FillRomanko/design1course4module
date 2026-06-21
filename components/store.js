const BASE = '../';
const STORE_JSON = `${BASE}data/json/store.json`;
const CART_STORAGE_KEY = 'beWhaleCart';
const CART_TOGGLE_BTN_ID = 'cartToggleBtn';

let allItems = [];
let categories = [];
let cart = {};

// DOM-элементы
const grid = document.getElementById('product-grid');
const categoryFiltersContainer = document.getElementById('category-filters');
const priceMinSlider = document.getElementById('price-min');
const priceMaxSlider = document.getElementById('price-max');
const priceMinInput = document.getElementById('price-min-input');
const priceMaxInput = document.getElementById('price-max-input');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const resetBtn = document.getElementById('reset-filters');
const cartPanel = document.getElementById('cart-panel');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalPrice = document.getElementById('cart-total-price');
const checkoutBtn = document.getElementById('checkout-btn');
const filterToggle = document.querySelector('.filter-toggle');
const filterClose = document.querySelector('.filter-close');
const cartClose = document.querySelector('.cart-close');
const filtersAside = document.querySelector('.store-filters');

// --- Состояние фильтров ---
let activeFilters = {
    categories: new Set(),
    priceMin: 0,
    priceMax: Infinity,
    search: '',
    sort: 'default'
};

let globalMinPrice = 0;
let globalMaxPrice = 0;

// --- Инициализация ---
async function init() {
    await loadData();
    updateSliderLimits();
    initPriceTrack();
    applyUrlFilters();
    renderCategories();
    renderProducts();
    loadCart();
    renderCart();
    setupEventListeners();
    setupSliderSync();
    setupCartToggle();
    createCartToggleButton();
    setupFilterAutoClose();
    updateCartBadge();

    // Принудительно закрыть панель на мобильных и показать кнопку
    if (window.innerWidth <= 768) {
        const panel = document.getElementById('cart-panel');
        if (panel) {
            panel.classList.remove('open');
        }
        updateCartButtonVisibility();
    }
}

function updatePriceTrack() {
    const min = parseInt(priceMinSlider.value);
    const max = parseInt(priceMaxSlider.value);
    const range = globalMaxPrice - globalMinPrice;
    if (range === 0) return;
    const minPercent = ((min - globalMinPrice) / range) * 100;
    const maxPercent = ((max - globalMinPrice) / range) * 100;
    const track = document.querySelector('.price-slider .track-active');
    if (track) {
        track.style.left = minPercent + '%';
        track.style.width = (maxPercent - minPercent) + '%';
    }
}

// --- Загрузка данных ---
async function loadData() {
    try {
        const response = await fetch(STORE_JSON);
        const data = await response.json();
        categories = data.categories || [];
        allItems = data.items || [];
        const prices = allItems.map(item => item.price);
        globalMinPrice = prices.length ? Math.min(...prices) : 0;
        globalMaxPrice = prices.length ? Math.max(...prices) : 1000;
    } catch (err) {
        console.error('Ошибка загрузки товаров:', err);
        grid.innerHTML = '<p class="error">Не удалось загрузить каталог</p>';
        globalMinPrice = 0;
        globalMaxPrice = 1000;
    }
}

// --- Чтение фильтров из URL ---
function applyUrlFilters() {
    const params = new URLSearchParams(window.location.search);
    const filterParam = params.get('filter');
    if (filterParam) {
        const cats = filterParam.split(',').map(s => s.trim()).filter(Boolean);
        cats.forEach(cat => activeFilters.categories.add(cat));
    }
}

// --- Рендеринг чекбоксов категорий ---
function renderCategories() {
    if (!categoryFiltersContainer) return;
    categoryFiltersContainer.innerHTML = '';
    categories.forEach(cat => {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = cat.id;
        input.checked = activeFilters.categories.has(cat.id);
        input.dataset.category = cat.id;
        label.appendChild(input);
        label.appendChild(document.createTextNode(' ' + cat.name));
        categoryFiltersContainer.appendChild(label);
    });
}

// --- Обновление пределов слайдера ---
function updateSliderLimits() {
    priceMinSlider.min = globalMinPrice;
    priceMinSlider.max = globalMaxPrice;
    priceMaxSlider.min = globalMinPrice;
    priceMaxSlider.max = globalMaxPrice;
    priceMinInput.min = globalMinPrice;
    priceMinInput.max = globalMaxPrice;
    priceMaxInput.min = globalMinPrice;
    priceMaxInput.max = globalMaxPrice;

    if (!activeFilters.priceMin && activeFilters.priceMin !== 0) {
        activeFilters.priceMin = globalMinPrice;
    }
    if (!activeFilters.priceMax && activeFilters.priceMax !== 0) {
        activeFilters.priceMax = globalMaxPrice;
    }
    activeFilters.priceMin = Math.max(globalMinPrice, Math.min(activeFilters.priceMin, globalMaxPrice));
    activeFilters.priceMax = Math.min(globalMaxPrice, Math.max(activeFilters.priceMin, activeFilters.priceMax));

    priceMinSlider.value = activeFilters.priceMin;
    priceMaxSlider.value = activeFilters.priceMax;
    priceMinInput.value = activeFilters.priceMin;
    priceMaxInput.value = activeFilters.priceMax;
}

function initPriceTrack() {
    const slider = document.querySelector('.price-slider');
    if (!slider) return;
    let track = slider.querySelector('.track-active');
    if (!track) {
        track = document.createElement('div');
        track.className = 'track-active';
        slider.appendChild(track);
    }
    // начальное обновление
    updatePriceTrack();
}

// --- Основной рендеринг товаров ---
function renderProducts() {
    if (!grid) return;
    let filtered = [...allItems];
    if (activeFilters.search) {
        const q = activeFilters.search.toLowerCase();
        filtered = filtered.filter(item => item.name.toLowerCase().includes(q));
    }
    if (activeFilters.categories.size > 0) {
        filtered = filtered.filter(item => activeFilters.categories.has(item.category));
    }
    const minPrice = parseInt(activeFilters.priceMin) || 0;
    const maxPrice = parseInt(activeFilters.priceMax) || Infinity;
    filtered = filtered.filter(item => item.price >= minPrice && item.price <= maxPrice);

    if (activeFilters.sort === 'price-asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (activeFilters.sort === 'price-desc') {
        filtered.sort((a, b) => b.price - a.price);
    }

    if (filtered.length === 0) {
        grid.innerHTML = '<p class="no-products">Товаров не найдено</p>';
        return;
    }

    let html = '';
    filtered.forEach(item => {
        const inCart = cart[item.id] ? cart[item.id].quantity : 0;
        html += `
            <div class="product-card" data-id="${item.id}">
                <div class="product-image">
                    <img src="${BASE + item.image}" alt="${item.name}" loading="lazy" />
                </div>
                <h3 class="product-name">${item.name}</h3>
                <div class="product-price">${item.price} ₽</div>
                <div class="product-actions">
                    ${inCart > 0 ? `
                        <div class="quantity-control">
                            <button class="qty-btn dec" data-id="${item.id}">−</button>
                            <span class="qty-count">${inCart}</span>
                            <button class="qty-btn inc" data-id="${item.id}">+</button>
                        </div>
                    ` : `
                        <button class="add-btn" data-id="${item.id}">Добавить</button>
                    `}
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

// --- Корзина (localStorage) ---
function loadCart() {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
        try { cart = JSON.parse(stored); } catch { cart = {}; }
    } else {
        cart = {};
    }
}

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function addToCart(itemId) {
    if (!cart[itemId]) {
        cart[itemId] = { quantity: 0 };
    }
    cart[itemId].quantity += 1;
    saveCart();
    renderProducts();
    renderCart();
}

function changeQuantity(itemId, delta) {
    if (!cart[itemId]) return;
    const newQty = cart[itemId].quantity + delta;
    if (newQty <= 0) {
        delete cart[itemId];
    } else {
        cart[itemId].quantity = newQty;
    }
    saveCart();
    renderProducts();
    renderCart();
}

function getTotalPrice() {
    let total = 0;
    for (const id in cart) {
        const item = allItems.find(i => i.id === parseInt(id));
        if (item) {
            total += item.price * cart[id].quantity;
        }
    }
    return total;
}

function renderCart() {
    if (!cartItemsContainer) return;
    const cartArray = Object.keys(cart).map(id => {
        const item = allItems.find(i => i.id === parseInt(id));
        return { ...item, quantity: cart[id].quantity };
    }).filter(item => item && item.quantity > 0);

    if (cartArray.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Корзина пуста</p>';
        cartTotalPrice.textContent = '0';
        updateCartBadge();
        return;
    }

    let html = '';
    cartArray.forEach(item => {
        html += `
            <div class="cart-item" data-id="${item.id}">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">${item.price} ₽</span>
                <div class="cart-item-qty">
                    <button class="qty-btn dec" data-id="${item.id}">−</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn inc" data-id="${item.id}">+</button>
                </div>
                <span class="cart-item-total">${item.price * item.quantity} ₽</span>
            </div>
        `;
    });
    cartItemsContainer.innerHTML = html;
    cartTotalPrice.textContent = getTotalPrice();
    updateCartBadge();
}

// --- Обновление бейджа корзины ---
function updateCartBadge() {
    const btn = document.getElementById(CART_TOGGLE_BTN_ID);
    if (!btn) return;
    const badge = btn.querySelector('.cart-badge');
    if (!badge) return;

    let total = 0;
    for (const id in cart) {
        total += cart[id].quantity || 0;
    }
    badge.textContent = total;
    if (total === 0) {
        badge.classList.add('zero');
    } else {
        badge.classList.remove('zero');
    }
    btn.setAttribute('aria-label', `Корзина: ${total} товаров`);
}

// --- Вспомогательная функция: скрыть/показать кнопку в зависимости от состояния панели ---
function updateCartButtonVisibility() {
    const btn = document.getElementById(CART_TOGGLE_BTN_ID);
    const panel = document.getElementById('cart-panel');
    if (!btn || !panel) return;
    if (panel.classList.contains('open')) {
        btn.classList.add('hidden');
    } else {
        btn.classList.remove('hidden');
    }
}

// --- Создание плавающей кнопки корзины ---
function createCartToggleButton() {
    if (document.getElementById(CART_TOGGLE_BTN_ID)) return;

    const btn = document.createElement('button');
    btn.id = CART_TOGGLE_BTN_ID;
    btn.className = 'cart-toggle';
    btn.setAttribute('aria-label', 'Открыть корзину');
    btn.innerHTML = `
        <span class="cart-icon"><svg data-v-1090b266="" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path data-v-1090b266="" fill-rule="evenodd" clip-rule="evenodd" d="M2.25 3C2.25 2.58579 2.58579 2.25 3 2.25H4.38197C5.04482 2.25 5.65078 2.6245 5.94721 3.21738L5.27639 3.55279L5.94721 3.21738L6.46353 4.25H20.1384C21.0982 4.25 21.6999 5.28685 21.2237 6.12017L17.9391 11.8682C17.6275 12.4135 17.0477 12.75 16.4197 12.75H8.91567L7.59225 14.8675C7.48818 15.034 7.60789 15.25 7.80425 15.25H19C19.4142 15.25 19.75 15.5858 19.75 16C19.75 16.4142 19.4142 16.75 19 16.75H7.80425C6.42974 16.75 5.59176 15.2381 6.32025 14.0725L7.67159 11.9103L5.30898 5.295L4.60557 3.8882C4.56322 3.8035 4.47666 3.75 4.38197 3.75H3C2.58579 3.75 2.25 3.41421 2.25 3ZM7.06427 5.75L9.02855 11.25H16.4197C16.5094 11.25 16.5922 11.2019 16.6368 11.124L19.7076 5.75H7.06427ZM10 19.5C10 20.3284 9.32843 21 8.5 21C7.67157 21 7 20.3284 7 19.5C7 18.6716 7.67157 18 8.5 18C9.32843 18 10 18.6716 10 19.5ZM17.5 21C18.3284 21 19 20.3284 19 19.5C19 18.6716 18.3284 18 17.5 18C16.6716 18 16 18.6716 16 19.5C16 20.3284 16.6716 21 17.5 21Z" fill="var(--white)"></path></svg></span>
        <span class="cart-badge zero">0</span>
    `;
    document.body.appendChild(btn);

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const panel = document.getElementById('cart-panel');
        if (!panel) return;
        const isOpen = panel.classList.contains('open');
        if (isOpen) {
            panel.classList.remove('open');
            btn.setAttribute('aria-label', 'Открыть корзину');
        } else {
            panel.classList.add('open');
            btn.setAttribute('aria-label', 'Закрыть корзину');
            const filters = document.querySelector('.store-filters');
            if (filters && filters.classList.contains('open')) {
                filters.classList.remove('open');
            }
        }
        updateCartButtonVisibility();
    });

    // Клик вне панели и кнопки – закрываем панель
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('cart-panel');
        const toggle = document.getElementById(CART_TOGGLE_BTN_ID);
        if (!panel || !toggle) return;
        if (panel.classList.contains('open')) {
            const isClickInside = panel.contains(e.target) || toggle.contains(e.target);
            if (!isClickInside) {
                panel.classList.remove('open');
                toggle.setAttribute('aria-label', 'Открыть корзину');
                updateCartButtonVisibility();
            }
        }
    });
}

// --- Фильтр открыт → закрываем корзину ---
function setupFilterAutoClose() {
    const filters = document.querySelector('.store-filters');
    if (!filters) return;

    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.attributeName === 'class') {
                const isFilterOpen = filters.classList.contains('open');
                if (isFilterOpen) {
                    const panel = document.getElementById('cart-panel');
                    const toggle = document.getElementById(CART_TOGGLE_BTN_ID);
                    if (panel && panel.classList.contains('open')) {
                        panel.classList.remove('open');
                        if (toggle) toggle.setAttribute('aria-label', 'Открыть корзину');
                        updateCartButtonVisibility();
                    }
                }
            }
        }
    });
    observer.observe(filters, { attributes: true });
}

// --- Обработчики событий ---
function setupEventListeners() {
    categoryFiltersContainer.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const catId = e.target.value;
            if (e.target.checked) {
                activeFilters.categories.add(catId);
            } else {
                activeFilters.categories.delete(catId);
            }
            renderProducts();
            updateUrl();
        }
    });

    searchInput.addEventListener('input', (e) => {
        activeFilters.search = e.target.value.trim();
        renderProducts();
        updateUrl();
    });

    sortSelect.addEventListener('change', (e) => {
        activeFilters.sort = e.target.value;
        renderProducts();
        updateUrl();
    });

    resetBtn.addEventListener('click', () => {
        activeFilters.categories.clear();
        activeFilters.search = '';
        activeFilters.sort = 'default';
        activeFilters.priceMin = globalMinPrice;
        activeFilters.priceMax = globalMaxPrice;
        document.querySelectorAll('#category-filters input[type="checkbox"]').forEach(cb => cb.checked = false);
        searchInput.value = '';
        sortSelect.value = 'default';
        updateSliderLimits();
        renderProducts();
        updateUrl();
    });

    grid.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;
        if (!id) return;
        if (target.classList.contains('add-btn')) {
            addToCart(id);
        } else if (target.classList.contains('qty-btn')) {
            const delta = target.classList.contains('inc') ? 1 : -1;
            changeQuantity(id, delta);
        }
        // Не вызываем stopPropagation, чтобы клик по каталогу закрывал панель
    });

    // Обработчик кликов внутри корзины – с остановкой всплытия
    cartItemsContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;
        if (!id) return;
        const delta = target.classList.contains('inc') ? 1 : -1;
        changeQuantity(id, delta);
        // Останавливаем всплытие, чтобы не сработал обработчик закрытия панели
        e.stopPropagation();
    });

    checkoutBtn.addEventListener('click', () => {
        window.location.href = '/checkout';
    });
}

// --- Синхронизация слайдера ---
function setupSliderSync() {
    const minSlider = priceMinSlider;
    const maxSlider = priceMaxSlider;
    const minInput = priceMinInput;
    const maxInput = priceMaxInput;

    function updateFromSliders() {
        let min = parseInt(minSlider.value);
        let max = parseInt(maxSlider.value);
        // Обеспечиваем min <= max
        if (min > max) {
            if (minSlider === document.activeElement) {
                minSlider.value = max;
                min = max;
            } else {
                maxSlider.value = min;
                max = min;
            }
        }
        activeFilters.priceMin = min;
        activeFilters.priceMax = max;
        minInput.value = min;
        maxInput.value = max;
        renderProducts();
        updateUrl();
        updatePriceTrack();
    }

    minSlider.addEventListener('input', updateFromSliders);
    maxSlider.addEventListener('input', updateFromSliders);

    function updateFromInputs() {
        let min = parseInt(minInput.value);
        let max = parseInt(maxInput.value);
        // Если ввод не число или пусто, используем текущие значения
        if (isNaN(min)) min = activeFilters.priceMin;
        if (isNaN(max)) max = activeFilters.priceMax;

        // Корректировка левого поля
        if (min < globalMinPrice) min = globalMinPrice;
        if (min > max) min = max; // не может быть больше правого

        // Корректировка правого поля
        if (max > globalMaxPrice) max = globalMaxPrice;
        if (max < min) max = min; // не может быть меньше левого

        // Обновляем активные фильтры
        activeFilters.priceMin = min;
        activeFilters.priceMax = max;

        // Синхронизируем слайдеры и поля
        minSlider.value = min;
        maxSlider.value = max;
        minInput.value = min;
        maxInput.value = max;

        renderProducts();
        updateUrl();
        updatePriceTrack();
    }

    minInput.addEventListener('change', updateFromInputs);
    maxInput.addEventListener('change', updateFromInputs);
}

// --- Обновление URL ---
function updateUrl() {
    const params = new URLSearchParams();
    if (activeFilters.categories.size > 0) {
        params.set('filter', Array.from(activeFilters.categories).join(','));
    }
    const newUrl = window.location.pathname + '?' + params.toString() + '#sells';
    window.history.replaceState({}, '', newUrl);
}

// --- Настройка переключения фильтров и корзины ---
function setupCartToggle() {
    filterToggle?.addEventListener('click', () => {
        filtersAside.classList.toggle('open');
        const isFilterOpen = filtersAside.classList.contains('open');
        if (isFilterOpen) {
            const panel = document.getElementById('cart-panel');
            const toggle = document.getElementById(CART_TOGGLE_BTN_ID);
            if (panel && panel.classList.contains('open')) {
                panel.classList.remove('open');
                if (toggle) toggle.setAttribute('aria-label', 'Открыть корзину');
                updateCartButtonVisibility();
            }
        }
    });

    filterClose?.addEventListener('click', () => {
        filtersAside.classList.remove('open');
    });

    // Крестик закрывает панель
    const cartCloseBtn = document.querySelector('.cart-close');
    if (cartCloseBtn) {
        cartCloseBtn.addEventListener('click', () => {
            const panel = document.getElementById('cart-panel');
            const toggle = document.getElementById(CART_TOGGLE_BTN_ID);
            if (panel) {
                panel.classList.remove('open');
                if (toggle) toggle.setAttribute('aria-label', 'Открыть корзину');
                updateCartButtonVisibility();
            }
        });
    }
}

// Запуск
document.addEventListener('DOMContentLoaded', init);