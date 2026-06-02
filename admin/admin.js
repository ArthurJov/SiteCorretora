// =============================================================
// admin/admin.js — Lógica CRUD + Upload de Fotos (Cloudinary)
// -------------------------------------------------------------
// Upload de imagens: Cloudinary (tier gratuito — 25 GB storage)
// Não usa Firebase Storage (requer plano pago).
// Configurar as constantes abaixo com seus dados do Cloudinary.
// =============================================================

// ─────────────────────────────────────────────────────────────
// ⚙️  CONFIGURAÇÃO DO CLOUDINARY
// 1. Crie uma conta GRATUITA em https://cloudinary.com
// 2. No painel: Settings → Upload → Upload presets → Add preset
// 3. Defina o Signing mode como "Unsigned" e salve
// 4. Cole seu Cloud Name e o nome do preset abaixo:
// ─────────────────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME    = 'djmml0erj';
const CLOUDINARY_UPLOAD_PRESET = 'juscelia_unsigned';
// ─────────────────────────────────────────────────────────────

import { auth, db } from '../assets/js/firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// =============================================================
// ─── Guarda de rota ──────────────────────────────────────────
// =============================================================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace('index.html');
    return;
  }
  const el = document.getElementById('usuario-nome');
  if (el) el.textContent = user.email;
  iniciarPainel();
});

// ─── Logout ───────────────────────────────────────────────────
document.getElementById('btn-sair').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'index.html';
});

// =============================================================
// ─── Estado das fotos no modal ───────────────────────────────
// fotosAtuais: array de { url } — fonte de verdade para o form.
// =============================================================
let fotosAtuais = [];

function sincronizarHiddenFotos() {
  const urls = fotosAtuais.map(f => f.url);
  document.getElementById('campo-fotos-urls').value = JSON.stringify(urls);
}

// =============================================================
// ─── Upload para Cloudinary (gratuito, sem backend) ──────────
// Usa XMLHttpRequest para acompanhar o progresso em tempo real.
// Endpoint: POST https://api.cloudinary.com/v1_1/{cloud}/image/upload
// Requer apenas cloud_name e um upload_preset unsigned.
// =============================================================
async function uploadFotos(arquivos) {
  // Verificar configuração
  if (
    CLOUDINARY_CLOUD_NAME    === 'SEU_CLOUD_NAME' ||
    CLOUDINARY_UPLOAD_PRESET === 'SEU_UPLOAD_PRESET'
  ) {
    mostrarToast(
      '⚙️ Configure o Cloudinary no topo do admin.js antes de fazer upload.',
      'erro'
    );
    return;
  }

  const MAX_FOTOS = 10;
  const MAX_BYTES = 10 * 1024 * 1024; // 10 MB por arquivo

  const validos = Array.from(arquivos).filter(f => {
    if (!f.type.startsWith('image/')) {
      mostrarToast(`"${f.name}" não é uma imagem válida.`, 'erro');
      return false;
    }
    if (f.size > MAX_BYTES) {
      mostrarToast(`"${f.name}" excede o limite de 10 MB.`, 'erro');
      return false;
    }
    return true;
  });

  const vagas = MAX_FOTOS - fotosAtuais.length;
  if (vagas <= 0) {
    mostrarToast('Limite de 10 fotos atingido.', 'erro');
    return;
  }

  const paraEnviar = validos.slice(0, vagas);
  if (paraEnviar.length === 0) return;

  // Mostrar barra de progresso
  const progressoWrap  = document.getElementById('upload-progresso-wrap');
  const progressoBarra = document.getElementById('upload-progresso-barra');
  const progressoTexto = document.getElementById('upload-progresso-texto');
  progressoWrap.style.display = 'flex';
  progressoBarra.style.width  = '0%';

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  for (let i = 0; i < paraEnviar.length; i++) {
    const arquivo = paraEnviar[i];
    progressoTexto.textContent = `Enviando foto ${i + 1} de ${paraEnviar.length}…`;

    await new Promise((resolve) => {
      const formData = new FormData();
      formData.append('file', arquivo);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      // Pasta organizada no Cloudinary
      formData.append('folder', 'juscelia-imoveis');

      const xhr = new XMLHttpRequest();

      // Progresso do arquivo atual
      xhr.upload.addEventListener('progress', (e) => {
        if (!e.lengthComputable) return;
        const pctArquivo = e.loaded / e.total;
        const pctGlobal  = ((i + pctArquivo) / paraEnviar.length) * 100;
        progressoBarra.style.width  = `${Math.round(pctGlobal)}%`;
        progressoTexto.textContent  =
          `Enviando foto ${i + 1} de ${paraEnviar.length} (${Math.round(pctArquivo * 100)}%)`;
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const resposta = JSON.parse(xhr.responseText);
            const url = resposta.secure_url;
            fotosAtuais.push({ url });
            sincronizarHiddenFotos();
            adicionarPreview(url);
          } catch {
            mostrarToast(`Erro ao processar resposta do Cloudinary.`, 'erro');
          }
        } else {
          let msg = `Erro ao enviar "${arquivo.name}"`;
          try {
            const err = JSON.parse(xhr.responseText);
            msg += `: ${err.error?.message || xhr.statusText}`;
          } catch { /* sem detalhe */ }
          mostrarToast(msg, 'erro');
        }
        resolve();
      });

      xhr.addEventListener('error', () => {
        mostrarToast(`Falha de rede ao enviar "${arquivo.name}".`, 'erro');
        resolve();
      });

      xhr.open('POST', endpoint);
      xhr.send(formData);
    });
  }

  // Esconder barra ao terminar
  progressoWrap.style.display = 'none';
  progressoBarra.style.width  = '0%';
}

