# 🧠 Epsilon-Greedy Strategy (ε-greedy)

## O que é ε-greedy?

**ε-greedy é o turning point entre:**
- ❌ Bot que apenas evita erros
- ✅ Bot que ativamente procura soluções melhores

---

## Conceito Fundamental

```
┌─────────────────────────────────────────────────────────┐
│        EXPLORAÇÃO vs EXPLORAÇÃO (EXPLOITATION)          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  80-90% do tempo (1-ε):                                │
│  └─ Use a MELHOR ação conhecida (greedy)              │
│                                                         │
│  10-20% do tempo (ε):                                  │
│  └─ Tente uma ação ALEATÓRIA (exploration)            │
│                                                         │
│  Benefício: Descobre estratégias melhores que         │
│  nunca foram tentadas antes!                           │
└─────────────────────────────────────────────────────────┘
```

---

## Como Funciona em MineAI

### 1. **Taxa de Exploração Dinâmica**

```javascript
function getExplorationRate(state) {
    const actionCount = state.actionHistory.length
    
    if (actionCount < 20) return 0.3      // 30% exploração (aprendendo rápido)
    if (actionCount < 50) return 0.2      // 20% exploração (conhecimento inicial)
    if (actionCount < 100) return 0.1     // 10% exploração (refinamento)
    return 0.05                           // 5% exploração (ocasional)
}
```

**Estratégia inteligente:**
- **Início:** 30% → Bot é agressivamente curioso (novo no mundo)
- **Mid-game:** 20% → Balanço entre explorar e explotar
- **Late-game:** 5% → Confia nas estratégias que funcionam

### 2. **Decisão em Tempo Real**

```
A cada ciclo:

1. Gerar número aleatório (0-1)
2. Se random < EPSILON:
   └─ EXPLORAÇÃO: Pegar ação aleatória
   └─ Log com 🧪 ou 🔍
3. Senão:
   └─ EXPLORAÇÃO: Usar subGoal escolhido
   └─ Usar melhores ações conhecidas
```

### 3. **Integração com SubGoal System**

```
NOVO FLUXO:

chooseAction(bot, state, env, actions)
  ├─ epsilon = getExplorationRate(state)
  ├─ Se random < epsilon:
  │  └─ Retorna ação aleatória 🧪
  └─ Senão:
     └─ Usa subGoal system como antes 🎯
```

---

## Exemplo Prático

### Cenário: Bot está em "get_stone"

```
AÇÃO 1-80: Exploração
  └─ Random < 0.2? Sim!
  └─ Pega ação aleatória: "walk_random"
  └─ Resultado: Encontra nova área com MAIS pedra!
  └─ Reward: +0.1
  └─ 🧪 Exploração descobriu oportunidade

AÇÃO 81-100: Exploração
  └─ Random < 0.2? Não
  └─ Segue subGoal: "mine_stone"
  └─ Usa estratégia conhecida
  └─ Reward: +1.0
  └─ 🎯 Exploração executa melhor ação
```

---

## Dinâmica de Aprendizado

### Before (Sem ε-greedy)

```
Bot sempre faz:
  1. collect_wood
  2. craft_planks
  3. craft_table
  
Se falhar em qualquer um:
  └─ Pula pra explore
  
Problema: Nunca encontra ALTERNATIVAS melhores!
```

### After (Com ε-greedy)

```
Bot faz:
  1. 80% das vezes: Segue sequência (exploração)
  2. 20% das vezes: Testa coisas aleatórias (exploração)
  
Se a exploração encontra algo melhor:
  └─ Score sobe
  └─ Próxima vez: Pode incorporar nova estratégia
  
Resultado: Bot EVOLUI continuamente! 🧠
```

---

## Dashboard Agora Mostra

```
═════════════════════════════════════════════════════════
  📊 STATUS | PROGRESSION → GET_STONE
─────────────────────────────────────────────────────────
  ❤️  18/20 | 🍖 15/20 | 📍 (123, 64, -45)
  📦 Wood: 4 logs + 8 planks | Stone: 3 | Tool: 1 pick
─────────────────────────────────────────────────────────
  🏆 Best: collect_wood(0.9), explore(0.6)
  💔 Worst: walk_random(-0.1)
─────────────────────────────────────────────────────────
  🧠 Learning: Actions=45 | Epsilon=20% | Mode=🔍 EXPLORING
═════════════════════════════════════════════════════════
```

**Leitura:**
- `Actions=45`: Bot executou 45 ações (ainda em apredizado)
- `Epsilon=20%`: 20% das próximas ações serão exploratórias
- `Mode=🔍 EXPLORING`: ESSE ciclo foi exploração
- `Mode=🎯 EXPLOITING`: ESSE ciclo foi exploração

---

## Impacto Real

