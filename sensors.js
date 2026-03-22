function findBlock(bot, name) {
    return bot.findBlock({
        matching: (block) => block.name.includes(name),
        maxDistance: 16
    })
}

function canSeeBlock(bot, block) {
    const headPos = bot.entity.position.offset(0, 1.6, 0)
    const targetPos = block.position.offset(0.5, 0.5, 0.5)

    const direction = targetPos.minus(headPos).normalize()

    const ray = bot.world.raycast(headPos, direction, 20)

    if (!ray) return false

    return ray.position.equals(block.position)
}

function angleDiff(a, b) {
    let diff = (a - b + Math.PI * 3) % (Math.PI * 2) - Math.PI
    return Math.abs(diff)
}

function isInFov(bot, block, maxAngle = 60) {
    const eye = bot.entity.position.offset(0, 1.6, 0)
    const blockCenter = block.position.offset(0.5, 0.5, 0.5)

    const dx = blockCenter.x - eye.x
    const dz = blockCenter.z - eye.z

    const targetYaw = Math.atan2(-dx, -dz)
    const yaw = bot.entity.yaw

    return angleDiff(targetYaw, yaw) <= (maxAngle * Math.PI / 180)
}

function findVisibleWood(bot) {
    const blocks = bot.findBlocks({
        matching: (b) => b.name.includes("log"),
        maxDistance: 32,  // Aumentado de 16
        count: 50         // Aumentado de 20
    })

    if (!blocks || blocks.length === 0) return null

    // Ordenar por distância
    const sorted = blocks
        .map(pos => {
            const block = bot.blockAt(pos)
            if (!block) return null
            return { 
                block, 
                dist: bot.entity.position.distanceTo(block.position)
            }
        })
        .filter(x => x !== null)
        .sort((a, b) => a.dist - b.dist)

    // Tentar encontrar bloco visível começando pelos mais próximos
    for (const { block } of sorted) {
        // Se está muito abaixo, pula
        if (block.position.y < bot.entity.position.y - 3) continue

        // Se está em FOV (relaxado: 120°), considera
        if (!isInFov(bot, block, 120)) continue

        // Se tem raycast, prefere - mas aceita sem raycast tbm
        if (canSeeBlock(bot, block)) {
            return block
        }
    }

    // Se não achou com raycast, retorna o mais próximo mesmo assim
    return sorted.length > 0 ? sorted[0].block : null
}

function isNearCave(bot) {
    const pos = bot.entity.position
    const above = bot.blockAt(pos.offset(0, 1, 0))
    const below = bot.blockAt(pos.offset(0, -1, 0))

    if (!below || below.name === 'air') return false
    if (!above || above.name !== 'air') return false

    const directions = [
        {x: 1, z: 0},
        {x: -1, z: 0},
        {x: 0, z: 1},
        {x: 0, z: -1}
    ]

    let openSides = 0
    for (const d of directions) {
        const side = bot.blockAt(pos.offset(d.x, 0, d.z))
        if (side && side.name === 'air') openSides++
    }

    // Se há espaço aberto lateral e não há céu direto, é provável uma caverna/poço
    return openSides >= 2
}

function countItemInInventory(bot, itemName) {
    let count = 0
    for (const slot of bot.inventory.items()) {
        if (slot.name.includes(itemName)) {
            count += slot.count
        }
    }
    return count
}

function findNearestCraftingTable(bot) {
    const table = bot.findBlock({
        matching: (block) => block.name === 'crafting_table',
        maxDistance: 32
    })
    return table
}

function findNearestFurnace(bot) {
    const furnace = bot.findBlock({
        matching: (block) => block.name === 'furnace',
        maxDistance: 32
    })
    return furnace
}

function findVisibleStone(bot) {
    const blocks = bot.findBlocks({
        matching: (b) => b.name.includes("stone") && !b.name.includes("stone_brick"),
        maxDistance: 32,  // Aumentado de 16
        count: 50         // Aumentado de 20
    })

    if (!blocks || blocks.length === 0) return null

    // Ordenar por distância
    const sorted = blocks
        .map(pos => {
            const block = bot.blockAt(pos)
            if (!block) return null
            return { 
                block, 
                dist: bot.entity.position.distanceTo(block.position)
            }
        })
        .filter(x => x !== null)
        .sort((a, b) => a.dist - b.dist)

    // Tentar encontrar bloco visível começando pelos mais próximos
    for (const { block } of sorted) {
        // Se está em FOV (relaxado: 120°), considera
        if (!isInFov(bot, block, 120)) continue

        // Se tem raycast, prefere - mas aceita sem raycast tbm
        if (canSeeBlock(bot, block)) {
            return block
        }
    }

    // Se não achou com raycast, retorna o mais próximo
    return sorted.length > 0 ? sorted[0].block : null
}

function findVisibleIronOre(bot) {
    const blocks = bot.findBlocks({
        matching: (b) => b.name.includes("iron_ore"),
        maxDistance: 32,  // Aumentado de 20
        count: 50         // Aumentado de 20
    })

    if (!blocks || blocks.length === 0) return null

    // Ordenar por distância
    const sorted = blocks
        .map(pos => {
            const block = bot.blockAt(pos)
            if (!block) return null
            return { 
                block, 
                dist: bot.entity.position.distanceTo(block.position)
            }
        })
        .filter(x => x !== null)
        .sort((a, b) => a.dist - b.dist)

    // Tentar encontrar bloco visível começando pelos mais próximos
    for (const { block } of sorted) {
        // Se está em FOV (relaxado: 120°), considera
        if (!isInFov(bot, block, 120)) continue

        // Se tem raycast, prefere - mas aceita sem raycast tbm
        if (canSeeBlock(bot, block)) {
            return block
        }
    }

    // Se não achou com raycast, retorna o mais próximo
    return sorted.length > 0 ? sorted[0].block : null
}

