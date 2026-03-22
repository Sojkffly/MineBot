const state = {
    goal: "progression",
    subGoal: "get_wood",  // Começa procurando madeira

    basePos: null,

    resources: {
        wood: 0,
        planks: 0,
        cobblestone: 0,
        pickaxe: 0
    },

    // Sistema de aprendizado
    actionHistory: [],     // Histórico de todas as ações
    actionScores: {},      // Score acumulado de cada ação
    lastActionTime: null   // Para detectar travamentos
}

module.exports = state