/**
 * eat_food.js
 * 🍖 SURVIVAL: Consume food from inventory to restore hunger
 * Essential for survival progression - prevents starvation
 * 
 * Returns: { success: boolean, reward: number }
 */

module.exports = {
    name: "eat_food",
    
    async execute(bot, state, sensors) {
        const env = sensors.getEnvironment(bot)
        
        // Check if already at full hunger
        if (env.hunger >= 19) {
            return {
                success: true,
                reward: 0.2,  // Small reward for not wasting food
                message: "Already well-fed"
            }
        }

        // Find edible items in inventory
        const edibleItems = [
            'apple', 'bread', 'cooked_beef', 'cooked_chicken', 
            'cooked_porkchop', 'carrot', 'potato', 'baked_potato',
            'melon_slice', 'golden_apple'
        ]

        let foodToEat = null
        for (const itemName of edibleItems) {
            foodToEat = bot.inventory.items().find(item => 
                item.name.includes(itemName)
            )
            if (foodToEat) break
        }

        // No food in inventory
        if (!foodToEat) {
            return {
                success: false,
                reward: -1,  // Critical - starving with no food
                message: "No food in inventory"
            }
        }

        try {
            // Eat the food
            await bot.eat()
            
            // Verify hunger increased
            await bot.waitForTicks(10)
            const newEnv = sensors.getEnvironment(bot)
            
            if (newEnv.hunger > env.hunger) {
                const reward = (newEnv.hunger - env.hunger) * 0.1 + 0.5
                return {
                    success: true,
                    reward: Math.min(reward, 1),
                    message: `Food consumed: hunger +${newEnv.hunger - env.hunger}`
                }
            } else {
                return {
                    success: false,
                    reward: -0.5,
                    message: "Food consumption failed"
                }
            }
        } catch (error) {
            return {
                success: false,
                reward: -0.8,
                message: `Eat action failed: ${error.message}`
            }
        }
    }
}
