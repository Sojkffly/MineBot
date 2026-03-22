/**
 * test-run.js
 * 🧪 FASE 1: Teste Real no Servidor
 * 
 * Roda o bot por 20 minutos com coleta de dados:
 * - Eventos críticos (morte, bug, decisão estranha)
 * - Métrica de progresso (recursos coletados)
 * - Padrões de comportamento
 * 
 * Executa: node test-run.js
 */

const fs = require('fs')
const path = require('path')

// Validar dependências
console.log('🔍 Validando dependências...')
try {
    require('mineflayer')
    require('mineflayer-pathfinder')
    require('minecraft-data')
    console.log('✅ Todas as dependências presentes\n')
} catch (e) {
    console.error('❌ Dependência faltando:', e.message)
    console.log('Rode: npm install')
    process.exit(1)
}

// Arquivo de log para teste
const testLogFile = path.join(__dirname, 'logs', `test-run-${Date.now()}.json`)
const logDir = path.dirname(testLogFile)
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })

const testData = {
    startTime: new Date(),
    endTime: null,
    duration: 0,
    events: [],
    observations: [],
    stats: {
        actions: 0,
        explorations: 0,
        exploitations: 0,
        deaths: 0,
        errors: 0,
        subGoalChanges: 0
    }
}

// Interceptar eventos do bot
function createBotWrapper() {
    const mineflayer = require('mineflayer')
    const OrigBot = mineflayer.createBot

    return function wrappedCreateBot(options) {
        const bot = OrigBot.call(mineflayer, options)

        // Interceptar eventos
        const originalEmit = bot.emit
        bot.emit = function(event, ...args) {
            if (['health', 'death', 'error'].includes(event)) {
                testData.events.push({
                    timestamp: new Date(),
                    type: event,
                    data: args[0]?.toString?.() || args[0]
                })
            }
            return originalEmit.apply(bot, [event, ...args])
        }

        return bot
    }
}

// Monkey-patch mineflayer
require.cache[require.resolve('mineflayer')].exports.createBot = createBotWrapper().call(require('mineflayer'))

// Importar index.js e injetar observer
const originalThink = require('./brain').think
let actionCount = 0
let lastSubGoal = null

require('./brain').think = async function(bot, actions, sensors, state) {
    testData.stats.actions++

    // Detectar mudança de subGoal
    if (state.subGoal !== lastSubGoal) {
        testData.stats.subGoalChanges++
        testData.observations.push({
            timestamp: new Date(),
            type: 'MILESTONE',
            message: `Progresso: ${lastSubGoal} → ${state.subGoal}`
        })
        lastSubGoal = state.subGoal
    }

    // Detectar exploração vs exploição
    if (state.lastExploration) {
        testData.stats.explorations++
    } else if (actionCount > 0) {
        testData.stats.exploitations++
    }

    // Chamar brain.think original
    return originalThink.call(this, bot, actions, sensors, state)
}

// Rodar
console.log(`
════════════════════════════════════════════════════════════════
🎮 TESTE REAL - FASE 1
════════════════════════════════════════════════════════════════
✅ Validações: OK
📍 Servidor esperado: localhost:25565
⏱️  Duração: 20 minutos (ajuste em actions/variables)
📊 Coleta de dados: ${testLogFile}

⚠️  GARANTA QUE:
  1. Servidor Minecraft está rodando em localhost:25565
  2. Criative mode OU survival com comida disponível
  3. Spawn area com madeira, pedra, iron ore visíveis

🚀 Iniciando em 3s...
════════════════════════════════════════════════════════════════
`)

setTimeout(() => {
    require('./index.js')

    // Salvar log a cada 60 segundos
    const saveInterval = setInterval(() => {
        testData.endTime = new Date()
        testData.duration = (testData.endTime - testData.startTime) / 1000

        fs.writeFileSync(testLogFile, JSON.stringify(testData, null, 2))
    }, 60000)

    // Parar após 20 minutos (1200 segundos)
    setTimeout(() => {
        clearInterval(saveInterval)
        testData.endTime = new Date()
        testData.duration = (testData.endTime - testData.startTime) / 1000

        console.log(`
════════════════════════════════════════════════════════════════
✅ TESTE COMPLETO - 20 MINUTOS
════════════════════════════════════════════════════════════════
📊 Estatísticas:
  • Total de ações: ${testData.stats.actions}
  • Explorações (ε-greedy): ${testData.stats.explorations}
  • Exploitações: ${testData.stats.exploitations}
  • Mudanças de fase: ${testData.stats.subGoalChanges}
  • Eventos críticos: ${testData.events.length}
  • Observações: ${testData.observations.length}

📁 Log completo: ${testLogFile}

🔍 PróXIMA FASE: Fazer script automatizado baseado em achados
════════════════════════════════════════════════════════════════
        `)

        fs.writeFileSync(testLogFile, JSON.stringify(testData, null, 2))
        process.exit(0)
    }, 20 * 60 * 1000) // 20 minutos

}, 3000)
