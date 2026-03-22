const { goals } = require('mineflayer-pathfinder')
const Vec3 = require('vec3')

function randomExploreTarget(bot, state, minDist = 16, maxDist = 60) {
    const base = state.homePos || bot.entity.position
    const angle = Math.random() * Math.PI * 2
    const dist = minDist + Math.random() * (maxDist - minDist)

    const x = base.x + Math.cos(angle) * dist
    const z = base.z + Math.sin(angle) * dist

    // Usa o y de base ou do terreno sob o ponto sugerido
    const block = bot.blockAt(new Vec3(Math.round(x), Math.round(base.y), Math.round(z)))
    const y = block ? block.position.y + 1 : base.y

    return { x, y, z }
}

module.exports = {
    name: "explore",

    async execute(bot, state, sensors) {
        if (!state.homePos) {
            state.homePos = bot.entity.position.clone()
            console.log(`   🏠 Base de exploração definida em (${Math.round(state.homePos.x)}, ${Math.round(state.homePos.y)}, ${Math.round(state.homePos.z)})`)
        }

        if (!state.exploreTarget) {
            state.exploreTarget = randomExploreTarget(bot, state)
            console.log(`   🎯 Nova meta de exploração: (${Math.round(state.exploreTarget.x)}, ${Math.round(state.exploreTarget.y)}, ${Math.round(state.exploreTarget.z)})`)
        }

        const target = state.exploreTarget
        const goal = new goals.GoalBlock(Math.round(target.x), Math.round(target.y), Math.round(target.z))

        bot.pathfinder.setGoal(goal)

        // Checa se chegou à meta rapidamente (evitar parar no mesmo lugar)
        const dist = bot.entity.position.distanceTo(new Vec3(target.x, target.y, target.z))
        if (dist < 2) {
            console.log(`   ✅ Chegou no destino de exploração! Distância: ${dist.toFixed(1)}`)
            state.exploreTarget = null
            bot.pathfinder.setGoal(null)
            return { success: true, reward: 0.8 }
        }

        // Se o bot está muito perto do ponto de base e sem progresso, forçar meta distante
        const distToBase = bot.entity.position.distanceTo(state.homePos)
        if (distToBase < 6 && dist < 4) {
            state.exploreTarget = randomExploreTarget(bot, state, 24, 80)
            console.log(`   🔁 Muito perto da base, alterando meta para área mais distante`) 
            return { success: false, reward: -0.1 }
        }

        // Ajusta meta se iterações altas sem progresso
        if (!state.exploreTickCount) state.exploreTickCount = 0
        state.exploreTickCount++

        if (state.exploreTickCount > 10) {
            state.exploreTarget = randomExploreTarget(bot, state, 20, 80)
            state.exploreTickCount = 0
            console.log(`   🔁 Explorando novo ponto (tick count).`) 
            return { success: true, reward: 0.3 }
        }

        return { success: true, reward: 0.4 }
    }
}