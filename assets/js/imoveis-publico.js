// =============================================================
// imoveis-publico.js — Carregamento do catálogo no site público
// -------------------------------------------------------------
// Usa getDocs (leitura única) — NÃO onSnapshot.
// Motivo: onSnapshot mantém conexão WebSocket permanente,
// gerando leituras contínuas cobradas pela cota do Firestore.
// Para um site público com visitantes casuais, leitura única
// ao carregar a página é suficiente e muito mais eficiente.
// =============================================================

import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  orderBy,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const WPP_NUMERO = "5573981028102";

// ─── Entrada principal ────────────────────────────────────────
async function carregarImoveis() {
  const loading = document.getElementById('catalogo-loading');
  const grid    = document.getElementById('catalogo-grid');

  try {
    // Imóveis disponíveis ou alugados, destaques primeiro, mais recentes depois
    const q = query(
      collection(db, 'imoveis'),
      where('status', '!=', 'vendido'),
      orderBy('status'),
      orderBy('destaque', 'desc'),
      orderBy('criadoEm', 'desc')
    );
    const snapshot = await getDocs(q);

    loading.style.display = 'none';

    if (snapshot.empty) {
      grid.innerHTML = '<p class="catalogo-vazio">Nenhum imóvel disponível no momento. Entre em contato pelo WhatsApp!</p>';
      return;
    }

    const imoveis = [];
    snapshot.forEach(doc => imoveis.push({ id: doc.id, ...doc.data() }));

    renderTodos(imoveis);

    // Iniciar slideshow automático após renderização
    if (typeof startAutoSlideshow === 'function') {
      startAutoSlideshow();
    }

  } catch (error) {
    loading.textContent = 'Erro ao carregar imóveis. Tente recarregar a página.';
    loading.style.color = '#c0392b';
    console.error('Firestore erro:', error);
  }
}

// ─── Render de um card (mantém estrutura idêntica ao HTML original) ───────────
function renderCard(imovel) {
  const fotos = (imovel.fotos && imovel.fotos.length > 0)
    ? imovel.fotos
    : ['assets/img/placeholder.jpg'];

  const msgWpp = encodeURIComponent(
    imovel.wpp_msg || `Olá Juscelia! Tenho interesse no imóvel: ${imovel.titulo}`
  );

  // Linha "tipo · localização" igual ao original
  const tipoLabel = (imovel.tipo || '').charAt(0).toUpperCase() + (imovel.tipo || '').slice(1);
  const local     = imovel.localizacao || '';

  // Preço formatado
  const preco = Number(imovel.preco);
  const precoStr = preco > 0
    ? `R$ ${preco.toLocaleString('pt-BR')}`
    : 'Sob Consulta';

  // Detalhes opcionais (quartos, banheiros, área)
  const quartosTxt  = imovel.quartos  ? `${imovel.quartos} quarto${imovel.quartos > 1 ? 's' : ''}` : '';
  const banheirosTxt = imovel.banheiros ? `${imovel.banheiros} banheiro${imovel.banheiros > 1 ? 's' : ''}` : '';
  const detalhesStr = [quartosTxt, banheirosTxt]
    .filter(Boolean).join(' · ');

  // Imagens do slideshow
  const slidesHTML = fotos.map((src, i) =>
    `<img src="${src}" alt="${imovel.titulo}" ${i === 0 ? 'class="active"' : ''} loading="${i === 0 ? 'eager' : 'lazy'}">`
  ).join('\n                    ');

  // Badge de status (apenas se não for disponivel)
  const badgeStatus = imovel.status && imovel.status !== 'disponivel'
    ? `<span class="badge-status badge-${imovel.status}">${traduzirStatus(imovel.status)}</span>`
    : '';

  // Botões de navegação do slideshow (só se tiver mais de 1 foto)
  const navBtns = fotos.length > 1 ? `
                <button class="nav-btn prev" onclick="changeSlide(this, -1)">&#10094;</button>
                <button class="nav-btn next" onclick="changeSlide(this, 1)">&#10095;</button>` : '';

  return `
        <div class="card-imovel" data-tipo="${imovel.tipo || ''}" data-finalidade="${imovel.finalidade || ''}">
            <div class="imagem-container">
                <div class="slideshow">
                    ${slidesHTML}
                </div>${navBtns}
                <span class="coracao-icon">🤍</span>
                ${badgeStatus}
            </div>
            <div class="detalhes-imovel">
                <p class="tipo-local">${tipoLabel}${local ? ' · ' + local : ''}</p>
                <p class="titulo-imovel">${imovel.titulo}</p>
                ${detalhesStr ? `<p class="quartos-camas">${detalhesStr}</p>` : ''}
                <div class="preco-container">
                    <p class="preco-total">Total: <strong>${precoStr}</strong></p>
                </div>
                <a class="btn-interesse"
                   href="https://wa.me/${WPP_NUMERO}?text=${msgWpp}"
                   target="_blank" rel="noopener noreferrer"
                   aria-label="Falar com Juscelia sobre ${imovel.titulo}">
                  Tenho interesse
                </a>
            </div>
        </div>`;
}

function traduzirStatus(status) {
  const mapa = { disponivel: 'Disponível', vendido: 'Vendido', alugado: 'Alugado' };
  return mapa[status] || status;
}

// ─── Renderiza todos os cards no DOM ─────────────────────────
function renderTodos(imoveis) {
  const grid = document.getElementById('catalogo-grid');
  grid.innerHTML = imoveis.map(renderCard).join('');
}

// ─── Iniciar ──────────────────────────────────────────────────
carregarImoveis();
