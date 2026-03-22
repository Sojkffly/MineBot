module.exports = {
    name: "place_furnace",

    async execute(bot, state, sensors) {
        const env = sensors.getEnvironment(bot)

        // Verificar se tem furnace no inventory
        if (env.furnaceCount === 0) {
            console.log(`   ❌ Sem furnace no inventory`)
            return { success: false, reward: -0.5 }
        }

        // Equipar furnace
        const furnace = bot.inventory.items().find(item => item.name === 'furnace')
        if (!furnace) {
            console.log(`   ❌ Furnace não encontrado no inventory`)
            return { success: false, reward: -1 }
        }

        try {
            // Procucar um bloco vazio pra colocar
            const ground = bot.blockAt(bot.entity.position.offset(0, -1, 0))
            if (!ground || ground.name === 'air') {
                console.log(`   ❌ Sem solo para colocar furnace`)
                return { success: false, reward: -0.5 }
            }

            // Procurar bloco vazio ao redor
            let placed = false
            const directions = [
                {x: 1, y: 0, z: 0},
                {x: -1, y: 0, z: 0},
                {x: 0, y: 0, z: 1},
                {x: 0, y: 0, z: -1},
                {x: 1, y: 1, z: 0},
                {x: -1, y: 1, z: 0},
                {x: 0, y: 1, z: 1},
                {x: 0, y: 1, z: -1}
            ]

            for (const dir of directions) {
                const placePos = bot.entity.position.offset(dir.x, dir.y, dir.z)
                const blockAt = bot.blockAt(placePos)
                
                if (blockAt && blockAt.name === 'air') {
                    const referenceBlock = bot.blockAt(placePos.offset(0, -1, 0))
                    if (referenceBlock && referenceBlock.name !== 'air') {
                        // Tentar colocar
                        await bot.equip(furnace, 'hand')
                        await bot.placeBlock(referenceBlock, {x: 0, y: 1, z: 0})
                        
                        placed = true
                        console.log(`   🔥 Furnace colocada!`)
                        break
                    }
                }
            }

            if (!placed) {
                console.log(`   ⚠️  Nenhum local válido para furnace`)
                return { success: false, reward: -0.5 }
            }

            // Atualizar posição para usar depois
            state.furnacePosition = bot.entity.position.clone()
            
            return { success: true, reward: 1 }

        } catch (error) {
            console.log(`   ❌ Erro ao colocar furnace: ${error.message}`)
            return { success: false, reward: -1 }
        }
    }
}
