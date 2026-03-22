module.exports = {
    name: "craft_pickaxe",

    async execute(bot, state, sensors) {
        console.log(`   🛠️  Craftando picareta de pedra...`)

        try {
            // Receita: 3 pedra + 2 pranchas = picareta de pedra
            const recipe = bot.recipesFor(274, null, true, true)[0]  // 274 = stone_pickaxe
            
            if (!recipe) {
                console.log(`   ⚠️  Recipe de picareta não encontrada, tentando com crafting table...`)
                
                // Procura crafting table
                const table = sensors.findNearestCraftingTable(bot)
                if (!table) {
                    console.log(`   ❌ Nenhuma crafting table encontrada`)
                    return { success: false, reward: -1 }
                }

                try {
                    await bot.openBlock(table)
                    await bot.waitForTicks(10)

                    const tableRecipe = bot.recipesFor(274)[0]
                    if (tableRecipe) {
                        await bot.craft(tableRecipe, 1, null)
                        await bot.waitForTicks(10)
                        console.log(`   ✅ Picareta de pedra craftada!`)
                        bot.closeWindow(bot.currentWindow)
                        return { success: true, reward: 1 }
                    }
                    bot.closeWindow(bot.currentWindow)
                    return { success: false, reward: -1 }
                } catch (e) {
                    try {
                        bot.closeWindow(bot.currentWindow)
                    } catch (e2) {}
                    console.log(`   ❌ Erro ao usar crafting table: ${e.message}`)
                    return { success: false, reward: -1 }
                }
            }

            await bot.craft(recipe, 1, null)
            await bot.waitForTicks(10)

            console.log(`   ✅ Picareta de pedra craftada no inventário!`)
            return { success: true, reward: 1 }
        } catch (e) {
            console.log(`   ❌ Erro ao craftar: ${e.message}`)
            return { success: false, reward: -1 }
        }
    }
}