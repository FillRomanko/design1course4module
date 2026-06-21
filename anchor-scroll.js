// anchor-scroll.js – прокрутка к якорю после загрузки страницы
(function() {
    function scrollToHash() {
        if (window.location.hash) {
            const id = window.location.hash.substring(1);
            const target = document.getElementById(id);
            if (target) {
                setTimeout(() => {
                    target.scrollIntoView({ behavior: 'smooth' });
                }, 300);
            }
        }
    }

    if (document.readyState === 'complete') {
        scrollToHash();
    } else {
        window.addEventListener('load', scrollToHash);
    }
})();