function hasEnoughWood(bot, minLog = 16) {
    const logCount = countItemInInventory(bot, 'log')
    const plankCount = countItemInInventory(bot, 'planks')
    return (logCount + plankCount * 4) >= minLog  // 1 log = 4 planks
}

// ════════════════════════════════════════════════════════════════
// 🍖 FOOD & SURVIVAL DETECTORS
// ════════════════════════════════════════════════════════════════

function findNearestEntity(bot, matcher) {
    const entities = Object.values(bot.entities)
    let nearest = null
    let minDist = Infinity

    for (const entity of entities) {
        if (!entity || !matcher(entity)) continue
        
        const dist = bot.entity.position.distanceTo(entity.position)
        if (dist < minDist) {
            minDist = dist
            nearest = entity
        }
    }

    return nearest
}

function findFoodItems(bot) {
    const entities = Object.values(bot.entities)
    const foodItems = []

    for (const entity of entities) {
        if (entity.type !== 'item') continue
        if (!entity.metadata) continue

        // Check if it's a food item (droppado no mundo)
        const itemName = entity.metadata[10]?.name
        if (itemName && (
            itemName.includes('food') ||
            itemName.includes('apple') ||
            itemName.includes('melon') ||
            itemName.includes('carrot') ||
            itemName.includes('potato') ||
            itemName.includes('bread')
        )) {
            foodItems.push(entity)
        }
    }

    // Sort by distance
    foodItems.sort((a, b) => {
        const distA = bot.entity.position.distanceTo(a.position)
        const distB = bot.entity.position.distanceTo(b.position)
        return distA - distB
    })

    return foodItems.length > 0 ? foodItems[0] : null
}

function getHungerStatus(bot) {
    const hunger = bot.food
    return {
        hunger: hunger,
        isHungry: hunger < 14,      // Yellow hearts start appearing
        isStarving: hunger < 6,     // Critical danger
        canHealing: hunger === 20   // Needs full food for health regen
    }
}

function getNearbyEnemies(bot) {
    return findNearestEntity(
        bot, 
        (e) => e.type === 'mob' && e.name !== 'ArmorStand'
    )
}

function getEnemyDistance(bot) {
    const enemy = getNearbyEnemies(bot)
    if (!enemy) return Infinity
    return bot.entity.position.distanceTo(enemy.position)
}

function getEnvironment(bot) {
    const logCount = countItemInInventory(bot, 'log')
    const plankCount = countItemInInventory(bot, 'planks')
    const craftingTableCount = countItemInInventory(bot, 'crafting_table')
    const cobblestoneCount = countItemInInventory(bot, 'cobblestone')
    const pickaxeCount = countItemInInventory(bot, 'pickaxe')
    const craftingTableNearby = findNearestCraftingTable(bot)
    const stoneNearby = findVisibleStone(bot)
    
    // Iron Age resources
    const ironOreNearby = findVisibleIronOre(bot)
    const furnaceNearby = findNearestFurnace(bot)
    const furnaceCount = countItemInInventory(bot, 'furnace')
    const ironCount = countItemInInventory(bot, 'iron_ingot')
    const coalCount = countItemInInventory(bot, 'coal')
    const charcoalCount = countItemInInventory(bot, 'charcoal')
    const ironPickaxeCount = countItemInInventory(bot, 'iron_pickaxe')
    
    // Survival & Food
    const hungerStatus = getHungerStatus(bot)
    const foodNearby = findFoodItems(bot)
    const enemyNearby = getNearbyEnemies(bot)
    const enemyDistance = getEnemyDistance(bot)
    
    return {
        health: bot.health,
        food: bot.food,
        woodNearby: findVisibleWood(bot),
        stoneNearby: stoneNearby,
        isNight: bot.time.timeOfDay > 13000,
        nearCave: isNearCave(bot),
        woodInventory: logCount + plankCount,
        logCount: logCount,
        plankCount: plankCount,
        hasEnoughWood: hasEnoughWood(bot, 16),
        craftingTableCount: craftingTableCount,
        craftingTableNearby: craftingTableNearby,
        hasCraftingTable: craftingTableCount > 0 || craftingTableNearby !== null,
        cobblestoneCount: cobblestoneCount,
        pickaxeCount: pickaxeCount,
        hasPickaxe: pickaxeCount > 0,
        // Iron Age resources
        ironOreNearby: ironOreNearby,
        furnaceNearby: furnaceNearby,
        furnaceCount: furnaceCount,
        hasFurnace: furnaceCount > 0 || furnaceNearby !== null,
        ironCount: ironCount,
        coalCount: coalCount,
        charcoalCount: charcoalCount,
        fuel: coalCount + charcoalCount,
        ironPickaxeCount: ironPickaxeCount,
        hasIronPickaxe: ironPickaxeCount > 0,
        // Survival & Food
        hunger: hungerStatus.hunger,
        isHungry: hungerStatus.isHungry,
        isStarving: hungerStatus.isStarving,
        canHealing: hungerStatus.canHealing,
        foodNearby: foodNearby,
        enemyNearby: enemyNearby,
        enemyDistance: enemyDistance
    }
}

module.exports = {
    getEnvironment,
    countItemInInventory,
    hasEnoughWood,
    findNearestCraftingTable,
    findNearestFurnace,
    findVisibleStone,
    findVisibleIronOre,
    findFoodItems,
    getHungerStatus,
    getNearbyEnemies,
    getEnemyDistance
}