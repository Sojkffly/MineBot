const { goals } = require('mineflayer-pathfinder')

async function mineStoneBlock(bot, block) {
    if (!block) return false

    try {
        const tool = bot.inventory.items().find(item => item.name.includes('pickaxe'))
        
        if (tool) {
            await bot.equip(tool, 'hand')
        }

        console.log(`   ⛏️  Minerando: ${block.name}`)
        await bot.dig(block)
        console.log(`   ✅ Coletou: ${block.name}`)
        return true
    } catch (e) {
        console.log(`   ❌ Erro ao minerar: ${e.message}`)
        return false
    }
}

module.exports = {
    name: "mine_stone",

    async execute(bot, state, sensors) {
        const env = sensors.getEnvironment(bot)

        if (!env.stoneNearby) {
            console.log(`   ℹ️  Nenhuma pedra visível`)
            return { success: false, reward: -0.5 }
        }

        console.log(`   📍 Pedra em: (${Math.round(env.stoneNearby.position.x)}, ${Math.round(env.stoneNearby.position.y)}, ${Math.round(env.stoneNearby.position.z)})`)

        const goal = new goals.GoalBlock(
            env.stoneNearby.position.x,
            env.stoneNearby.position.y,
            env.stoneNearby.position.z
        )

        bot.pathfinder.setGoal(goal)
        console.log(`   🧭 Caminhando para pedra...`)

        // Espera chegar perto
        await bot.waitForTicks(40)

        const target = bot.blockAt(env.stoneNearby.position)
        let collected = false

        if (target) {
            collected = await mineStoneBlock(bot, target)
        } else {
            console.log(`   ⚠️  Bloco desapareceu`)
        }

        bot.pathfinder.setGoal(null)
        
        return {
            success: collected,
            reward: collected ? 1 : -0.5
        }
    }
}