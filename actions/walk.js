module.exports = {
    name: "walk_random",

    async execute(bot, state, sensors) {
        const directions = ['forward', 'left', 'right']
        const dir = directions[Math.floor(Math.random() * directions.length)]

        bot.setControlState(dir, true)

        setTimeout(() => {
            bot.setControlState(dir, false)
        }, 1500)

        return { success: true, reward: 0.1 }
    }
}