// =============================================================
// ─── Preview de fotos ────────────────────────────────────────
// =============================================================
function adicionarPreview(url, existente = false) {
  const grid = document.getElementById('fotos-preview-grid');

  const item = document.createElement('div');
  item.className = 'preview-item';
  item.dataset.url = url;

  item.innerHTML = `
    <img src="${url}" alt="Foto do imóvel" loading="lazy">
    <button type="button" class="preview-remover" title="Remover foto" aria-label="Remover foto">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
        width="14" height="14">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
    <span class="preview-badge ${existente ? 'preview-badge-existente' : ''}">
      ${existente ? 'Salva' : '✓ Enviada'}
    </span>
  `;

  item.querySelector('.preview-remover').addEventListener('click', () => {
    removerFotoLocal(url, item);
  });

  grid.appendChild(item);
}

// Remove apenas do preview e do array local (não apaga no Cloudinary)
function removerFotoLocal(url, itemEl) {
  fotosAtuais = fotosAtuais.filter(f => f.url !== url);
  sincronizarHiddenFotos();
  itemEl.classList.add('preview-saindo');
  setTimeout(() => itemEl.remove(), 250);
}

function limparPreviews() {
  document.getElementById('fotos-preview-grid').innerHTML = '';
  fotosAtuais = [];
  sincronizarHiddenFotos();
}

function carregarPreviewsExistentes(urls) {
  limparPreviews();
  if (!Array.isArray(urls)) return;
  urls.forEach(url => {
    fotosAtuais.push({ url });
    adicionarPreview(url, true);
  });
  sincronizarHiddenFotos();
}

// =============================================================
// ─── Zona de upload (clique + drag & drop) ───────────────────
// =============================================================
function iniciarZonaUpload() {
  const zona  = document.getElementById('zona-upload');
  const input = document.getElementById('campo-fotos-input');

  zona.addEventListener('click', () => input.click());
  zona.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });

  input.addEventListener('change', () => {
    if (input.files.length) uploadFotos(input.files);
    input.value = '';
  });

  zona.addEventListener('dragover',  (e) => { e.preventDefault(); zona.classList.add('drag-over'); });
  zona.addEventListener('dragleave', (e) => { if (!zona.contains(e.relatedTarget)) zona.classList.remove('drag-over'); });
  zona.addEventListener('drop', (e) => {
    e.preventDefault();
    zona.classList.remove('drag-over');
    if (e.dataTransfer.files.length) uploadFotos(e.dataTransfer.files);
  });
}

// =============================================================
// ─── Listagem em tempo real ──────────────────────────────────
// =============================================================
let imoveisCache = [];

function iniciarPainel() {
  iniciarZonaUpload();

  const q = query(collection(db, 'imoveis'), orderBy('criadoEm', 'desc'));

  onSnapshot(q, (snapshot) => {
    imoveisCache = [];
    snapshot.forEach(docSnap => imoveisCache.push({ id: docSnap.id, ...docSnap.data() }));
    aplicarFiltrosERendar();
  }, (error) => {
    mostrarToast('Erro ao carregar imóveis: ' + error.message, 'erro');
  });
}

// ─── Filtros ──────────────────────────────────────────────────
document.getElementById('filtro-status').addEventListener('change', aplicarFiltrosERendar);
document.getElementById('filtro-tipo').addEventListener('change', aplicarFiltrosERendar);

function aplicarFiltrosERendar() {
  const filtroStatus = document.getElementById('filtro-status').value;
  const filtroTipo   = document.getElementById('filtro-tipo').value;

  let lista = imoveisCache;
  if (filtroStatus) lista = lista.filter(i => i.status === filtroStatus);
  if (filtroTipo)   lista = lista.filter(i => i.tipo   === filtroTipo);

  atualizarContador(lista.length, imoveisCache.length);
  renderLista(lista);
}

