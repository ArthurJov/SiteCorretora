/**
 * main.js — Lógica principal do site Juscelia Sousa
 * -------------------------------------------------------
 * Responsabilidades:
 *  1. Comportamento do cabeçalho ao rolar a página
 *  2. Abertura e fechamento do menu mobile (hambúrguer)
 * -------------------------------------------------------
 */

(function () {
  'use strict';

  /* ============================================================
     === ELEMENTOS DO DOM =====================================
     ============================================================ */
  const cabecalho    = document.getElementById('cabecalho');
  const btnHamburger = document.getElementById('btn-hamburger');
  const menuMobile   = document.getElementById('menu-mobile');
  const linksMobile  = document.querySelectorAll('[data-link-mobile]');

  /* ============================================================
     === COMPORTAMENTO DO CABEÇALHO AO ROLAR ==================
     ============================================================ */
  function aoRolar() {
    if (window.scrollY > 10) {
      cabecalho.classList.add('scrolled');
    } else {
      cabecalho.classList.remove('scrolled');
    }
  }

  /* Ouve o evento de rolagem de forma performática */
  window.addEventListener('scroll', aoRolar, { passive: true });

  /* Executa uma vez ao carregar, caso a página já esteja rolada */
  aoRolar();

  /* ============================================================
     === MENU HAMBÚRGUER (MOBILE) =============================
     ============================================================ */

  /** Abre o menu mobile e bloqueia a rolagem do fundo */
  function abrirMenu() {
    menuMobile.classList.add('open');
    menuMobile.setAttribute('aria-hidden', 'false');
    btnHamburger.setAttribute('aria-expanded', 'true');
    btnHamburger.setAttribute('aria-label', 'Fechar menu');
    document.body.style.overflow = 'hidden';
  }

  /** Fecha o menu mobile e libera a rolagem */
  function fecharMenu() {
    menuMobile.classList.remove('open');
    menuMobile.setAttribute('aria-hidden', 'true');
    btnHamburger.setAttribute('aria-expanded', 'false');
    btnHamburger.setAttribute('aria-label', 'Abrir menu');
    document.body.style.overflow = '';
  }

  /* Alterna o menu ao clicar no botão hambúrguer */
  btnHamburger.addEventListener('click', function () {
    const estaAberto = menuMobile.classList.contains('open');
    if (estaAberto) {
      fecharMenu();
    } else {
      abrirMenu();
    }
  });

  /* Fecha o menu ao clicar em qualquer link interno */
  linksMobile.forEach(function (link) {
    link.addEventListener('click', function () {
      fecharMenu();
    });
  });

  /* Fecha o menu ao pressionar a tecla Escape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuMobile.classList.contains('open')) {
      fecharMenu();
      btnHamburger.focus();
    }
  });

  /* Fecha o menu ao redimensionar a tela para desktop */
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024 && menuMobile.classList.contains('open')) {
      fecharMenu();
    }
  });

})();
