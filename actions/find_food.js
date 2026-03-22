/**
 * find_food.js
 * 🍖 SURVIVAL: Locate and navigate to nearby food items
 * Food can be dropped items or crops (when available)
 * 
 * Returns: { success: boolean, reward: number }
 */

module.exports = {
    name: "find_food",
    
    async execute(bot, state, sensors) {
        const env = sensors.getEnvironment(bot)
        
        // If no food nearby
        if (!env.foodNearby) {
            return { 
                success: false, 
                reward: -0.5,  // Light penalty - encourage exploration
                message: "No food found in visible area"
            }
        }

        try {
            // Navigate to the food item
            const goalPos = env.foodNearby.position
            
            // Simple pathfinding attempt
            await bot.pathfinder.goto(goalPos)
            
            // Wait a moment for collection
            await bot.waitForTicks(5)
            
            return {
                success: true,
                reward: 0.8,  // Good reward for finding and reaching food
                message: "Food located and reached"
            }
        } catch (error) {
            // Pathfinding failed or path blocked
            return {
                success: false,
                reward: -0.3,
                message: `Find food failed: ${error.message}`
            }
        }
    }
}