function atualizarContador(filtrados, total) {
  const el = document.getElementById('contador-imoveis');
  if (!el) return;
  el.textContent = filtrados === total
    ? `${total} imóvel${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`
    : `${filtrados} de ${total} imóveis`;
}

// =============================================================
// ─── CRUD ─────────────────────────────────────────────────────
// =============================================================
async function adicionarImovel(dados) {
  await addDoc(collection(db, 'imoveis'), {
    ...dados,
    criadoEm:    serverTimestamp(),
    atualizadoEm: serverTimestamp()
  });
}

async function editarImovel(id, dados) {
  await updateDoc(doc(db, 'imoveis', id), {
    ...dados,
    atualizadoEm: serverTimestamp()
  });
}

async function excluirImovel(id, titulo) {
  const confirmado = confirm(
    `Tem certeza que deseja excluir o imóvel:\n"${titulo}"?\n\nEsta ação não pode ser desfeita.`
  );
  if (!confirmado) return;
  try {
    await deleteDoc(doc(db, 'imoveis', id));
    mostrarToast('Imóvel excluído com sucesso.', 'sucesso');
  } catch (err) {
    mostrarToast('Erro ao excluir: ' + err.message, 'erro');
  }
}

// =============================================================
// ─── Modal ────────────────────────────────────────────────────
// =============================================================
let modoEdicaoId = null;

function abrirModal(imovel = null) {
  modoEdicaoId = imovel?.id ?? null;
  const form   = document.getElementById('form-imovel');
  form.reset();
  limparPreviews();

  if (imovel) {
    const campos = ['titulo', 'tipo', 'finalidade', 'status', 'preco',
                    'area_m2', 'quartos', 'banheiros', 'vagas',
                    'localizacao', 'maps_url', 'descricao', 'wpp_msg'];

    campos.forEach(key => {
      const campo = form.elements[key];
      if (!campo) return;
      campo.value = (imovel[key] !== null && imovel[key] !== undefined) ? imovel[key] : '';
    });

    const campoDestaque = form.elements['destaque'];
    if (campoDestaque) campoDestaque.checked = Boolean(imovel.destaque);

    carregarPreviewsExistentes(imovel.fotos || []);
  }

  document.getElementById('modal-titulo').textContent =
    imovel ? 'Editar imóvel' : 'Adicionar imóvel';
  document.getElementById('btn-salvar').textContent =
    imovel ? 'Salvar alterações' : 'Salvar imóvel';

  document.getElementById('modal').style.display = 'flex';
  setTimeout(() => document.getElementById('campo-titulo')?.focus(), 100);
}

function fecharModal() {
  document.getElementById('modal').style.display = 'none';
  modoEdicaoId = null;
}

document.getElementById('btn-adicionar').addEventListener('click', () => abrirModal());
document.getElementById('btn-fechar-modal').addEventListener('click', fecharModal);
document.getElementById('btn-cancelar').addEventListener('click', fecharModal);
document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) fecharModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('modal').style.display !== 'none') fecharModal();
});

// =============================================================
// ─── Submit ───────────────────────────────────────────────────
// =============================================================
document.getElementById('form-imovel').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (document.getElementById('upload-progresso-wrap').style.display !== 'none') {
    mostrarToast('Aguarde o upload das fotos terminar antes de salvar.', 'erro');
    return;
  }

  const btn = document.getElementById('btn-salvar');
  btn.disabled    = true;
  btn.textContent = 'Salvando...';

  try {
    const dados = coletarDadosFormulario(e.target);

    if (modoEdicaoId) {
      await editarImovel(modoEdicaoId, dados);
      mostrarToast('Imóvel atualizado com sucesso! ✓', 'sucesso');
    } else {
      await adicionarImovel(dados);
      mostrarToast('Imóvel adicionado com sucesso! ✓', 'sucesso');
    }
    fecharModal();
  } catch (err) {
    mostrarToast('Erro ao salvar: ' + err.message, 'erro');
  } finally {
    btn.disabled    = false;
    btn.textContent = modoEdicaoId ? 'Salvar alterações' : 'Salvar imóvel';
  }
});

