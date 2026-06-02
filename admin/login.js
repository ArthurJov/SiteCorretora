// =============================================================
// admin/login.js — Lógica de autenticação da tela de login
// =============================================================

import { auth } from '../assets/js/firebase-config.js';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

// ─── Guarda de rota: se já autenticado, vai direto pro painel ─
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = 'painel.html';
  }
});

// ─── Toggle de visibilidade da senha ─────────────────────────
const btnVerSenha     = document.getElementById('btn-ver-senha');
const inputSenha      = document.getElementById('senha');
const iconeOlhoFechado = document.getElementById('icone-olho-fechado');
const iconeOlhoAberto  = document.getElementById('icone-olho-aberto');

btnVerSenha.addEventListener('click', () => {
  const visivel = inputSenha.type === 'text';
  inputSenha.type = visivel ? 'password' : 'text';
  iconeOlhoFechado.style.display = visivel ? ''      : 'none';
  iconeOlhoAberto.style.display  = visivel ? 'none'  : '';
  btnVerSenha.setAttribute('aria-label', visivel ? 'Mostrar senha' : 'Ocultar senha');
});

// ─── Login ────────────────────────────────────────────────────
const formLogin = document.getElementById('form-login');
const btnEntrar = document.getElementById('btn-entrar');
const erroEl    = document.getElementById('erro-login');
const infoEl    = document.getElementById('info-recuperar');

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const senha  = document.getElementById('senha').value;

  // Limpar mensagens anteriores
  erroEl.textContent = '';
  infoEl.textContent = '';

  // Estado de carregamento
  btnEntrar.disabled     = true;
  btnEntrar.textContent  = 'Entrando...';

  try {
    await signInWithEmailAndPassword(auth, email, senha);
    // onAuthStateChanged detecta o login e redireciona automaticamente
  } catch (err) {
    // Nunca expor mensagens técnicas do Firebase ao usuário
    erroEl.textContent    = 'E-mail ou senha incorretos. Tente novamente.';
    btnEntrar.disabled    = false;
    btnEntrar.textContent = 'Entrar';
    console.error('Login erro:', err.code);
  }
});

// ─── Recuperação de senha ─────────────────────────────────────
document.getElementById('btn-recuperar').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();

  erroEl.textContent = '';
  infoEl.textContent = '';

  if (!email) {
    erroEl.textContent = 'Digite o e-mail no campo acima antes de recuperar a senha.';
    document.getElementById('email').focus();
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    infoEl.textContent = '✓ E-mail de recuperação enviado. Verifique sua caixa de entrada.';
  } catch (err) {
    erroEl.textContent = 'Não foi possível enviar o e-mail. Verifique o endereço digitado.';
    console.error('Reset senha erro:', err.code);
  }
});
