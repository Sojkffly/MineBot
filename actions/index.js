const fs = require('fs')
const path = require('path')

const actions = {}

const files = fs.readdirSync(__dirname)

for (const file of files) {
    if (file === "index.js") continue

    const action = require(path.join(__dirname, file))

    actions[action.name] = action.execute
}

module.exports = actions