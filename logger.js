const fs = require('fs')
const path = require('path')

const logDir = path.join(__dirname, 'logs')

// Criar pasta de logs se não existir
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir)
}

// Nome do arquivo de log com timestamp
const today = new Date().toISOString().split('T')[0]
const logFile = path.join(logDir, `bot_${today}.log`)

// Limpador de log: manter apenas últimos 7 dias
function cleanOldLogs() {
    const files = fs.readdirSync(logDir)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    
    files.forEach(file => {
        const filePath = path.join(logDir, file)
        const stats = fs.statSync(filePath)
        if (stats.mtimeMs < sevenDaysAgo) {
            fs.unlinkSync(filePath)
        }
    })
}

function writeLog(type, message, data = null) {
    const timestamp = new Date().toISOString()
    let logEntry = `[${timestamp}] [${type}] ${message}`
    
    if (data) {
        logEntry += ` | ${JSON.stringify(data)}`
    }
    
    logEntry += '\n'
    
    try {
        fs.appendFileSync(logFile, logEntry)
    } catch (e) {
        console.error('Erro ao escrever log:', e.message)
    }
}

module.exports = {
    action: (actionName, details) => {
        writeLog('ACTION', `Executando: ${actionName}`, details)
    },
    
    decision: (subGoal, reasoning) => {
        writeLog('DECISION', `SubGoal: ${subGoal}`, { reason: reasoning })
    },
    
    status: (health, food, inventory) => {
        writeLog('STATUS', 'Bot status', { health, food, inventory })
    },
    
    resource: (type, count) => {
        writeLog('RESOURCE', `${type}: ${count}`)
    },
    
    info: (message, data) => {
        writeLog('INFO', message, data)
    },
    
    warning: (message, data) => {
        writeLog('WARNING', message, data)
    },
    
    error: (message, data) => {
        writeLog('ERROR', message, data)
    },
    
    progress: (milestone) => {
        writeLog('PROGRESS', milestone)
    },
    
    cleanOldLogs: cleanOldLogs
}