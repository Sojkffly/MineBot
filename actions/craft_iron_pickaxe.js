module.exports = {
    name: "craft_iron_pickaxe",

    async execute(bot, state, sensors) {
        const env = sensors.getEnvironment(bot)

        // Verificar se tem iron ingots suficientes (3 p/ picareta)
        if (env.ironCount < 3) {
            console.log(`   ❌ Insuficiente iron ingots: ${env.ironCount}/3`)
            return { success: false, reward: -0.5 }
        }

        try {
            // Precisa de crafting table pra iron pickaxe (não é crafting básico)
            if (!env.hasCraftingTable) {
                console.log(`   ❌ Sem crafting table`)
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

            // Procurar recipe
            const pickaxeItem = bot.itemsByName('iron_pickaxe')[0]
            if (!pickaxeItem) {
                console.log(`   ❌ Iron pickaxe não reconhecido`)
                return { success: false, reward: -1 }
            }

            const recipes = bot.recipesFor(pickaxeItem)
            if (!recipes || recipes.length === 0) {
                console.log(`   ⚠️  Recipe de iron pickaxe não encontrada`)
                return { success: false, reward: -1 }
            }

            // Craftar
            await bot.craft(recipes[0], 1)
            console.log(`   ⛏️  Iron pickaxe craftada!`)

            return { success: true, reward: 1 }

        } catch (error) {
            console.log(`   ❌ Erro ao craftar iron pickaxe: ${error.message}`)
            return { success: false, reward: -1 }
        }
    }
}
