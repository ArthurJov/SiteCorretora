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
  query
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const WPP_NUMERO = "5573981028102";

// ─── SVG helpers ─────────────────────────────────────────────
function icone(nome) {
  const icones = {
    area:      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
    quartos:   '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20v-5a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v5"/><path d="M3 15h18"/></svg>',
    banheiros: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16"/><path d="M4 12a8 8 0 0 0 16 0"/><path d="M7 12V6a5 5 0 0 1 10 0v6"/><circle cx="7" cy="6" r="1"/></svg>',
    vagas:     '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/><path d="M8 7V5a2 2 0 0 0-4 0v2"/></svg>',
    local:     '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    seta:      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
  };
  return icones[nome] || '';
}

// ─── Formata preço conforme finalidade ───────────────────────
function formatarPreco(preco, finalidade) {
  const valor = Number(preco);
  if (!valor || valor === 0) {
    return '<span class="preco-consulta">Sob consulta</span>';
  }
  const formatado = valor.toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  });
  if (finalidade === 'aluguel')   return formatado + '<span>/mês</span>';
  if (finalidade === 'temporada') return 'A partir de ' + formatado + '<span>/diária</span>';
  return formatado;
}

// ─── Entrada principal ────────────────────────────────────────
async function carregarImoveis() {
  const loading = document.getElementById('catalogo-loading');
  const grid    = document.getElementById('catalogo-grid');

  try {
    const q = query(collection(db, 'imoveis'));
    const snapshot = await getDocs(q);

    if (loading) loading.style.display = 'none';
    if (!grid) return;

    if (snapshot.empty) {
      grid.innerHTML = '<p class="catalogo-vazio">Nenhum imóvel disponível no momento. Entre em contato pelo WhatsApp!</p>';
      return;
    }

    const imoveis = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.status !== 'vendido') {
        imoveis.push({ id: doc.id, ...data });
      }
    });

    // Ordenar: destaques primeiro, depois mais recentes
    imoveis.sort((a, b) => {
      const destA = a.destaque ? 1 : 0;
      const destB = b.destaque ? 1 : 0;
      if (destA !== destB) return destB - destA;

      const obterTempo = (campo) => {
        if (!campo) return 0;
        if (typeof campo.toMillis === 'function') return campo.toMillis();
        if (campo instanceof Date) return campo.getTime();
        if (campo.seconds) return campo.seconds * 1000 + (campo.nanoseconds || 0) / 1000000;
        const parsed = Date.parse(campo);
        return isNaN(parsed) ? 0 : parsed;
      };

      return obterTempo(b.criadoEm) - obterTempo(a.criadoEm);
    });

    grid.innerHTML = imoveis.map(renderCard).join('');

    // Iniciar slideshow automático após renderização
    if (typeof startAutoSlideshow === 'function') {
      startAutoSlideshow();
    }

  } catch (error) {
    if (loading) {
      loading.textContent = 'Erro ao carregar imóveis. Tente recarregar a página.';
      loading.style.color = '#c0392b';
    }
    console.error('Firestore erro:', error);
  }
}

// ─── Render de um card (design consistente com index.html) ────
function renderCard(imovel) {
  const fotos = (imovel.fotos && imovel.fotos.length > 0)
    ? imovel.fotos
    : ['assets/img/placeholder.jpg'];

  const local = imovel.localizacao || '';
  const tipoLabel = (imovel.tipo || '').charAt(0).toUpperCase() + (imovel.tipo || '').slice(1);

  // Badge de finalidade
  const labelMap  = { venda: 'Venda', aluguel: 'Aluguel', temporada: 'Temporada' };
  const classeMap = {
    venda:     'card-imovel__badge card-imovel__badge--venda',
    aluguel:   'card-imovel__badge card-imovel__badge--aluguel',
    temporada: 'card-imovel__badge card-imovel__badge--temporada'
  };
  const labelBadge  = labelMap[imovel.finalidade]  || '';
  const classeBadge = classeMap[imovel.finalidade] || '';
  const badge = labelBadge
    ? `<span class="${classeBadge}">${labelBadge}</span>`
    : '';

  // Slideshow HTML (múltiplas fotos)
  const slidesHTML = fotos.map((src, i) =>
    `<img src="${src}" alt="${imovel.titulo}" ${i === 0 ? 'class="active"' : ''} loading="${i === 0 ? 'eager' : 'lazy'}">`
  ).join('');

  // Botões de navegação (somente se tiver mais de 1 foto)
  const navBtns = fotos.length > 1 ? `
    <button class="card-imovel__nav card-imovel__nav--prev" onclick="event.stopPropagation(); changeSlide(this,-1)" aria-label="Foto anterior">&#10094;</button>
    <button class="card-imovel__nav card-imovel__nav--next" onclick="event.stopPropagation(); changeSlide(this,1)"  aria-label="Próxima foto">&#10095;</button>` : '';

  // Atributos
  const attrs = [
    imovel.area_m2  ? `<span class="card-imovel__attr">${icone('area')}${imovel.area_m2} m²</span>`                                                : '',
    imovel.quartos  ? `<span class="card-imovel__attr">${icone('quartos')}${imovel.quartos} suíte${imovel.quartos > 1 ? 's' : ''}</span>`           : '',
    imovel.banheiros ? `<span class="card-imovel__attr">${icone('banheiros')}${imovel.banheiros} banheiro${imovel.banheiros > 1 ? 's' : ''}</span>` : '',
    imovel.vagas > 0 ? `<span class="card-imovel__attr">${icone('vagas')}${imovel.vagas} vaga${imovel.vagas > 1 ? 's' : ''}</span>`                 : ''
  ].filter(Boolean).join('');

  return `
    <article class="card-imovel" role="listitem" data-id="${imovel.id}" data-tipo="${imovel.tipo || ''}" data-finalidade="${imovel.finalidade || ''}">
      <div class="card-imovel__foto-wrap">
        <div class="card-imovel__slideshow">
          ${slidesHTML}
        </div>
        ${badge}
        ${navBtns}
      </div>
      <div class="card-imovel__corpo">
        <p class="card-imovel__local">${icone('local')}${local ? (tipoLabel ? tipoLabel + ' · ' + local : local) : tipoLabel}</p>
        <h3 class="card-imovel__titulo">${imovel.titulo}</h3>
        <p class="card-imovel__preco">${formatarPreco(imovel.preco, imovel.finalidade)}</p>
        <hr class="card-imovel__divisor" aria-hidden="true" />
        <div class="card-imovel__atributos">${attrs}</div>
        <a
          class="card-imovel__cta"
          href="detalhes-imovel.html?id=${imovel.id}"
          aria-label="Ver detalhes: ${imovel.titulo}"
        >Ver Detalhes ${icone('seta')}</a>
      </div>
    </article>`;
}

function traduzirStatus(status) {
  const mapa = { disponivel: 'Disponível', vendido: 'Vendido', alugado: 'Alugado' };
  return mapa[status] || status;
}

// ─── Iniciar ──────────────────────────────────────────────────
carregarImoveis();
