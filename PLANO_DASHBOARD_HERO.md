# Plano de Implementação: Dashboard Flutuante na Hero Section

> **Decisão:** Dashboard flutuante com window chrome (dots vermelho/amarelo/verde estilo macOS)
> **Referência:** Imagem fornecida pelo usuário (dashboard financeiro com cards, adaptamos pro contexto médico/Nexus)
> **Status:** Planejamento — aguardando aprovação para implementar

---

## 1. O Que Vamos Construir

Um **dashboard codado em HTML/CSS** (não imagem) dentro de uma janela estilo macOS, posicionado na hero section. Minimalista, legível, com dados relevantes ao contexto do Nexus.

### Conteúdo do Dashboard (adaptado à referência):

```
┌─────────────────────────────────────────────────────────────┐
│  🔴 🟡 🟢                        Nexus AI Dashboard        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Pacientes │  │  Taxa    │  │Agendados │  │  Tempo   │   │
│  │  Hoje    │  │ Resposta │  │  Hoje    │  │  Médio   │   │
│  │          │  │          │  │          │  │          │   │
│  │   42     │  │  98%     │  │   12     │  │  30s     │   │
│  │ ▁▂▃▅▇   │  │  ●●●●○   │  │  +18%    │  │  ↓ 85%   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ┌────────────────────────────┐  ┌────────────────────┐    │
│  │  Conversões - Últimos 7d  │  │  Última Conversa   │    │
│  │                            │  │                    │    │
│  │       ╱‾‾‾╲               │  │ 🟢 Online agora    │    │
│  │      ╱     ╲╱‾‾           │  │                    │    │
│  │  ───╱                     │  │ Pac: "Quero        │    │
│  │                            │  │  agendar consulta" │    │
│  │  Seg Ter Qua Qui Sex Sáb  │  │                    │    │
│  └────────────────────────────┘  │ Nexus: "Claro!    │    │
│                                   │  Temos amanhã     │    │
│                                   │  14h ou 16h"      │    │
│                                   └────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Diferenças vs Referência:
- **Background dark** (não claro como na referência) — combina com a landing page
- **Sem sidebar** — mais minimalista, foco nos dados
- **Sem perfil de usuário** — irrelevante pro contexto
- **4 metric cards** em vez de muitos — legibilidade
- **Mini-chart** simples com CSS (barras ou SVG line)
- **Preview de conversa WhatsApp** — conecta com a proposta de valor
- **Cores:** purple (#7C7FF2), cyan (#5CB8C4), green (#3DAA8C), silver (#8A95A8)

---

## 2. Mudanças no Layout da Hero

### Estrutura Atual (centralizada):
```
[ Badge ]
[ Headline centralizado ]
[ Subtítulo ]
[ CTA ]
[ 3 Stats Cards ]
[ Integrations Marquee ]
```

### Estrutura Proposta — OPÇÃO 1: Dashboard Abaixo (Mais Seguro)
```
[ Badge ]
[ Headline centralizado ]
[ Subtítulo ]
[ CTA ]
[ ===== DASHBOARD FLUTUANTE ===== ]   ← NOVO
[ 3 Stats Cards ]                      ← mantém, mas pode sair
[ Integrations Marquee ]
```

**Pros:** Mínima mudança estrutural, não quebra o flow do texto
**Contras:** A hero fica mais longa (page scroll)

### Estrutura Proposta — OPÇÃO 2: Split Layout (Mais Impactante)
```
┌──────────────────┬──────────────────────┐
│  [ Badge ]       │                      │
│  [ Headline ]    │  [ DASHBOARD         │
│  [ Subtítulo ]   │    FLUTUANTE ]       │
│  [ CTA ]         │                      │
└──────────────────┴──────────────────────┘
[ 3 Stats Cards ]    ← full width abaixo
[ Integrations Marquee ]
```

**Pros:** Impacto visual máximo, aproveitamento do espaço, premium
**Contras:** Mudança maior no CSS, responsivo mais complexo

### Estrutura Proposta — OPÇÃO 3: Dashboard Abaixo do CTA, Remove Stats (Mais Limpo)
```
[ Badge ]
[ Headline centralizado ]
[ Subtítulo ]
[ CTA ]
[ ===== DASHBOARD FLUTUANTE ===== ]   ← NOVO (as métricas JÁ estão nele)
[ Integrations Marquee ]
```

**O que muda:** Os 3 stats cards (30s, 24/7, 78%) seriam REMOVIDOS porque o dashboard já mostra essas informações de forma mais rica. Evita redundância.

**Pros:** Hero mais enxuta, sem repetição, dashboard vira O elemento central
**Contras:** Perde os stats cards animados (mas o dashboard pode ter contadores animados também)

---

## 3. Recomendação Final

### **OPÇÃO 3** (Dashboard substitui Stats) é a mais inteligente

**Por quê:**
1. As stats cards atuais mostram: 30s, 24/7, 78%
2. O dashboard mostraria: Pacientes 42, Taxa 98%, Agendados 12, Tempo 30s
3. São informações que se SOBREPÕEM — ter os dois seria redundante
4. O dashboard é muito mais rico e visualmente impactante que 3 cards simples
5. Reduz o scroll necessário na hero (importante em mobile)

### Layout final proposto:
```
[ Nav ]
[ Badge ]
[ Headline centralizado ]
[ Subtítulo ]
[ CTA + micro-texto ]
        ↓ (32-48px de espaço)
