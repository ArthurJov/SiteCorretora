// =============================================================
// javascript.js — Lógica da página de imóveis (imoveis.html)
// -------------------------------------------------------------
// Expõe funções como window.* (globais) para que os handlers
// onclick inline nos cards gerados dinamicamente pelo Firestore
// continuem funcionando. NÃO usar type="module" neste arquivo.
// =============================================================

// --- LOGICA DE FILTRO E BUSCA ---
// Chamada via onkeyup e onchange nos campos de filtro.
window.filtrar = function filtrar() {
    const inputBusca = document.getElementById('inputBusca').value.toLowerCase();
    const filtroTipo = document.getElementById('filtroTipo').value;
    const cards      = document.querySelectorAll('.card-imovel');

    cards.forEach(card => {
        // Suporta ambos os layouts: .titulo-imovel (legado) e .card-imovel__titulo (novo)
        const tituloEl = card.querySelector('.titulo-imovel, .card-imovel__titulo');
        const titulo   = tituloEl ? tituloEl.innerText.toLowerCase() : '';
        const tipoCard = card.getAttribute('data-tipo');

        const bateuNome = titulo.includes(inputBusca);
        const bateuTipo = (filtroTipo === 'todos' || filtroTipo === tipoCard);

        if (bateuNome && bateuTipo) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
};

// --- LOGICA DO SLIDESHOW ---
// Função central para mudar a imagem do carrossel
function mudarSlide(container, direction) {
    if (!container) return;
    const images = container.querySelectorAll('img');
    if (images.length <= 1) return;

    let activeIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
    if (activeIndex === -1) activeIndex = 0;

    images[activeIndex].classList.remove('active');
    activeIndex = (activeIndex + direction + images.length) % images.length;
    images[activeIndex].classList.add('active');
}

// changeSlide é chamada pelos botões prev/next gerados dentro de cada card.
window.changeSlide = function changeSlide(button, direction) {
    // Suporta .slideshow (legado) e .card-imovel__slideshow (novo design)
    const container = button.closest('.card-imovel__foto-wrap, .imagem-container')
                             ?.querySelector('.card-imovel__slideshow, .slideshow');
    mudarSlide(container, direction);
};

// --- LOGICA DE DESLIZAR (SWIPE) MOBILE ---
let touchstartX = 0;
let touchendX = 0;

document.addEventListener('touchstart', function(e) {
    const container = e.target.closest('.card-imovel__slideshow, .slideshow');
    if (!container) return;
    touchstartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', function(e) {
    const container = e.target.closest('.card-imovel__slideshow, .slideshow');
    if (!container) return;
    touchendX = e.changedTouches[0].screenX;
    
    // Calcula a distância do deslize (min 30px para contar como swipe)
    if (touchstartX - touchendX > 30) {
        // Deslize para a esquerda -> próxima foto (+1)
        mudarSlide(container, 1);
    } else if (touchendX - touchstartX > 30) {
        // Deslize para a direita -> foto anterior (-1)
        mudarSlide(container, -1);
    }
}, { passive: true });

// Inicia o slideshow automático em todos os slideshows presentes no DOM.
// Chamado por imoveis-publico.js após a renderização dos cards do Firestore.
window.startAutoSlideshow = function startAutoSlideshow() {
    const slideshows = document.querySelectorAll('.card-imovel__slideshow, .slideshow');
    slideshows.forEach(container => {
        // Evitar múltiplos intervalos no mesmo elemento
        if (container.dataset.slideshowInit) return;
        container.dataset.slideshowInit = 'true';

        const images = container.querySelectorAll('img');
        if (images.length <= 1) return;

        setInterval(() => {
            let activeIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
            if (activeIndex === -1) activeIndex = 0;

            images[activeIndex].classList.remove('active');
            activeIndex = (activeIndex + 1) % images.length;
            images[activeIndex].classList.add('active');
        }, 5000);
    });
};
