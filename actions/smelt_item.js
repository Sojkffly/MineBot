module.exports = {
    name: "smelt_item",

    async execute(bot, state, sensors) {
        const env = sensors.getEnvironment(bot)

        // Verific que tem furnace perto
        if (!env.hasFurnace) {
            console.log(`   ❌ Sem furnace perto`)
            return { success: false, reward: -0.5 }
        }

        // Verificar se tem combustível (coal ou charcoal ou wood)
        if (env.fuel === 0 && env.logCount === 0) {
            console.log(`   ❌ Sem combustível (coal, charcoal ou wood)`)
            return { success: false, reward: -0.5 }
        }

        // Verificar se tem item pra smeltar
        const ironOreCount = countItemInInventory(bot, 'iron_ore')
        if (ironOreCount === 0) {
            console.log(`   ❌ Sem minério de ferro para smeltar`)
            return { success: false, reward: -0.5 }
        }

        try {
            // Ir até o furnace se não estiver perto
            const furnacePos = env.furnaceNearby?.position || state.furnacePosition
            if (furnacePos) {
                const dist = bot.entity.position.distanceTo(furnacePos)
                if (dist > 4) {
                    const { goals } = require('mineflayer-pathfinder')
                    bot.pathfinder.setGoal(new goals.GoalBlock(Math.round(furnacePos.x), Math.round(furnacePos.y), Math.round(furnacePos.z)))
                    
                    for (let i = 0; i < 15; i++) {
                        await bot.waitForTicks(10)
                        const newDist = bot.entity.position.distanceTo(furnacePos)
                        if (newDist < 4) break
                    }
                }
            }

            // Procurar o furnace block (assumindo que foi colocado perto)
            let furnaceBlock = env.furnaceNearby
            if (!furnaceBlock) {
                furnaceBlock = bot.findBlock({
                    matching: (block) => block.name === 'furnace',
                    maxDistance: 8
                })
            }

            if (!furnaceBlock) {
                console.log(`   ❌ Furnace não localizado`)
                return { success: false, reward: -1 }
            }

            // Abrir o furnace
            const furnace = bot.openContainer(furnaceBlock)
            await new Promise(resolve => setTimeout(resolve, 500))

            // Colocar item pra smeltar
            const ironOre = bot.inventory.items().find(item => item.name === 'iron_ore')
            if (ironOre) {
                await furnace.deposit(ironOre.type, null, ironOre.count)
                console.log(`   📥 Colocou ${ironOre.count}x minério no furnace`)
            }

            // Colocar combustível (preferência: coal > charcoal > wood)
            let fuel = bot.inventory.items().find(item => item.name === 'coal')
            if (!fuel) {
                fuel = bot.inventory.items().find(item => item.name === 'charcoal')
            }
            if (!fuel) {
                fuel = bot.inventory.items().find(item => item.name.includes('log'))
            }

            if (fuel) {
                await furnace.deposit(fuel.type, null, 1)
                console.log(`   🔥 Colocou combustível ${fuel.name}`)
            }

            // Fechar container
            furnace.close()

            console.log(`   ⏲️  Smelting iniciado...`)
            
            // Esperar um pouco pra começar
            await bot.waitForTicks(100)  // ~5 segundos

            return { success: true, reward: 0.8 }

        } catch (error) {
            console.log(`   ❌ Erro ao smeltar: ${error.message}`)
            return { success: false, reward: -1 }
        }
    }
}

// Função auxiliar (local)
function countItemInInventory(bot, itemName) {
    let count = 0
    for (const slot of bot.inventory.items()) {
        if (slot.name.includes(itemName)) {
            count += slot.count
        }
    }
    return count
}
