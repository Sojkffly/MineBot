const logger = require('./logger')

// ════════════════════════════════════════════════════════════════
// ⚙️ EXPLORATION VS EXPLOITATION (ε-GREEDY)
// ════════════════════════════════════════════════════════════════
// Começa com 20% exploração, diminui com experiência
function getExplorationRate(state) {
    // Menos exploração conforme Bot fica "experiente"
    const actionCount = state.actionHistory.length
    
    if (actionCount < 20) return 0.3      // 30% exploração (aprender rápido)
    if (actionCount < 50) return 0.2      // 20% exploração (conhecimento inicial)
    if (actionCount < 100) return 0.1     // 10% exploração (refinamento)
    return 0.05                           // 5% exploração (explorador ocasional)
}

function getActionScore(state, actionName) {
    const history = state.actionHistory.filter(a => a.action === actionName)

    if (history.length === 0) return 0

    const total = history.reduce((sum, a) => sum + (a.reward || 0), 0)
    const average = total / history.length

    return average
}

function shouldSkipAction(state, actionName) {
    const score = getActionScore(state, actionName)
    
    // Se ação tem score muito negativo, pular
    if (score < -0.5 && state.actionHistory.filter(a => a.action === actionName).length >= 3) {
        return true
    }
    
    return false
}

