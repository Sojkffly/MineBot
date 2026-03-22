module.exports = {
    name: "craft",

    async execute(bot, state, sensors) {
        console.log(`   🛠️  Craftando pranchas...`)

        try {
            // Recipe de pranchas: 1 log → 4 pranchas (crafting ou inventário)
            const recipe = bot.recipesFor(5, null, true, true)[0]  // 5 = planks
            
            if (!recipe) {
                console.log(`   ❌ Recipe não encontrada`)
                return { success: false, reward: -1 }
            }

            await bot.craft(recipe, 4, null)  // Craftar 4 stacks
            await bot.waitForTicks(10)

            console.log(`   ✅ Pranchas craftadas!`)
            return { success: true, reward: 1 }
        } catch (e) {
            console.log(`   ❌ Erro ao craftar: ${e.message}`)
            return { success: false, reward: -1 }
        }
    }
}