# 🧪 TESTE REAL - FASE 1

## ✅ Pré-requisitos

### 1. Servidor Minecraft
- [ ] Servidor rodando em `localhost:25565`
- [ ] Survival ou Creative mode
- [ ] Spawn area com acesso a:
  - Árvores (madeira)
  - Pedra/cobblestone
  - Minério de ferro (opcional, pro Iron Age)
  - Comida (maçã em árvores, ou criada em game)

### 2. Dependências Node
```bash
npm install
```

Deve instalar:
- `mineflayer` (bot Minecraft)
- `mineflayer-pathfinder` (navegação)
- `minecraft-data` (dados do jogo)
- `axios` (opcional)

### 3. Verificar configuração
- [ ] `index.js` tem `host: 'localhost', port: 25565`
- [ ] `index.js` tem `username: 'AI_Bot'`

---

## 🚀 Executar Teste

### Opção A: Modo Observação (RECOMENDADO PRIMEIRO)
```bash
node run.js
```
- Deixa rodar livre
- Observa console output
- 10-20 minutos é suficiente
- **Veja o que o bot faz**: progride? Morre? Entra em loop? É estranho?

### Opção B: Modo Coleta de Dados (DEPOIS)
```bash
node test-run.js
```
- Coleta dados estruturados por 20 minutos
- Salva em `logs/test-run-{timestamp}.json`
- Útil pra análise após-coleta

---

## 👀 O Que Observar

### ✅ Sinais BOM
- Bot coleta madeira → cria mesa → coleta pedra
- Toma decisões rápidas (não fica preso)
- Progressão clara: Wood Age → Stone Age → Iron Age
- Explora quando é seguro

### ❌ Sinais PROBLEMA
- [ ] Bot morre rapidinho (problema com sobrevivência)
- [ ] Fica em loop infinito (ação mal implementada)
- [ ] Ignora comida quando tem fome (prioridade errada)
- [ ] Foge quando não há perigo (sensores com bug)
- [ ] Não progride nunca (decisão ruim)
- [ ] Coleta tudo mesmo em perigo (prioridade errada)

### 🧠 Padrões a Procurar
1. Ε-greedy funcionando? (começa explorando, depois exploita)
2. Feedback system aprendendo? (as ações melhoram com tempo?)
3. Sobrevivência? (come quando está com fome, foge de mobs)
4. Progresso? (atinge milestones: craft_planks → craft_table → pickaxe)

---

## 📊 Dados Coletados (test-run.js)

Se usou `node test-run.js`, arquivo `logs/test-run-{timestamp}.json` terá:

```json
{
  "startTime": "2026-03-22T10:30:00Z",
  "duration": 1200,
  "stats": {
    "actions": 600,
    "explorations": 120,
    "exploitations": 480,
    "subGoalChanges": 5,
    "events": [...]
  },
  "observations": [...],
  "events": [...]
}
```

Procure por:
- `explorations` vs `exploitations` ratio (idealmente: começa 30%, acaba 5%)
- `subGoalChanges` (quantos milestones alcançou?)
- Eventos de morte/erro (críticos)

---

## 🛑 Parar o Bot

- `Ctrl+C` no terminal

---

## 📝 Resultado Esperado

Depois de 20 minutos no servidor real:

**Melhor cenário:**
- Bot alcançou Iron Age
- Comeu quando ficou com fome
- Fugiu de mob 1-2x
- Nenhuma morte

**Cenário OK:**
- Ficou preso em Wood/Stone Age
- 1-2 mortes por erro
- Não testou comida (fez tudo rápido)

**Cenário PROBLEMA:**
- Morreu logo (sobrevivência falhando)
- Não coletou nenhum recurso
- Entrou em loop ou ficou parado

---

## 🔄 Próxima Fase

Depois do teste real:
1. Documenta o que foi observado
2. Se problemas → fix rápido
3. Se OK → criar testes automatizados pra validar

---

## 💡 Dicas

- Não deixe solo perto del spawn (pois pode cavar)
- Se quiser acelerar, aumente `sleep(2000)` em `brainLoop()` → `sleep(1000)`
- Se sumir de tela, rode comandos Minecraft:
  ```
  /tp @e[name=AI_Bot] ~ ~1 ~
  ```

---

## ⚠️ Troubleshooting

**"Cannot find module 'mineflayer'"**
```bash
npm install
```

**"Connection refused"**
- Servidor Minecraft não está rodando
- Verifique porta 25565

**"Bot entrou mas não faz nada"**
- Verifique console (deve mostrar "Brain iniciando")
- Se vazio, pode estar preso em pathfinder

**"Bot morre logo"**
- Primeiro: check sobrevivência system
- Mude para Creative mode pra testar lógica sem morte