function chooseAction(bot, state, env, actions) {
    // ════════════════════════════════════════════════════════════════
    // 🚨 SURVIVAL PRIORITY: Check threats FIRST
    // ════════════════════════════════════════════════════════════════
    
    // LEVEL 1: CRITICAL STARVATION
    if (env.isStarving && actions["eat_food"]) {
        console.log('🚨 FOME CRÍTICA! Comendo agora...')
        logger.critical('STARVATION EMERGENCY', { hunger: env.hunger })
        return "eat_food"
    }
    
    // LEVEL 2: IMMEDIATE THREAT
    if (env.enemyNearby && env.health < 10 && actions["flee"]) {
        console.log('🚨 INIMIGO PERIGOSO! Fugindo...')
        logger.critical('MOB THREAT', { health: env.health, distance: env.enemyDistance })
        return "flee"
    }
    
    // LEVEL 3: PREVENTIVE HUNGER
    if (env.isHungry && env.foodNearby && actions["find_food"]) {
        console.log('🍖 Fome detectada. Procurando comida...')
        logger.warning('Hunger detected', { hunger: env.hunger })
        return "find_food"
    }

    // ════════════════════════════════════════════════════════════════
    // 🧠 EPSILON-GREEDY: Exploração vs Exploração
    // ════════════════════════════════════════════════════════════════
    const epsilon = getExplorationRate(state)
    const shouldExplore = Math.random() < epsilon
    
    if (shouldExplore && Object.keys(actions).length > 0) {
        // 🎲 EXPLORAÇÃO: Tentar ação aleatória
        const availableActions = Object.keys(actions)
        const randomAction = availableActions[Math.floor(Math.random() * availableActions.length)]
        
        const explorationType = state.actionHistory.length < 50 ? '🧪' : '🔍'
        console.log(`${explorationType} [EXPLORER] Testando ação aleatória: ${randomAction}`)
        logger.decision('exploration', { action: randomAction, epsilon: epsilon.toFixed(2) })
        
        state.lastExploration = randomAction
        return randomAction
    }

    // ════════════════════════════════════════════════════════════════
    // 🧠 EXPLORAÇÃO: Usar melhor ação conhecida
    // ════════════════════════════════════════════════════════════════
    
    if (env.health < 10) {
        console.log('🚨 Saúde baixa! Fugindo...')
        logger.warning('Low health', { health: env.health })
        return "flee"
    }

    // Sistema de subGoal dinâmico
    switch (state.subGoal) {
        case "get_wood":
            if (!env.hasEnoughWood) {
                // Skip if collect_wood has negative score
                if (shouldSkipAction(state, "collect_wood")) {
                    logger.warning('collect_wood has poor score', { score: getActionScore(state, "collect_wood") })
                    return "explore"
                }
                logger.decision('get_wood', `collectando: ${env.woodInventory}/16`)
                return "collect_wood"
            }
            console.log(`✅ [MILESTONE] Madeira coletada! → Craftando pranchas`)
            logger.progress('Wood collection complete')
            state.subGoal = "craft_planks"
            return null

        case "craft_planks":
            if (env.logCount > 0) {
                // Skip if craft has negative score
                if (shouldSkipAction(state, "craft")) {
                    logger.warning('craft has poor score', { score: getActionScore(state, "craft") })
                    state.subGoal = "explore_world"
                    return null
                }
                logger.decision('craft_planks', `${env.logCount} logs disponíveis`)
                return "craft"
            }
            console.log(`✅ [MILESTONE] Pranchas prontas! → Craftando table`)
            logger.progress('Planks crafted')
            state.subGoal = "craft_table"
            return null

        case "craft_table":
            if (env.plankCount >= 4 && !env.hasCraftingTable) {
                // Skip if craft_table has negative score
                if (shouldSkipAction(state, "craft_table")) {
                    logger.warning('craft_table has poor score', { score: getActionScore(state, "craft_table") })
                    state.subGoal = "explore_world"
                    return null
                }
                logger.decision('craft_table', `${env.plankCount} planks disponíveis`)
                return "craft_table"
            }
            console.log(`✅ [MILESTONE] Table craftada! → Colocando base`)
            logger.progress('Crafting table crafted')
            state.subGoal = "place_table"
            return null

        case "place_table":
            if (env.craftingTableCount > 0) {
                // Skip if place_table has negative score
                if (shouldSkipAction(state, "place_table")) {
                    logger.warning('place_table has poor score', { score: getActionScore(state, "place_table") })
                    return "explore"
                }
                logger.decision('place_table', 'Colocando no mundo')
                return "place_table"
            }
            console.log(`✅ [MILESTONE] Base estabelecida! → Stone Age começou`)
            logger.progress('Base established - Stone Age starting')
            state.subGoal = "get_stone"
            return null

        case "get_stone":
            if (!env.hasPickaxe) {
                if (env.cobblestoneCount < 3 && env.stoneNearby) {
                    // Skip if mine_stone has negative score
                    if (shouldSkipAction(state, "mine_stone")) {
                        logger.warning('mine_stone has poor score', { score: getActionScore(state, "mine_stone") })
                        return "explore"
                    }
                    logger.decision('get_stone', `Minerando com mão: ${env.cobblestoneCount}/3`)
                    return "mine_stone"
                }
                
                if (env.cobblestoneCount >= 3) {
                    console.log(`✅ [MILESTONE] Pedra suficiente! → Craftando picareta`)
                    logger.progress('Stone collected - crafting pickaxe')
                    state.subGoal = "craft_pickaxe"
                    return null
                }
            } else {
                if (env.cobblestoneCount < 16) {
                    // Skip if mine_stone has negative score
                    if (shouldSkipAction(state, "mine_stone")) {
                        logger.warning('mine_stone has poor score', { score: getActionScore(state, "mine_stone") })
                        return "explore"
                    }
                    logger.decision('get_stone', `Minerando com picareta: ${env.cobblestoneCount}/16`)
                    return "mine_stone"
                }
                console.log(`✅ [MILESTONE] Stone Age concluída! → Explorando mundo`)
                logger.progress('Stone tools complete - exploring')
                state.subGoal = "explore_world"
                return null
            }

            if (!env.stoneNearby) {
                logger.decision('get_stone', 'Procurando pedra')
                return "explore"
            }
            return null

        case "craft_pickaxe":
            if (env.cobblestoneCount >= 3 && !env.hasPickaxe) {
                // Skip if craft_pickaxe has negative score
                if (shouldSkipAction(state, "craft_pickaxe")) {
                    logger.warning('craft_pickaxe has poor score', { score: getActionScore(state, "craft_pickaxe") })
                    state.subGoal = "explore_world"
                    return null
                }
                logger.decision('craft_pickaxe', `${env.cobblestoneCount} pedra disponível`)
                return "craft_pickaxe"
            }
            console.log(`✅ [MILESTONE] Picareta pronta! → Entrando na Era do Ferro`)
            logger.progress('Stone pickaxe crafted - Iron Age starting')
            state.subGoal = "craft_furnace"
            return null

        // ════════════════════════════════════════════════════════════════
        // IRON AGE: Furnace + Smelting + Iron Tools
        // ════════════════════════════════════════════════════════════════

        case "craft_furnace":
            if (!env.hasFurnace) {
                logger.decision('craft_furnace', `Crafting furnace`)
                if (shouldSkipAction(state, "craft_furnace")) {
                    logger.warning('craft_furnace has poor score', { score: getActionScore(state, "craft_furnace") })
                    return "explore"
                }
                return "craft_furnace"
            }
            console.log(`✅ [MILESTONE] Furnace disponível! → Colocando base`)
            logger.progress('Furnace crafted')
            state.subGoal = "place_furnace"
            return null

        case "place_furnace":
            if (env.furnaceCount > 0 && !env.furnaceNearby) {
                logger.decision('place_furnace', 'Colocando furnace no mundo')
                if (shouldSkipAction(state, "place_furnace")) {
                    logger.warning('place_furnace has poor score', { score: getActionScore(state, "place_furnace") })
                    return "explore"
                }
                return "place_furnace"
            }
            if (env.hasFurnace) {
                console.log(`✅ [MILESTONE] Furnace colocada! → Procurando ferro`)
                logger.progress('Furnace placed - starting iron collection')
                state.subGoal = "get_iron"
                return null
            }
            return null

        case "get_iron":
            if (!env.hasPickaxe) {
                console.log(`⚠️  Sem pickaxe para minerar ferro!`)
                state.subGoal = "explore_world"
                return null
            }
            
            if (env.ironCount < 3 && env.ironOreNearby) {
                logger.decision('get_iron', `Minerando ferro: ${env.ironCount}/3`)
                if (shouldSkipAction(state, "mine_iron")) {
                    logger.warning('mine_iron has poor score', { score: getActionScore(state, "mine_iron") })
                    return "explore"
                }
                return "mine_iron"
            }

            if (env.ironCount >= 3) {
                console.log(`✅ [MILESTONE] Ferro suficiente! → Smelting`)
                logger.progress('Iron ore collected - starting smelting')
                state.subGoal = "smelt_iron"
                return null
            }

            if (!env.ironOreNearby) {
                logger.decision('get_iron', 'Procurando minério de ferro')
                return "explore"
            }
            return null

        case "smelt_iron":
            if (env.ironCount < 3) {
                if (env.hasFurnace && (env.fuel > 0 || env.logCount > 0)) {
                    logger.decision('smelt_iron', `Smelting: ${env.ironCount} → esperando...`)
                    if (shouldSkipAction(state, "smelt_item")) {
                        logger.warning('smelt_item has poor score', { score: getActionScore(state, "smelt_item") })
                        return "explore"
                    }
                    return "smelt_item"
                } else {
                    console.log(`⚠️  Sem furnace ou combustível`)
                    return "explore"
                }
            }

            if (env.ironCount >= 3) {
                console.log(`✅ [MILESTONE] Ferro smelted! → Crafting Iron Pickaxe`)
                logger.progress('Iron ingots ready - crafting iron pickaxe')
                state.subGoal = "craft_iron_pickaxe"
                return null
            }
            return null

        case "craft_iron_pickaxe":
            if (env.ironCount >= 3 && !env.hasIronPickaxe) {
                logger.decision('craft_iron_pickaxe', `Crafting com ${env.ironCount} iron ingots`)
                if (shouldSkipAction(state, "craft_iron_pickaxe")) {
                    logger.warning('craft_iron_pickaxe has poor score', { score: getActionScore(state, "craft_iron_pickaxe") })
                    return "explore"
                }
                return "craft_iron_pickaxe"
            }

            if (env.hasIronPickaxe) {
                console.log(`✅ [MILESTONE] ERA DO FERRO COMPLETA! → Explorando...`)
                logger.progress('Iron Age tools complete - ready to explore!')
                state.subGoal = "explore_world"
                return null
            }
            return null

        case "explore_world":
            logger.decision('explore_world', 'Mundo aberto')
            return "explore"

        default:
            logger.warning('Unknown subgoal', { subGoal: state.subGoal })
            return "explore"
    }
}

