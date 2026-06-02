// =============================================================
// firebase-config.js — Módulo Firebase compartilhado
// -------------------------------------------------------------
// REGRA: Este é o ÚNICO arquivo do projeto que contém o
// firebaseConfig. Todos os outros importam db e auth daqui.
// Imagens são hospedadas no Cloudinary (gratuito) — sem Storage.
// Nunca duplicar as credenciais em outro arquivo.
// =============================================================

import { initializeApp }  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDuT7JpQYddL_gNRJesh0mVmBEVS4GE1lg",
  authDomain:        "juscelia-imoveis.firebaseapp.com",
  projectId:         "juscelia-imoveis",
  storageBucket:     "juscelia-imoveis.firebasestorage.app",
  messagingSenderId: "1052238934600",
  appId:             "1:1052238934600:web:78d4018faa6ff7566ade7d"
};

const app = initializeApp(firebaseConfig);

export const db      = getFirestore(app);
export const auth    = getAuth(app);
