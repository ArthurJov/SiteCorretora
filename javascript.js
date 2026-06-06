// =============================================================
// javascript.js — Lógica da página de imóveis (imoveis.html)
// -------------------------------------------------------------
// Expõe funções como window.* (globais) para que os handlers
// onclick inline nos cards gerados dinamicamente pelo Firestore
// continuem funcionando. NÃO usar type="module" neste arquivo.
// =============================================================

// --- LOGICA DE FILTRO E BUSCA ---
// Chamada via onkeyup e onchange nos campos de filtro.
// Funciona sobre o DOM atual — cards são renderizados antes.
window.filtrar = function filtrar() {
    const inputBusca = document.getElementById('inputBusca').value.toLowerCase();
    const filtroTipo = document.getElementById('filtroTipo').value;
    const cards      = document.querySelectorAll('.card-imovel');

    cards.forEach(card => {
        const tituloEl = card.querySelector('.titulo-imovel');
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
// changeSlide é chamada pelos botões prev/next gerados dentro de cada card.
window.changeSlide = function changeSlide(button, direction) {
    const container = button.parentElement.querySelector('.slideshow');
    if (!container) return;
    const images = container.querySelectorAll('img');
    if (images.length <= 1) return;

    let activeIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
    if (activeIndex === -1) activeIndex = 0;

    images[activeIndex].classList.remove('active');
    activeIndex = (activeIndex + direction + images.length) % images.length;
    images[activeIndex].classList.add('active');
};

// Inicia o slideshow automático em todos os .slideshow presentes no DOM.
// Chamado por imoveis-publico.js após a renderização dos cards do Firestore.
window.startAutoSlideshow = function startAutoSlideshow() {
    const slideshows = document.querySelectorAll('.slideshow');
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

window.adicionarImovel = function adicionarImovel() {
    const titulo = document.getElementById('novoTitulo')?.value;
    const local = document.getElementById('novoLocal')?.value;
    const tipo = document.getElementById('novoTipo')?.value;
    const imgUrl = document.getElementById('novaImgUrl')?.value;

    if (!titulo || !imgUrl) return alert('Preencha o nome e a imagem!');

    const catalogo = document.getElementById('catalogo-grid') || document.querySelector('.catalogo-container');
    if(!catalogo) return;

    const novoCard = document.createElement('div');
    novoCard.classList.add('card-imovel');
    novoCard.setAttribute('data-tipo', tipo);

    novoCard.innerHTML = `<div class="imagem-container"><div class="slideshow"><img src="" class="active"></div><span class="coracao-icon">🤍</span></div><div class="detalhes-imovel"><p class="tipo-local"> ? </p><p class="titulo-imovel"></p><div class="preco-container"><p class="preco-total">Total: <strong>Sob Consulta</strong></p></div></div>`;

    catalogo.appendChild(novoCard);
    document.getElementById('novoTitulo').value = '';
    document.getElementById('novaImgUrl').value = '';
};
