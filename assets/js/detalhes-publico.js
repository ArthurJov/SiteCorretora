import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const WPP_NUMERO = "5573981028102";

// Função auxiliar para query params
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// Expõe a função de slide para o onclick do HTML
window.changeSlideDetalhes = function(btn, direction) {
  const slideshow = btn.closest('.galeria-principal').querySelector('.slideshow');
  const images = slideshow.querySelectorAll('img');
  if (images.length <= 1) return;

  let currentIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
  
  let newIndex = currentIndex + direction;
  if (newIndex >= images.length) newIndex = 0;
  if (newIndex < 0) newIndex = images.length - 1;
  
  images.forEach(img => img.classList.remove('active'));
  images[newIndex].classList.add('active');
};

async function loadImovel() {
  const idParam = getQueryParam('id');
  if (!idParam) {
    document.getElementById('descricao').textContent = 'Nenhum imóvel selecionado.';
    return;
  }

  try {
    const docRef = doc(db, 'imoveis', idParam);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      document.getElementById('descricao').textContent = 'Imóvel não encontrado.';
      return;
    }

    const item = { id: docSnap.id, ...docSnap.data() };

    // Preencher DOM
    document.getElementById('tituloImovel').textContent = item.titulo || '—';
    document.getElementById('tipoLocal').textContent = 
      (item.tipo ? item.tipo.toUpperCase() : '—') + ' · ' + 
      (item.finalidade ? item.finalidade.toUpperCase() : '');
    
    document.getElementById('area').textContent = item.area_m2 ? item.area_m2 + ' m²' : '—';
    document.getElementById('quartos').textContent = item.quartos || '—';
    document.getElementById('banheiros').textContent = item.banheiros || '—';
    document.getElementById('vagas').textContent = item.vagas > 0 ? item.vagas : '—';
    document.getElementById('localizacao').textContent = item.localizacao || '—';
    
    // Preço formatado
    const precoElement = document.getElementById('preco');
    if (item.preco) {
      precoElement.textContent = 'R$ ' + Number(item.preco).toLocaleString('pt-BR');
    } else {
      precoElement.textContent = 'Sob consulta';
    }

    document.getElementById('descricao').textContent = item.descricao || '';

    // Galeria com slideshow
    const slideshow = document.getElementById('slideshow');
    slideshow.innerHTML = '';
    
    const fotos = (item.fotos && item.fotos.length > 0) ? item.fotos : ['assets/img/placeholder.jpg'];
    fotos.forEach((f, i) => {
      const img = document.createElement('img');
      img.src = f;
      img.alt = item.titulo + ' - foto ' + (i + 1);
      if (i === 0) img.classList.add('active');
      slideshow.appendChild(img);
    });

    // WhatsApp link
    const wppLink = document.getElementById('wppLink');
    const wppMsg = item.wpp_msg || 
      ('Olá! Tenho interesse no imóvel: ' + (item.titulo || 'imóvel') + ' em ' + (item.localizacao || 'sua região'));
    wppLink.href = 'https://wa.me/' + WPP_NUMERO + '?text=' + encodeURIComponent(wppMsg);

    // Google Maps link
    const mapsLink = document.getElementById('mapsLink');
    if (item.maps_url) {
      mapsLink.href = item.maps_url;
      mapsLink.style.display = 'flex';
    } else {
      mapsLink.style.display = 'none';
    }

  } catch (err) {
    console.error('Erro ao carregar imóvel:', err);
    document.getElementById('descricao').textContent = 
      'Não foi possível carregar os detalhes do imóvel.';
  }
}

// Atualizar ano do footer
const footerAno = document.getElementById('footer-ano');
if(footerAno) footerAno.textContent = new Date().getFullYear();

loadImovel();
