const { goals } = require('mineflayer-pathfinder')

async function mineBlock(bot, block) {
    if (!block) return false

    try {
        console.log(`   ⛏️  Minerando: ${block.name}`)
        await bot.dig(block)
        console.log(`   ✅ Quebrou: ${block.name}`)
        return true
    } catch (e) {
        console.log(`   ❌ Erro ao minerar: ${e.message}`)
        return false
    }
}

module.exports = {
    name: "collect_wood",

    async execute(bot, state, sensors) {
        const env = sensors.getEnvironment(bot)

        if (!env.woodNearby) {
            console.log(`   ℹ️  Madeira desapareceu`)
            return { success: false, reward: -0.5 }
        }

        console.log(`   📍 Madeira em: (${Math.round(env.woodNearby.position.x)}, ${Math.round(env.woodNearby.position.y)}, ${Math.round(env.woodNearby.position.z)})`)

        const woodPos = env.woodNearby.position
        const dist = bot.entity.position.distanceTo(woodPos)
        
        // Se já está perto, minera direto
        if (dist < 5) {
            console.log(`   ⛏️  Madeira perto! (${dist.toFixed(1)}m)`)
            const target = bot.blockAt(woodPos)
            if (target) {
                const success = await mineBlock(bot, target)
                return {
                    success: success,
                    reward: success ? 1 : -0.5
                }
            }
        }

        // Se está longe, tenta andar na direção
        try {
            console.log(`   🚶 Andando pra madeira... (${dist.toFixed(1)}m)`)
            const goal = new goals.GoalBlock(
                Math.floor(woodPos.x),
                Math.floor(woodPos.y),
                Math.floor(woodPos.z)
            )

            bot.pathfinder.setGoal(goal, false)
            
            // Espera até 120 ticks (máximo 6 segundos) pra chegar ou desistir
            for (let i = 0; i < 120; i++) {
                const currentDist = bot.entity.position.distanceTo(woodPos)
                if (currentDist < 5) {
                    console.log(`   ✅ Chegou perto: ${currentDist.toFixed(1)}m`)
                    break
                }
                await bot.waitForTicks(1)
            }

            bot.pathfinder.setGoal(null)
        } catch (e) {
            console.log(`   ⚠️  Pathfinder falhou: ${e.message}`)
            bot.pathfinder.setGoal(null)
        }

        // Tentar minerar agora que chegou perto
        const target = bot.blockAt(woodPos)
        let collected = false
        
        if (target) {
            collected = await mineBlock(bot, target)
        } else {
            console.log(`   ⚠️  Bloco desapareceu`)
        }
        
        return {
            success: collected,
            reward: collected ? 1 : -0.5
        }
    }
}