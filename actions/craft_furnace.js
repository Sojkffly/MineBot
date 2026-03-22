module.exports = {
    name: "craft_furnace",

    async execute(bot, state, sensors) {
        const env = sensors.getEnvironment(bot)

        if (!env.hasCraftingTable) {
            console.log(`   ❌ Sem crafting table disponível`)
            return { success: false, reward: -1 }
        }

        // Ir pra crafting table se não estiver perto
        const tablePos = env.craftingTableNearby?.position || state.craftingTablePosition
        if (tablePos) {
            const dist = bot.entity.position.distanceTo(tablePos)
            if (dist > 4) {
                const { goals } = require('mineflayer-pathfinder')
                bot.pathfinder.setGoal(new goals.GoalBlock(Math.round(tablePos.x), Math.round(tablePos.y), Math.round(tablePos.z)))
                
                for (let i = 0; i < 10; i++) {
                    await bot.waitForTicks(10)
                    const newDist = bot.entity.position.distanceTo(tablePos)
                    if (newDist < 4) break
                }
            }
        }

        // Verificar se tem recipe disponível
        try {
            // Furnace recipe: 8 cobblestone em quadrado (sem miolo)
            // Alternativamente: tentar pegar recipe dinâmicamente
            const furaceRecipe = bot.recipesFor(bot.itemsByName('furnace')[0])

            if (!furaceRecipe || furaceRecipe.length === 0) {
                console.log(`   ⚠️  Recipe de furnace não encontrada`)
                return { success: false, reward: -1 }
            }

            // Fazer o craft
            await bot.craft(furaceRecipe[0], 1)
            
            console.log(`   🔥 Furnace craftada!`)
            return { success: true, reward: 1 }

        } catch (error) {
            console.log(`   ❌ Erro ao craftar furnace: ${error.message}`)
            return { success: false, reward: -1 }
        }
    }
}