function coletarDadosFormulario(form) {
  const fotosRaw = document.getElementById('campo-fotos-urls').value;
  let fotos = [];
  try {
    const parsed = JSON.parse(fotosRaw);
    fotos = Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch { fotos = []; }

  const titulo  = (form.elements['titulo']?.value  || '').trim();
  const wpp_msg = (form.elements['wpp_msg']?.value || '').trim()
    || `Olá Juscelia! Tenho interesse no imóvel: ${titulo}`;

  return {
    titulo,
    tipo:        form.elements['tipo']?.value        || 'casa',
    finalidade:  form.elements['finalidade']?.value  || 'venda',
    status:      form.elements['status']?.value      || 'disponivel',
    preco:       Number(form.elements['preco']?.value)     || 0,
    area_m2:     form.elements['area_m2']?.value ? Number(form.elements['area_m2'].value) : null,
    quartos:     Number(form.elements['quartos']?.value)   || 0,
    banheiros:   Number(form.elements['banheiros']?.value) || 0,
    vagas:       Number(form.elements['vagas']?.value)     || 0,
    localizacao: (form.elements['localizacao']?.value || '').trim(),
    maps_url:    (form.elements['maps_url']?.value    || '').trim(),
    descricao:   (form.elements['descricao']?.value   || '').trim(),
    fotos,
    wpp_msg,
    destaque:    form.elements['destaque']?.checked ?? false
  };
}

// =============================================================
// ─── Render da lista ──────────────────────────────────────────
// =============================================================
function renderLista(imoveis) {
  const container = document.getElementById('lista-imoveis');

  if (imoveis.length === 0) {
    container.innerHTML = `
      <div class="lista-vazia">
        <span class="lista-vazia-icon">🏠</span>
        <p>Nenhum imóvel encontrado com os filtros selecionados.</p>
      </div>`;
    return;
  }

  container.innerHTML = imoveis.map(imovel => `
    <div class="card-admin" data-id="${imovel.id}">
      <img
        src="${imovel.fotos?.[0] || '../assets/img/placeholder.jpg'}"
        alt="${escaparHtml(imovel.titulo)}"
        class="card-admin-thumb"
        onerror="this.src='../assets/img/placeholder.jpg'"
        loading="lazy"
      >
      <div class="card-admin-info">
        <div class="card-admin-titulo-row">
          <strong class="card-admin-titulo">${escaparHtml(imovel.titulo)}</strong>
          ${imovel.destaque ? '<span class="badge-destaque" title="Destaque">⭐</span>' : ''}
        </div>
        <div class="card-admin-badges">
          <span class="badge-status badge-${imovel.status}">${traduzirStatus(imovel.status)}</span>
          <span class="badge-tipo">${escaparHtml(imovel.tipo || '')}</span>
          <span class="badge-finalidade">${escaparHtml(imovel.finalidade || '')}</span>
        </div>
        <small class="card-admin-local">📍 ${escaparHtml(imovel.localizacao || '—')}</small>
        <small class="card-admin-preco">
          ${Number(imovel.preco) > 0 ? 'R$ ' + Number(imovel.preco).toLocaleString('pt-BR') : 'Sob consulta'}
        </small>
        <small class="card-admin-detalhes">
          ${[
            imovel.quartos   ? `${imovel.quartos} qto${imovel.quartos > 1 ? 's' : ''}`     : '',
            imovel.banheiros ? `${imovel.banheiros} banheiro${imovel.banheiros > 1 ? 's' : ''}` : '',
            imovel.area_m2   ? `${imovel.area_m2} m²` : '',
            imovel.fotos?.length ? `${imovel.fotos.length} foto${imovel.fotos.length > 1 ? 's' : ''}` : ''
          ].filter(Boolean).join(' · ') || '—'}
        </small>
      </div>
      <div class="card-admin-acoes">
        <button class="btn-editar" data-id="${imovel.id}" title="Editar">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            width="14" height="14">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar
        </button>
        <button class="btn-excluir" data-id="${imovel.id}" data-titulo="${escaparHtml(imovel.titulo)}" title="Excluir">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            width="14" height="14">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          Excluir
        </button>
      </div>
    </div>
  `).join('');

  document.getElementById('lista-imoveis').addEventListener('click', handleListaClick);
}

async function handleListaClick(e) {
  const btnEditar  = e.target.closest('.btn-editar');
  const btnExcluir = e.target.closest('.btn-excluir');

  if (btnEditar) {
    try {
      const snap = await getDoc(doc(db, 'imoveis', btnEditar.dataset.id));
      if (snap.exists()) abrirModal({ id: snap.id, ...snap.data() });
    } catch (err) {
      mostrarToast('Erro ao carregar imóvel: ' + err.message, 'erro');
    }
    return;
  }

  if (btnExcluir) {
    await excluirImovel(btnExcluir.dataset.id, btnExcluir.dataset.titulo);
  }
}

// =============================================================
// ─── Utilitários ──────────────────────────────────────────────
// =============================================================
function traduzirStatus(s) {
  return { disponivel: 'Disponível', vendido: 'Vendido', alugado: 'Alugado' }[s] || s;
}

function escaparHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

let toastTimeout = null;
function mostrarToast(mensagem, tipo = 'sucesso') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  if (toastTimeout) clearTimeout(toastTimeout);
  toast.textContent = mensagem;
  toast.className   = `toast toast-${tipo} toast-visivel`;
  toastTimeout = setTimeout(() => toast.classList.remove('toast-visivel'), 4500);
}
