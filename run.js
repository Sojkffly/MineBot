#!/usr/bin/env node

/**
 * run.js
 * 🚀 Script simples para rodar o bot em modo produção
 * 
 * npm start ou: node run.js
 */

const fs = require('fs')

console.log(`
════════════════════════════════════════════════════════════════
🤖 MINEAI - Bot de Aprendizado
════════════════════════════════════════════════════════════════
`)

// Validações rápidas
console.log('🔍 Validações:')

if (!fs.existsSync('./node_modules/mineflayer')) {
    console.error('❌ Mineflayer não instalado')
    console.log('   Rode: npm install')
    process.exit(1)
}
console.log('  ✅ Dependências OK')

if (!fs.existsSync('./sensors.js')) {
    console.error('❌ sensors.js não encontrado')
    process.exit(1)
}
console.log('  ✅ Arquivos OK')

console.log(`
🎯 Configuração:
  Host: localhost:25565
  Username: AI_Bot
  
🚀 Iniciando conexão...
════════════════════════════════════════════════════════════════
`)

require('./index.js')
