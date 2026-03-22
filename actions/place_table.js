module.exports = {
    name: "place_table",

    async execute(bot, state, sensors) {
        console.log(`   🔨 Procurando local para colocar Crafting Table...`)

        try {
            // Encontrar bloco de ar adjacente para colocar table
            const pos = bot.entity.position
            
            const candidates = [
                pos.offset(1, 0, 0),
                pos.offset(-1, 0, 0),
                pos.offset(0, 0, 1),
                pos.offset(0, 0, -1),
                pos.offset(0, -1, 0)
            ]

            let placed = false
            for (const candidate of candidates) {
                const block = bot.blockAt(candidate)
                
                if (block && block.name === 'air') {
                    // Encontrou espaço, pegar crafting table do inventário
                    const tableItem = bot.inventory.items().find(item => item.name.includes('crafting_table'))
                    
                    if (!tableItem) {
                        console.log(`   ❌ Crafting Table não encontrada no inventário`)
                        return { success: false, reward: -1 }
                    }

                    await bot.equip(tableItem, 'hand')
                    await bot.waitForTicks(5)

                    // Colocar o bloco
                    const blockBelow = bot.blockAt(candidate.offset(0, -1, 0))
                    if (blockBelow && blockBelow.name !== 'air') {
                        const direction = candidate.minus(blockBelow.position).normalize()
                        await bot.placeBlock(blockBelow, direction)
                        
                        console.log(`   ✅ Crafting Table colocada em: (${Math.round(candidate.x)}, ${Math.round(candidate.y)}, ${Math.round(candidate.z)})`)
                        state.basePos = candidate.clone()
                        placed = true
                        break
                    }
                }
            }

            if (!placed) {
                console.log(`   ⚠️  Nenhum local válido encontrado. Tentando de novo...`)
                return { success: false, reward: -0.5 }
            }

            return { success: true, reward: 1 }
        } catch (e) {
            console.log(`   ❌ Erro ao colocar table: ${e.message}`)
            return { success: false, reward: -1 }
        }
    }
}