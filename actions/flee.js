/**
 * flee.js
 * 🏃 SURVIVAL: Escape from nearby enemies with sprint boost
 * Critical action for survival system - triggered by mob proximity
 * Uses jump + sprint boost for maximum distance
 * 
 * Returns: { success: boolean, reward: number }
 */

module.exports = {
    name: "flee",
    
    async execute(bot, state, sensors) {
        const env = sensors.getEnvironment(bot)
        
        // If no enemies detected, this is a waste
        if (!env.enemyNearby || env.enemyDistance > 30) {
            return {
                success: false,
                reward: -0.3,
                message: "No nearby enemies"
            }
        }

        try {
            // Calculate escape direction (away from enemy)
            const enemyPos = env.enemyNearby.position
            const botPos = bot.entity.position
            
            const escapeX = botPos.x + (botPos.x - enemyPos.x) * 2
            const escapeZ = botPos.z + (botPos.z - enemyPos.z) * 2
            const escapeY = botPos.y
            
            // Sprint boost
            bot.setControlState('sprint', true)
            
            // Jump while running (makes escape faster)
            bot.setControlState('jump', true)
            await bot.waitForTicks(2)
            bot.setControlState('jump', false)
            
            // Begin pathfinding to safety
            const escapeGoal = new (require('mineflayer-pathfinder')).goals.GoalXZ(escapeX, escapeZ)
            await bot.pathfinder.goto(escapeGoal)
            
            // Stop sprinting
            bot.setControlState('sprint', false)
            
            // Check if we successfully increased distance
            await bot.waitForTicks(5)
            const newEnv = sensors.getEnvironment(bot)
            
            if (newEnv.enemyDistance > env.enemyDistance) {
                return {
                    success: true,
                    reward: 1.0,  // Maximum reward for successful escape
                    message: `Fled successfully: distance +${(newEnv.enemyDistance - env.enemyDistance).toFixed(1)}`
                }
            } else {
                return {
                    success: false,
                    reward: -0.5,
                    message: "Flee attempt unsuccessful - distance did not increase"
                }
            }
        } catch (error) {
            bot.setControlState('sprint', false)
            return {
                success: false,
                reward: -1,  // Critical failure - still in danger
                message: `Flee action failed: ${error.message}`
            }
        }
    }
}
