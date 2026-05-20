function startSlideshows() {
    // Seleciona todos os containers de slideshow da página
    const slideshows = document.querySelectorAll('.slideshow');

    slideshows.forEach(container => {
        const images = container.querySelectorAll('img');
        let currentIndex = 0;

        // Função que muda a imagem
        setInterval(() => {
            // Remove a classe 'active' da imagem atual
            images[currentIndex].classList.remove('active');

            // Vai para a próxima imagem (volta para 0 se for a última)
            currentIndex = (currentIndex + 1) % images.length;

            // Adiciona a classe 'active' na nova imagem
            images[currentIndex].classList.add('active');
        }, 8000); // 8000ms = 8 segundos
    });
}

// Inicia a função assim que a página carregar
window.onload = startSlideshows;





// Função para mudar o slide (Manual)
function changeSlide(button, direction) {
    const container = button.parentElement.querySelector('.slideshow');
    const images = container.querySelectorAll('img');
    let activeIndex = Array.from(images).findIndex(img => img.classList.contains('active'));

    // Remove classe atual
    images[activeIndex].classList.remove('active');

    // Calcula novo índice
    activeIndex = (activeIndex + direction + images.length) % images.length;

    // Adiciona nova classe
    images[activeIndex].classList.add('active');
}

// Slideshow Automático
function startAutoSlideshow() {
    const slideshows = document.querySelectorAll('.slideshow');

    slideshows.forEach(container => {
        setInterval(() => {
            const images = container.querySelectorAll('img');
            let activeIndex = Array.from(images).findIndex(img => img.classList.contains('active'));

            images[activeIndex].classList.remove('active');
            activeIndex = (activeIndex + 1) % images.length;
            images[activeIndex].classList.add('active');
        }, 5000); // 5 segundos para não ficar muito frenético
    });
}

window.onload = startAutoSlideshow;






// --- LOGICA DE FILTRO E BUSCA ---
function filtrar() {
    const inputBusca = document.getElementById('inputBusca').value.toLowerCase();
    const filtroTipo = document.getElementById('filtroTipo').value;
    const cards = document.querySelectorAll('.card-imovel');

    cards.forEach(card => {
        // Pega o título dentro do card
        const titulo = card.querySelector('.titulo-imovel').innerText.toLowerCase();
        // Pega o tipo (casa/terreno) no atributo data-tipo
        const tipoCard = card.getAttribute('data-tipo');

        // Condições:
        const bateuNome = titulo.includes(inputBusca);
        const bateuTipo = (filtroTipo === 'todos' || filtroTipo === tipoCard);

        // Se bater o nome E o tipo, mostra. Se não, esconde.
        if (bateuNome && bateuTipo) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

// --- LOGICA DO SLIDESHOW (MANTIDA) ---
function changeSlide(button, direction) {
    const container = button.parentElement.querySelector('.slideshow');
    const images = container.querySelectorAll('img');
    let activeIndex = Array.from(images).findIndex(img => img.classList.contains('active'));

    images[activeIndex].classList.remove('active');
    activeIndex = (activeIndex + direction + images.length) % images.length;
    images[activeIndex].classList.add('active');
}

function startAutoSlideshow() {
    const slideshows = document.querySelectorAll('.slideshow');
    slideshows.forEach(container => {
        setInterval(() => {
            const images = container.querySelectorAll('img');
            if(images.length <= 1) return; // Não roda se tiver só 1 foto
            
            let activeIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
            images[activeIndex].classList.remove('active');
            activeIndex = (activeIndex + 1) % images.length;
            images[activeIndex].classList.add('active');
        }, 5000);
    });
}

window.onload = startAutoSlideshow;



function adicionarImovel() {
    // 1. Pega os valores dos inputs
    const titulo = document.getElementById('novoTitulo').value;
    const local = document.getElementById('novoLocal').value;
    const tipo = document.getElementById('novoTipo').value;
    const imgUrl = document.getElementById('novaImgUrl').value;

    if (!titulo || !imgUrl) return alert("Preencha o nome e a imagem!");

    // 2. Seleciona o container do catálogo
    const catalogo = document.querySelector('.catalogo-container');

    // 3. Cria o esqueleto do novo card
    const novoCard = document.createElement('div');
    novoCard.classList.add('card-imovel');
    novoCard.setAttribute('data-tipo', tipo);

    // 4. Injeta o conteúdo (usando o padrão que você já criou)
    novoCard.innerHTML = `
        <div class="imagem-container">
            <div class="slideshow">
                <img src="${imgUrl}" class="active">
            </div>
            <span class="coracao-icon">🤍</span>
        </div>
        <div class="detalhes-imovel">
            <p class="tipo-local">${tipo.charAt(0).toUpperCase() + tipo.slice(1)} · ${local}</p>
            <p class="titulo-imovel">${titulo}</p>
            <div class="preco-container">
                <p class="preco-total">Total: <strong>Sob Consulta</strong></p>
            </div>
        </div>
    `;

    // 5. Adiciona o card à tela
    catalogo.appendChild(novoCard);

    // 6. Limpa os campos
    document.getElementById('novoTitulo').value = "";
    document.getElementById('novaImgUrl').value = "";
}