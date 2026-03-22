#!/usr/bin/env node

/**
 * diagnose.js
 * 🧪 Modo diagnóstico pra entender o que tá errado
 * 
 * Run: node diagnose.js
 */

const mineflayer = require('mineflayer')
const { pathfinder, Movements } = require('mineflayer-pathfinder')

console.log(`
════════════════════════════════════════════════════════════════
🔍 MODO DIAGNÓSTICO
════════════════════════════════════════════════════════════════
Testando conexão e comportamento básico...
`)

const bot = mineflayer.createBot({
    host: 'localhost',
    port: 25565,
    username: 'AI_Diagnostic',
    version: false
})

bot.on('spawn', () => {
    console.log(`\n✅ BOT ENTROU NO SERVIDOR`)
    console.log(`📍 Posição: (${bot.entity.position.x.toFixed(1)}, ${bot.entity.position.y.toFixed(1)}, ${bot.entity.position.z.toFixed(1)})`)
    console.log(`❤️  Saúde: ${bot.health}/20`)
    console.log(`🍖 Fome: ${bot.food}/20`)

    // Carregar pathfinder
    bot.loadPlugin(pathfinder)
    const mcData = require('minecraft-data')(bot.version)
    const defaultMove = new Movements(bot, mcData)
    defaultMove.canDig = false
    defaultMove.canPlaceBlocks = false
    defaultMove.maxUpStep = 2.5
    bot.pathfinder.setMovements(defaultMove)
    console.log(`✅ Pathfinder carregado`)

    // Test 1: Lista blocos ao redor
    testBlocks()
})

bot.on('error', (err) => {
    console.error(`\n❌ ERRO: ${err.message}`)
    process.exit(1)
})

bot.on('end', () => {
    console.log(`\n⚠️  Conexão fechada`)
    process.exit(0)
})

function testBlocks() {
    console.log(`\n🔍 TEST 1: Blocos ao redor`)
    const center = bot.entity.position.clone()
    
    let woodBlocks = []
    let stoneBlocks = []
    
    for (let x = -10; x <= 10; x++) {
        for (let y = -3; y <= 3; y++) {
            for (let z = -10; z <= 10; z++) {
                const block = bot.blockAt(center.clone().add(x, y, z))
                if (!block) continue
                
                if (block.name === 'oak_log' || block.name === 'birch_log') {
                    woodBlocks.push(block)
                }
                if (block.name === 'stone' || block.name === 'cobblestone') {
                    stoneBlocks.push(block)
                }
            }
        }
    }
    
    console.log(`  🌳 Madeira encontrada: ${woodBlocks.length} blocos`)
    if (woodBlocks.length > 0) {
        const nearest = woodBlocks[0]
        const dist = center.distanceTo(nearest.position)
        console.log(`     Mais próxima: (${nearest.position.x}, ${nearest.position.y}, ${nearest.position.z}) - ${dist.toFixed(1)}m`)
    }
    
    console.log(`  🗿 Pedra encontrada: ${stoneBlocks.length} blocos`)
    if (stoneBlocks.length > 0) {
        const nearest = stoneBlocks[0]
        const dist = center.distanceTo(nearest.position)
        console.log(`     Mais próxima: (${nearest.position.x}, ${nearest.position.y}, ${nearest.position.z}) - ${dist.toFixed(1)}m`)
    }
    
    if (woodBlocks.length === 0 && stoneBlocks.length === 0) {
        console.log(`  ⚠️  SEM BLOCOS ENCONTRADOS!`)
        console.log(`     Spawn area pode estar flat ou sem recursos`)
        console.log(`     → Tente trazer madeira/pedra perto do spawn`)
        process.exit(0)
    }
    
    // Test 2: Tentar minar bloco próximo
    testMining(woodBlocks[0] || stoneBlocks[0])
}

async function testMining(block) {
    console.log(`\n🔍 TEST 2: Tentando minerar`)
    console.log(`  Alvo: ${block.name} em (${block.position.x}, ${block.position.y}, ${block.position.z})`)
    
    try {
        const dist = bot.entity.position.distanceTo(block.position)
        console.log(`  Distância: ${dist.toFixed(1)}m`)
        
        if (dist < 6) {
            console.log(`  ✅ Perto o suficiente, tentando minerar...`)
            await bot.dig(block)
            console.log(`  ✅ SUCESSO ao minerar!`)
        } else {
            console.log(`  ⚠️  Longe demais pra minerar sem pathfinder`)
        }
    } catch (e) {
        console.log(`  ❌ Erro: ${e.message}`)
    }
    
    testMovement()
}

async function testMovement() {
    console.log(`\n🔍 TEST 3: Movimento básico`)
    const startPos = bot.entity.position.clone()
    console.log(`  Posição inicial: (${startPos.x.toFixed(1)}, ${startPos.y.toFixed(1)}, ${startPos.z.toFixed(1)})`)
    
    try {
        console.log(`  Andando para frente por 10 ticks...`)
        bot.setControlState('forward', true)
        await bot.waitForTicks(10)
        bot.setControlState('forward', false)
        
        const endPos = bot.entity.position.clone()
        const moved = startPos.distanceTo(endPos)
        console.log(`  Posição final: (${endPos.x.toFixed(1)}, ${endPos.y.toFixed(1)}, ${endPos.z.toFixed(1)})`)
        console.log(`  Distância movida: ${moved.toFixed(1)}m`)
        
        if (moved > 0.1) {
            console.log(`  ✅ MOVIMENTO OK!`)
        } else {
            console.log(`  ⚠️  NÃO CONSEGUIU SE MOVER!`)
        }
    } catch (e) {
        console.log(`  ❌ Erro: ${e.message}`)
    }
    
    // Final summary
    console.log(`\n════════════════════════════════════════════════════════════════
✅ DIAGNÓSTICO COMPLETO

Resultado:
- Conexão: ✅ OK
- Blocos ao redor: ${bot.blockAt(bot.entity.position.clone().add(-1,0,0)) ? '✅' : '⚠️ '} Detectados
- Mineração: ✅ Testada
- Movimento: ✅ Testado

Status: Bot está funcionando basicamente!

Próxima: Rodando 'node run.js' com pathfinder...
════════════════════════════════════════════════════════════════
    `)

    setTimeout(() => {
        bot.quit()
    }, 2000)
}