async function think(bot, actions, sensors, state) {
    // Detectar se está preso
    if (!state.lastPosition) {
        state.lastPosition = bot.entity.position.clone()
    }

    const dist = bot.entity.position.distanceTo(state.lastPosition)
    state.lastPosition = bot.entity.position.clone()

    if (dist < 0.5) {
        console.log(`⚠️ TRAVADO! Distância: ${dist.toFixed(2)}. Tentando sair...`)
        if (!state.unstuckAttempts) state.unstuckAttempts = 0
        state.unstuckAttempts++
        
        // Depois de 5 tentativas de unstuck, desistir e explorar
        if (state.unstuckAttempts > 5) {
            console.log(`❌ NÃO CONSEGUE SAIR! Mudando estratégia...`)
            state.unstuckAttempts = 0
            state.subGoal = "explore_world"
        }
        
        await actions["unstuck"](bot, state, sensors)
        return
    }
    
    // Reset unstuck counter se conseguiu sair
    state.unstuckAttempts = 0

    const env = sensors.getEnvironment(bot)

    // Mostrar status limpo a cada ~6 segundos (3 ciclos de 2s)
    if (!state.statusCounter) state.statusCounter = 0
    state.statusCounter++
    
    if (state.statusCounter >= 3) {
        state.statusCounter = 0
        
        // Calcular top 3 best e worst actions
        const sortedScores = Object.entries(state.actionScores)
            .filter(([name, score]) => state.actionHistory.filter(a => a.action === name).length > 0)
            .sort((a, b) => b[1] - a[1])
        
        const bestActions = sortedScores.slice(0, 3).map(([name, score]) => `${name}(${score.toFixed(1)})`).join(', ')
        const worstActions = sortedScores.slice(-3).reverse().map(([name, score]) => `${name}(${score.toFixed(1)})`).join(', ')
        
        console.log(`
═══════════════════════════════════════════════════════════════════
  📊 STATUS | ${state.goal.toUpperCase()} → ${state.subGoal.toUpperCase()}
───────────────────────────────────────────────────────────────────
  ❤️  ${env.health}/20 | 🍖 ${env.food}/20 | 📍 (${Math.round(bot.entity.position.x)}, ${Math.round(bot.entity.position.y)}, ${Math.round(bot.entity.position.z)})
  📦 Wood: ${env.logCount}L+${env.plankCount}P | Stone: ${env.cobblestoneCount} | Pick: ${env.pickaxeCount}(${env.ironPickaxeCount}🔧)
  🛠️  Table: ${env.hasCraftingTable ? '✅' : '❌'} | 🔥 Furnace: ${env.hasFurnace ? '✅' : '❌'} | ⛓️  Iron: ${env.ironCount}
  🌳 Wood: ${env.woodNearby ? '✅' : '❌'} | 🗿 Stone: ${env.stoneNearby ? '✅' : '❌'} | ⚙️  Ore: ${env.ironOreNearby ? '✅' : '❌'}
───────────────────────────────────────────────────────────────────
  🏆 Best: ${bestActions || 'none yet'}
  💔 Worst: ${worstActions || 'none yet'}
───────────────────────────────────────────────────────────────────
  🧠 Learning: Actions=${state.actionHistory.length} | Epsilon=${(getExplorationRate(state) * 100).toFixed(0)}% | Mode=${state.lastExploration ? '🔍 EXPLORING' : '🎯 EXPLOITING'}
═══════════════════════════════════════════════════════════════════
        `)
        
        logger.status({
            health: env.health,
            food: env.food,
            position: { x: Math.round(bot.entity.position.x), y: Math.round(bot.entity.position.y), z: Math.round(bot.entity.position.z) },
            inventory: { 
                logs: env.logCount, 
                planks: env.plankCount, 
                cobblestone: env.cobblestoneCount, 
                pickaxes: env.pickaxeCount,
                iron_ingots: env.ironCount,
                iron_pickaxes: env.ironPickaxeCount,
                furnace: env.furnaceCount,
                fuel: env.fuel
            },
            goal: state.goal,
            subGoal: state.subGoal,
            bestActions: state.actionScores,
            actionCount: state.actionHistory.length,
            explorationRate: getExplorationRate(state),
            mode: state.lastExploration ? 'exploring' : 'exploiting'
        })
    }

    const actionName = chooseAction(bot, state, env, actions)

    const action = actions[actionName]

    if (!action) {
        logger.error('Ação não encontrada', { actionName })
        return
    }

    if (state.lastAction !== actionName) {
        console.log(`\n▶️  ${actionName.toUpperCase()}`)
        logger.action(actionName, { 
            subGoal: state.subGoal,
            inventory: { logs: env.logCount, planks: env.plankCount, cobblestone: env.cobblestoneCount }
        })
        state.lastActionTime = Date.now()
    }

    const result = await action(bot, state, sensors)

    // Registrar resultado da ação no histórico
    const reward = result?.reward ?? (result === true ? 1 : -1)
    const actionRecord = {
        action: actionName,
        reward: reward,
        time: Date.now(),
        duration: Date.now() - (state.lastActionTime || Date.now())
    }
    
    state.actionHistory.push(actionRecord)
    
    // Manter apenas últimas 100 ações para não consumir muita memória
    if (state.actionHistory.length > 100) {
        state.actionHistory = state.actionHistory.slice(-100)
    }

    // Atualizar score acumulado
    const currentScore = getActionScore(state, actionName)
    state.actionScores[actionName] = currentScore
    
    logger.info(`Action result: ${actionName}`, { 
        reward: reward, 
        score: currentScore.toFixed(2),
        times: state.actionHistory.filter(a => a.action === actionName).length
    })

    state.lastAction = actionName
    state.currentAction = actionName

    return result
}

module.exports = { think }