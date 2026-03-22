module.exports = {
    name: "craft_table",

    async execute(bot, state, sensors) {
        console.log(`   🛠️  Craftando Crafting Table...`)

        try {
            // Receita de crafting table: 4 pranchas em padrão 2x2
            const recipe = bot.recipesFor(58, null, true, true)[0]  // 58 = crafting_table
            
            if (!recipe) {
                console.log(`   ❌ Recipe não encontrada`)
                return { success: false, reward: -1 }
            }

            await bot.craft(recipe, 1, null)
            await bot.waitForTicks(10)

            console.log(`   ✅ Crafting Table pronta!`)
            
            // Marcar base
            if (!state.basePos) {
                state.basePos = bot.entity.position.clone()
                console.log(`   📍 Base será estabelecida em: (${Math.round(state.basePos.x)}, ${Math.round(state.basePos.y)}, ${Math.round(state.basePos.z)})`)
            }

            return { success: true, reward: 1 }
        } catch (e) {
            console.log(`   ❌ Erro ao craftar table: ${e.message}`)
            return { success: false, reward: -1 }
        }
    }
}