┌─────────────────────────────────────────┐
│ 🔴 🟡 🟢         Nexus AI Dashboard    │
│                                         │
│  [42]  [98%]  [12]  [30s]              │
│   ↑      ↑     ↑     ↑                 │
│  cards de métricas animados             │
│                                         │
│  [Gráfico 7 dias]  [Mini chat WhatsApp] │
└─────────────────────────────────────────┘
        ↓ (24px de espaço)
[ Integrations Marquee ]
```

---

## 4. Detalhes Técnicos de Implementação

### HTML — Novo componente `hero-dashboard`
- Dentro de `.hero .container`, **após** `.hero-cta-group`
- **Substitui** `.hero-stats` (os 3 cards atuais)
- Estrutura:
  - `.hero-dashboard-wrapper` (posicionamento + glow)
    - `.hero-dashboard` (a janela)
      - `.dashboard-chrome` (header com dots)
      - `.dashboard-body`
        - `.dashboard-metrics` (grid de 4 cards)
        - `.dashboard-bottom` (gráfico + chat preview lado a lado)

### CSS
- Reutilizar classes `.mockup-window`, `.mockup-header`, `.dot` que já existem
- Adicionar animação de `float` (translateY -6px ↔ 0px, 6s ease-in-out infinite)
- Glow atrás com `::before` pseudo-element (blur roxo/ciano)
- Cards de métricas com glassmorphism sutil
- Gráfico: SVG inline ou barras CSS puras
- Chat preview: reutilizar estilo `.mockup-chat-bubble`
- Entrada com `opacity 0 → 1 + translateY(30px → 0)` delay 400ms

### Animações
1. **Float contínuo:** `translateY(-6px)` ↔ `translateY(6px)` — 6s loop
2. **Glow pulsante:** `box-shadow` roxo/ciano expandindo-contraindo — 4s loop
3. **Contadores:** Os números (42, 98%, 12, 30s) contam de 0 até o valor final
4. **Chat reveal:** As mensagens aparecem uma a uma com delay (como digitação)

### Responsivo (Mobile)
- Dashboard mantém layout mas fica full-width
- Metric cards: 2x2 grid em vez de 4x1
- Bottom row: stack vertical (gráfico em cima, chat embaixo)
- Mantém float animation mas com amplitude menor

---

## 5. Sobre Gerar Imagem vs Codar

### Decisão: CODAR o dashboard (não usar imagem)

**Motivos:**
1. O dashboard já na seção "Como Funciona" é codado — mantém consistência
2. Podemos ter contadores animados e chat com typing effect
3. Carrega mais rápido (sem imagem pesada)
4. É 100% responsivo
5. Podemos ajustar cores/dados facilmente no futuro
6. Se um dia quiser usar dados reais via API, já tem a estrutura

**Mas:** Se o resultado codado não ficar premium o suficiente, podemos gerar uma imagem IA depois como fallback.

---

## 6. O Que Remover/Mover

| Elemento                | Ação                | Motivo |
|:------------------------|:--------------------|:-------|
| `.hero-stats` (3 cards) | **REMOVER**         | Dashboard já tem métricas mais ricas |
| Badge                   | Manter              | Contexualiza o produto |
| Headline                | Manter              | Core da mensagem |
| Subtítulo               | Manter              | Complementa headline |
| CTA group               | Manter              | Conversão |
| Integrations marquee    | **MANTER, MAS DESCER** | Fica logo abaixo do dashboard |
| `.hero-orb`             | Manter              | Glow sutil de fundo |

---

## 7. Checklist de Implementação

- [ ] Criar HTML do `hero-dashboard` com 4 metric cards + chart + chat
- [ ] Estilizar com CSS (glassmorphism, cores da marca, window chrome)
- [ ] Adicionar float animation + glow pulsante
- [ ] Integrar contadores animados (JS — pode reusar o script existente)
- [ ] Adicionar typing effect no chat preview (JS)
- [ ] Remover `.hero-stats` do HTML
- [ ] Ajustar espaçamentos da hero section
- [ ] Testar responsivo mobile
- [ ] Comparar antes/depois no browser

---

*Plano criado em: 2026-02-10 23:30 | Aguardando aprovação para iniciar implementação*
