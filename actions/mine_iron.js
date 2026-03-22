const { goals } = require('mineflayer-pathfinder')

module.exports = {
    name: "mine_iron",

    async execute(bot, state, sensors) {
        const env = sensors.getEnvironment(bot)

        // Se não tem pickaxe de pedra, não pode minerar ferro
        if (!env.hasPickaxe) {
            console.log(`   ❌ Sem pickaxe para minerar ferro`)
            return { success: false, reward: -1 }
        }

        // Procurar minério de ferro
        const ironOre = env.ironOreNearby
        if (!ironOre) {
            console.log(`   ❌ Nenhum minério de ferro visível`)
            return { success: false, reward: -0.5 }
        }

        try {
            // Ir até o minério
            const dist = bot.entity.position.distanceTo(ironOre.position)
            if (dist > 4) {
                bot.pathfinder.setGoal(new goals.GoalBlock(ironOre.position.x, ironOre.position.y, ironOre.position.z))
                
                for (let i = 0; i < 30; i++) {
                    await bot.waitForTicks(5)
                    const newDist = bot.entity.position.distanceTo(ironOre.position)
                    if (newDist < 4) break
                }
            }

            // Equip pickaxe
            const pickaxe = bot.inventory.items().find( item => item.name.includes('pickaxe'))
            if (pickaxe) {
                await bot.equip(pickaxe, 'hand')
            }

            // Minerar o bloco
            await bot.dig(ironOre)
            console.log(`   ⛏️  Minério de ferro minerado!`)

            bot.pathfinder.setGoal(null)
            return { success: true, reward: 1 }

        } catch (error) {
            console.log(`   ⚠️  Erro ao minerar ferro: ${error.message}`)
            bot.pathfinder.setGoal(null)
            return { success: false, reward: -0.5 }
        }
    }
}
