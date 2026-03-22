module.exports = {
    name: "jump_up",

    async execute(bot, state, sensors) {
        // Pular para cima rápido, com bloco apenas se necessário
        const below = bot.blockAt(bot.entity.position.offset(0, -1, 0))
        
        if (!below || below.name === 'air') {
            // Já está caindo, pular e seguir
            bot.setControlState('jump', true)
            await bot.waitForTicks(15)
            bot.setControlState('jump', false)
            return { success: true, reward: 0.2 }
        }

        // Se tem bloco abaixo, colocar um na frente para subir (mais rápido)
        const hands = bot.inventory.items().filter(i => i.name.includes('dirt') || i.name.includes('cobblestone'))
        
        if (hands.length > 0) {
            const block = hands[0]
            await bot.equip(block, 'hand')
            
            const placePos = bot.entity.position.offset(0, 1, 0)
            const vecDir = { x: 0, y: 1, z: 0 }
            
            try {
                await bot.placeBlock(bot.blockAt(placePos), vecDir)
                await bot.waitForTicks(5)
            } catch (e) {
                // placement falhou, apenas pula normal
            }
        }

        bot.setControlState('jump', true)
        await bot.waitForTicks(15)
        bot.setControlState('jump', false)

        return { success: true, reward: 0.2 }
    }
}