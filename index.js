const mineflayer = require('mineflayer')
const { pathfinder, Movements } = require('mineflayer-pathfinder')

const brain = require('./brain')
const actions = require('./actions')
const sensors = require('./sensors')
const initialState = require('./state')
const logger = require('./logger')

// Suprimir logs de debug/erro do mineflayer
const originalConsoleError = console.error
const originalConsoleLog = console.log

function isNoiseMessage(message) {
    if (!message) return false
    return (
        message.includes('Chunk size is') ||
        message.includes('partial packet') ||
        message.includes('move_minecart') ||
        message.includes('packet') && message.includes('decode failure')
    )
}

console.error = function(...args) {
    const message = args[0]?.toString() || ''

    if (isNoiseMessage(message)) {
        return
    }

    originalConsoleError.apply(console, args)
}

console.log = function(...args) {
    const message = args[0]?.toString() || ''

    if (isNoiseMessage(message)) {
        return
    }

    originalConsoleLog.apply(console, args)
}

const bot = mineflayer.createBot({
    host: 'localhost',
    port: 25565,
    username: 'AI_Bot',
    version: false
})

// Limpar logs antigos
logger.cleanOldLogs()

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms))
}

async function brainLoop() {
    const state = { ...initialState }  // Copiar state inicial
    while (true) {
        try {
            await brain.think(bot, actions, sensors, state)
        } catch (e) {
            console.log("Erro:", e)
        }

        await sleep(800) // loop mais responsivo
    }
}

bot.on('spawn', () => {
    console.log('✅ Bot entrou')
    console.log('🔧 Configurando pathfinder...')

    bot.loadPlugin(pathfinder)

    const mcData = require('minecraft-data')(bot.version)
    const defaultMove = new Movements(bot, mcData)

    // Evitar que o bot cave desnecessariamente
    defaultMove.canDig = false
    // Permitir subidas naturais sem scaffolding excessivo
    defaultMove.maxUpStep = 2.5
    defaultMove.maxDropDown = 3
    defaultMove.canPlaceBlocks = false
    defaultMove.canUseRapids = false

    bot.pathfinder.setMovements(defaultMove)
    console.log('✅ Pathfinder configurado!')
    console.log('   📝 CanDig: false (não cava)')
    console.log('   📝 CanPlaceBlocks: false (sobe naturalmente)')
    console.log('   📝 MaxUpStep: 2.5 blocos')
    console.log('   📝 MaxDropDown: 3 blocos\n')
    console.log('🧠 Brain iniciando...\n')

    brainLoop()
})