### Taxa de Sucesso ao Longo do Tempo

```
Início         Mid              Late
─────────────────────────────────────────
Ciclo 10:  collect_wood       Success 40%
           mine_stone         Success 10%
           craft              Success 50%

Ciclo 50:  collect_wood       Success 90%  ↑ Bot aprendeu!
           mine_stone         Success 70%  ↑ Melhoria!
           craft              Success 95%  ↑ Otimizado!
           [new path]         Success 60%  ← Exploração descobriu!

Ciclo 100: collect_wood       Success 95%  ✅ Dominado
           mine_stone         Success 85%
           craft              Success 99%
           [optimized path]   Success 85%  ← Refinado
```

---

## Por Que Isso É Crítico?

### 1. **Evita Local Optima (Aprisionamento)**

```
SEM ε-greedy:
  ├─ Bot encontra uma forma que funciona (score 0.5)
  ├─ Sempre usa essa forma
  └─ Nunca descobre que existe melhor (score 0.9)
     → PRESO em solução medíocre

COM ε-greedy:
  ├─ Bot encontra forma que funciona (score 0.5)
  ├─ 20% das vezes testa alternativas
  ├─ Descobre forma MELHOR (score 0.9)
  └─ Adapta e usa nova form de agora em diante
     → LIVRE para se adaptar
```

### 2. **Aprendizado Contínuo**

```
A cada ciclo, o bot:
  ├─ Explora (20%): Testa novas ideias
  ├─ Coleta dados sobre viabilidade
  ├─ Atualiza scores
  └─ Próximo ciclo: Usa melhor conhecimento
```

### 3. **Descoberta Emergente**

```
O bot pode descobrir:
  ├─ "Explorar para nordeste leva a mais R pedra"
  ├─ "Craftar antes de minerar economiza tempo"
  ├─ "Saltar durante caminhada pula obstáculos"
  └─ Nenhuma dessas foi programada! 🤯
```

---

## Parâmetros Ajustáveis

### Aumentar Exploração

```javascript
// Para bot mais curioso/experimental
if (actionCount < 50) return 0.4      // 40% exploração
if (actionCount < 100) return 0.3
return 0.1
```

**Resultado:** Bot testa mais, descobre mais, leva mais tempo pro sucesso

### Diminuir Exploração

```javascript
// Para bot focado/confiante
if (actionCount < 50) return 0.15     // 15% exploração
return 0.05
```

**Resultado:** Bot confiante, sucesso rápido, pode perder oportunidades

---

## Próximo Passo: Contextual ε-greedy

```javascript
// AVANÇADO: Exploração baseada em contexto
function getContextualEpsilon(state, action) {
    // Minerar é bom quando tem pedra
    if (action === "mine_stone" && !env.stoneNearby) {
        return 0.5  // Explore agressivamente (high epsilon)
    }
    
    // Craftabilidade é confiável
    if (action.includes("craft")) {
        return 0.05  // Explore raramente (low epsilon)
    }
    
    return getExplorationRate(state)
}
```

**Benefício:** Epsilon dinâmico adapta ao CONTEXTO (não só ao tempo)

---

## Métricas de Evolução

```
Monitor no status:

Actions=10:   Epsilon=30%  → Bot agressivamente curioso
Actions=50:   Epsilon=20%  → Bot descobrir e consolidar
Actions=100:  Epsilon=10%  → Bot refinando estratégias
Actions=200:  Epsilon=5%   → Bot especializado
```

Se bot fica preso, epsilon retorna alto automaticamente (via history reset ou decay).

---

## A Transformação Completa

```
FASE 1: Aprendizado Passivo (Feedback System)
  └─ Bot evita açõesrins

FASE 2: Aprendizado Ativo (ε-greedy) ← VOCÊ ESTÁ AQUI 🚀
  └─ Bot procura ativamente melhores soluções

FASE 3: Aprendizado Contextual (Futuro)
  └─ Bot adapta exploração baseado em mundo

FASE 4: Meta-Learning (Futuro Distante)
  └─ Bot aprende a aprender
```

---

## Código Implementado

**Em brain.js:**
- `getExplorationRate(state)` → taxa dinâmica
- `chooseAction()` → integração ε-greedy
- Display no dashboard → visibilidade

**Resultado:**
- ✅ ε-greedy explorando 20% das ações
- ✅ Taxa diminui com experiência
- ✅ Console mostra modo (EXPLORING vs EXPLOITING)
- ✅ Logs registram exploração para análise

---

## Resumo

**ε-greedy transforma aprendizado:**

```
Passivo (evita ruim) → Ativo (busca o melhor)
```

É a diferença entre um bot que SEGUE instruções e um bot que EVOLUI!

🎓 **Isso é inteligência adaptativa de verdade.**
