// =============================================================
// migration/migrate.js — Script de migração única
// -------------------------------------------------------------
// Popula o Firestore com os imóveis do data/imoveis.json.
// Executar UMA VEZ APENAS. Requer Node.js >= 18.
//
// Pré-requisitos:
//   1. Baixar serviceAccountKey.json do Firebase Console:
//      Configurações do projeto → Contas de serviço → Gerar nova chave
//   2. Salvar em: migration/serviceAccountKey.json
//   3. Garantir que migration/serviceAccountKey.json está no .gitignore
//
// Como rodar:
//   cd SiteCorretora
//   npm install firebase-admin
//   node migration/migrate.js
// =============================================================

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carregar credenciais e dados
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8')
);
const imoveis = JSON.parse(
  readFileSync(join(__dirname, '..', 'data', 'imoveis.json'), 'utf8')
);

// Inicializar Firebase Admin
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function migrar() {
  const colecao = db.collection('imoveis');

  console.log(`\n🚀 Iniciando migração de ${imoveis.length} imóveis...\n`);

  for (const imovel of imoveis) {
    // Garantir campos obrigatórios para o modelo de dados v3
    const doc = {
      titulo:      imovel.titulo      || '',
      tipo:        imovel.tipo        || 'casa',
      finalidade:  imovel.finalidade  || 'temporada',
      status:      imovel.status      || 'disponivel',   // campo novo
      preco:       imovel.preco       ?? 0,
      area_m2:     imovel.area_m2     ?? null,
      quartos:     imovel.quartos     ?? 0,
      banheiros:   imovel.banheiros   ?? 0,
      vagas:       imovel.vagas       ?? 0,
      descricao:   imovel.descricao   || '',
      fotos:       Array.isArray(imovel.fotos) ? imovel.fotos : [],
      localizacao: imovel.localizacao || '',
      maps_url:    imovel.maps_url    || '',
      destaque:    imovel.destaque    ?? false,
      wpp_msg:     imovel.wpp_msg     || `Olá Juscelia! Tenho interesse no imóvel: ${imovel.titulo}`,
      criadoEm:    Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    };

    const ref = await colecao.add(doc);
    console.log(`  ✓  ${imovel.titulo}  →  ID: ${ref.id}`);
  }

  console.log('\n✅ Migração concluída com sucesso!');
  console.log('   Verifique os dados em: https://console.firebase.google.com');
  process.exit(0);
}

migrar().catch(err => {
  console.error('\n❌ Erro durante a migração:', err.message);
  process.exit(1);
});
