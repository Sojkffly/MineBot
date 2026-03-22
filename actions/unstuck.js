module.exports = {
    name: "unstuck",

    async execute(bot, state, sensors) {
        console.log(`   🚀 Tentando sair do travamento...`)
        
        // Track quantas vezes foi chamado consecutivamente
        if (!state.unstuckCount) state.unstuckCount = 0
        state.unstuckCount++
        
        // Se chamado mais de 3 vezes seguidas, algo tá MUITO errado
        if (state.unstuckCount > 3) {
            console.log(`   ❌ IMPOSSÍVEL SAIR! Trocando estratégia para exploração`)
            state.unstuckCount = 0
            state.subGoal = "explore_world"
            return { success: false, reward: -1 }
        }
        
        // Tentar sair: movimento + pulos
        const yaw = Math.random() * Math.PI * 2
        bot.look(yaw, 0)
        console.log(`   👀 Olhando para ângulo: ${(yaw * 180 / Math.PI).toFixed(0)}°`)

        // Andar em linha reta enquanto pula
        for (let i = 0; i < 3; i++) {
            bot.setControlState('jump', true)
            bot.setControlState('forward', true)
            await bot.waitForTicks(15)
            bot.setControlState('jump', false)
            bot.setControlState('forward', false)
            await bot.waitForTicks(5)
            console.log(`   🦘 Pulo ${i + 1}/3`)
        }
        
        console.log(`   ✅ Tentativa ${state.unstuckCount}/3 concluída`)
        
        // Se conseguiu sair, reset counter
        const dist = bot.entity.position.distanceTo(state.lastPosition || bot.entity.position)
        if (dist > 0.5) {
            state.unstuckCount = 0
            return { success: true, reward: 0.3 }
        }
        
        return { success: false, reward: -0.5 }
    }
}