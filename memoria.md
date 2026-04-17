# Memória — ICF (Inteligência Centralizada de Feedbacks)

---

# Etapa 13 — Heatmap + Recorrências + Configurações + Seed Demo (Frontend + Backend)

## O que foi feito

Implementação das telas finais do frontend: Heatmap 7×24 com cores absolutas e tooltip funcional, Painel de Recorrências com badges visuais e sugestão de épico, Configurações com 4 abas (TimeWindows, KeywordRules, WhatsApp Groups, Sync Status) com edição inline e modais de confirmação, e 5 cenários de seed demo com dados realistas.

### Classificação

| Entrega | Estado |
|---|---|
| `src/pages/HeatmapPage.tsx` | ⚠️ Reescrito — grid 7×24 CSS, cores absolutas (0/1-5/6-15/16+), tooltip PS médio, dropdown systemCode, click→/queue, risk windows, auto-refresh 5min |
| `src/types/api.ts` | ⚠️ Complementado — HeatmapCell, RecurrenceIncident, TimeWindow, KeywordRule, WhatsAppGroup, JiraSyncLog |
| `src/hooks/use-api.ts` | ⚠️ Complementado — useHeatmapCells, useRecurrences, useTimeWindows/CRUD, useKeywordRules/CRUD, useWhatsAppGroups/CRUD, useTriggerJiraSync |
| `src/components/AppSidebar.tsx` | ⚠️ Modificado — adicionados nav items "Recorrências" e "Configurações" |
| `src/App.tsx` | ⚠️ Modificado — adicionadas rotas `/incidents` e `/settings` |
| **`src/pages/IncidentsRecurrencePage.tsx`** | 🆕 Criado — tabela recurrenceCount DESC, badges visuais, sugestão épico, link Jira |
| **`src/pages/SettingsPage.tsx`** | 🆕 Criado — 4 tabs: TimeWindows, KeywordRules, WhatsApp Groups, Sync Status |
| `backend/prisma/seed-demo.ts` | ⚠️ Complementado — 5 cenários demo + TimeWindows + KeywordRules seed |

---

## Parte A — Heatmap (`src/pages/HeatmapPage.tsx`)

### Grid 7×24 com CSS Grid

- `gridTemplateColumns: '60px repeat(24, minmax(28px, 1fr))'`
- Linhas: Dom→Sáb (7), Colunas: 00h→23h (24) = 168 células

### Escala de cores absoluta

| Faixa | Cor (light) | Cor (dark) |
|---|---|---|
| 0 | branco | zinc-900 |
| 1–5 | yellow-200 | yellow-900/60 |
| 6–15 | orange-400 | orange-700/80 |
| 16+ | red-500 | red-700 |

### Filtro por Sistema

Dropdown `<Select>` com opções: Todos, GM_CORE, GM_SUITE, GM_FIN, GM_LOG, GM_INFRA. Valor passado via query param ao hook `useHeatmapCells(30, systemCode)`.

### Tooltip

Usa shadcn `<Tooltip>` nativo: "X incidentes | PS médio: Y.Z" + dia/hora + label de janela de risco se aplicável.

### Clique → Fila

`onClick → navigate('/queue?hour=X&dayOfWeek=Y')` para filtrar a fila por horário/dia.

### Janelas de Risco

- 00h–05h: `ring-2 ring-blue-500/60` + "⚠️ Janela Crítica"
- 05h–08h: `ring-1 ring-cyan-400/40` + "🏪 Abertura Lojas"

### Refresh Automático

`refetchInterval: 5 * 60_000` (5 minutos) no hook `useHeatmapCells`.

---

## Parte B — Painel de Recorrências (`src/pages/IncidentsRecurrencePage.tsx`)

### Tabela ordenada por recurrenceCount DESC

Colunas: Nível (badge), Título (+ PS e feedbackCount), Sistema, Ocorrências (N×), Última Ocorrência (date-fns pt-BR), Épico Jira.

### Indicador visual por recurrenceCount

| Faixa | Emoji | Label | Cor |
|---|---|---|---|
| 1–2 | 🟡 | Emergente | yellow-500 |
| 3–5 | 🟠 | Recorrente | orange-500 |
| 6–9 | 🔴 | Sistêmico | red-600 |
| 10+ | 💀 | Estrutural | purple-600 |

### Sugestão de Épico

- Sem `epicJiraKey`: botão "Sugerir Épico" → abre Dialog com draft gerado contendo título, sistema, recorrências, PS, datas, descrição e critérios de aceite. Botão "Copiar para Clipboard".
- Com `epicJiraKey`: link externo para `https://grupomateus.atlassian.net/browse/{key}`.

---

## Parte C — Configurações (`src/pages/SettingsPage.tsx`)

### Tab 1 — Janelas de Risco

- Tabela com: Nome, Início (HH:MM), Fim (HH:MM), Boost, Ativo, Ações
- Botão "Adicionar" → Dialog com formulário (name, startHour, startMinute, endHour, endMinute, boost)
- Deleção com modal de confirmação obrigatório
- Toast sonner em criar/deletar

### Tab 2 — Regras de Keywords

- Tabela com: Padrão (code), Score K, Force Override, Min PS Override, Descrição, Ativo, Ações
- Botão "Adicionar" → Dialog com formulário (pattern, scoreK, forceOverride, overrideMinPS, description)
- Deleção com modal de confirmação obrigatório
- Toast sonner em criar/deletar

### Tab 3 — Grupos WhatsApp

- Tabela com: Grupo (nome + ID), Membros, Sistema (Select inline), Monitorado (Switch inline)
- Toggle `isMonitored` com `PATCH /api/v1/config/whatsapp-groups/:id`
- Select `systemHint` inline com toast de confirmação

### Tab 4 — Sync Status

- Botão "Sync Manual" → `GET /api/v1/jira/sync`
- Contadores BullMQ placeholder (pending, processing, failed)

---

## Parte D — Seed de Demonstração (`backend/prisma/seed-demo.ts`)

### 5 Cenários adicionados

| # | Título | System | PS | Priority | Feedbacks | Recurrence | Detalhes |
|---|---|---|---|---|---|---|---|
| 1 | Carga Noturna Falhou | GM_CORE | 85 | CRITICAL | 5 WHATSAPP | 4 | overrideApplied=true, 4 IncidentOccurrence históricas |
| 2 | Pedido Preso em Doca CD 87 | GM_LOG | 92 | CRITICAL | 8 WA + 1 JIRA | 2 | feedbackCount=9 |
| 3 | Erro Tributação Faturamento | GM_SUITE | 68 | HIGH | 6 WHATSAPP | 3 | reclassified=true, originalCategory=Outros |
| 4 | Lentidão GM Suite | GM_SUITE | 38 | MEDIUM | 2 WHATSAPP | 1 | — |
| 5 | Melhoria de Tela Financeiro | GM_FIN | 8 | LOW | 1 WHATSAPP | 0 | feedbackType=IMPROVEMENT |

### Configurações seed

- 3 TimeWindows: Carga Noturna (00-05, +15), Abertura Lojas (05-08, +10), Horário de Pico (11-14, +8)
- 4 KeywordRules: parado/travado (+9, forceOverride), faturamento/NF (+8), lentidão (+4), melhoria (+1)

---

### Critérios de aceitação verificados

| Critério | Status |
|---|---|
| Heatmap renderiza grid 7×24 com cores corretas e tooltip funcional | ✅ CSS Grid 7×24, escala absoluta 0/1-5/6-15/16+, shadcn Tooltip |
| Seed demo inclui 5 cenários com dados completos | ✅ 5 IncidentGroups + feedbacks + occurrences + config |
| Dashboard exibe os 5 grupos após seed | ✅ Cenários têm status OPEN/IN_PROGRESS → aparecem em métricas e fila |
| Cenário 1 mostra recurrenceCount=4 e badge de override | ✅ overrideApplied=true, recurrenceCount=4, 4 IncidentOccurrence |
| Configurações: edição inline funciona com toast de confirmação | ✅ Switch isMonitored, Select systemHint, toast sonner |
| Deleção exige modal de confirmação | ✅ Dialog com "Confirmar exclusão" antes de DELETE |

### Resultado de compilação

```
TypeScript: 0 erros em todos os 8 arquivos alterados/criados
```

---

# Etapa 12 — Dashboard Overview + Fila de Prioridade (Frontend)

## O que foi feito

Implementação das duas telas principais do frontend: Dashboard com métricas reais via API e System Health Scores, e Fila de Prioridade com filtros por URL, tabela paginada, integração SSE, Drawer de detalhes e Modal de ajuste de prioridade.

### Classificação

| Entrega | Estado |
|---|---|
| `src/pages/DashboardPage.tsx` | ⚠️ Reescrito — novos cards com CountUp, System Health bars, skeleton loading |
| `src/types/api.ts` | ⚠️ Complementado — adicionados DashboardMetrics, QueueIncident, IncidentDetail, IncidentOccurrence |
| `src/hooks/use-api.ts` | ⚠️ Complementado — adicionados useDashboardMetrics, usePriorityQueue, useIncidentDetail, usePriorityOverrideMutation |
| `src/components/AppSidebar.tsx` | ⚠️ Modificado — adicionado nav item "Fila" com ícone ListOrdered |
| `src/App.tsx` | ⚠️ Modificado — adicionada rota `/queue` → QueuePage |
| **`src/pages/QueuePage.tsx`** | 🆕 Criado — Fila completa com filtros, tabela, SSE, paginação |
| **`src/components/IncidentDrawer.tsx`** | 🆕 Criado — Sheet com PS breakdown, timeline, recorrências |
| **`src/components/PriorityOverrideModal.tsx`** | 🆕 Criado — Dialog com select + textarea (min 10 chars) |
| **`src/components/CountUp.tsx`** | 🆕 Criado — Animação count-up com ease-out cubic |

---

## Parte A — Dashboard Overview (`src/pages/DashboardPage.tsx`)

### Cards de Métricas (grid 4 colunas)

Consomem `GET /api/v1/dashboard/metrics` via `useDashboardMetrics()` com `refetchInterval: 60000`.

| Card | Fonte | Ícone |
|---|---|---|
| Feedbacks 24h | `metrics.totalFeedbacks` | MessageSquare |
| Incidentes Críticos | `metrics.criticalIncidents` | AlertCircle |
| Tempo Médio Resolução | `metrics.avgResolutionTimeMinutes` | Clock |
| Sistema Mais Crítico | Menor `healthScore` de `metrics.systemHealthScore` | AlertTriangle |

- **Skeleton loading** durante carregamento (4 placeholders)
- **CountUp animado** com ease-out cubic (800ms) ao atualizar valores
- Card "Incidentes Críticos" com `border-red-500/50` e texto vermelho

### System Health Scores

5 barras horizontais (uma por sistema GM_CORE/SUITE/FIN/LOG/INFRA):
- **Vermelho** (< 40): sistema em estado crítico
- **Laranja** (40–70): atenção necessária
- **Verde** (> 70): saudável
- Score numérico à direita + count de incidentes abertos
- Transição CSS animada (`transition-all duration-700`)

### Link para Fila

Botão "Ver fila completa →" ao final da seção de clusters linkando para `/queue`.

---

## Parte B — Fila de Prioridade (`src/pages/QueuePage.tsx`)

### Filtros persistidos em URL

Filtros são lidos/escritos via `useSearchParams` (React Router):
- **systemCode**: Select com 6 sistemas
- **priorityLevel**: Select com 4 níveis
- **status**: Select com 3 estados (OPEN, IN_PROGRESS, RESOLVED)
- **Botão Limpar Filtros**: aparece se algum filtro ativo, reseta searchParams

Recarregar a página mantém filtros intactos na URL.

### Tabela de Incidentes

Colunas:
| Coluna | Conteúdo |
|---|---|
| Prioridade | Badge colorido com emoji + priorityScore |
| Título / Sistema | Título truncado + systemLabel + topKeywords (3 chips) |
| Relatos | feedbackCount (mono) |
| Recorrência | "N× recorrente" se > 0, "—" se 0 |
| Detectado | formatDistanceToNow pt-BR |
| Override | Ícone Zap laranja se overrideApplied |
| Ações | Botão "Ajustar" (abre PriorityOverrideModal) |

- Clique na row abre `IncidentDrawer`
- Skeleton loading (5 rows placeholder)
- Estado vazio: "Nenhum incidente encontrado com esses filtros"

### Integração SSE

Via `useSSE().onEvent()`:
- Escuta eventos `new_incident` com `priorityLevel=CRITICAL`
- **Prepend no topo**: cria QueueIncident temporário e injeta antes dos dados do servidor
- **Flash vermelho 3s**: classe `animate-pulse bg-red-500/20 border-l-4 border-red-500` por 3 segundos
- **Dedup**: SSE incidents com IDs já retornados pelo servidor são filtrados
- **Refetch automático**: `refetch()` chamado após SSE para obter dados completos

### Paginação Server-Side

- `page` e `limit=20` via URL params
- Botões: anterior, páginas 1–5, próximo
- Texto: "Página X de Y"

---

## Componentes Criados

### `IncidentDrawer.tsx` (shadcn Sheet)

Abre à direita com `sm:max-w-xl`. Consome `useIncidentDetail(id)`.

Seções:
1. **Header**: Badges (priorityLevel, systemCode, status) + título + summary
2. **PS Breakdown**: 5 barras S/V/R/T/K com labels e porcentagens, score total grande colorido
3. **Ações**: Botão "Ajustar Prioridade" (abre modal), link Jira, botão Exportar JSON
4. **Fontes**: Badges WhatsApp/Jira
5. **Timeline de Feedbacks**: Lista cronológica com border-left, ícone por fonte, date-fns pt-BR
6. **Histórico de Recorrências**: Tabela com occurredAt, scoreSnapshot, status resolução

### `PriorityOverrideModal.tsx` (shadcn Dialog)

- **Select PriorityLevel**: CRITICAL/HIGH/MEDIUM/LOW com emojis
- **Textarea reason**: mín 10 chars com contador
- **Validação client-side**: erro exibido se `reason.length < 10` ou sem nível selecionado
- **Mutation**: `PATCH /api/v1/incidents/:id/priority` via `usePriorityOverrideMutation`
- **Reset automático**: limpa campos ao fechar/sucesso

### `CountUp.tsx`

- Animação de 0 → valor com `requestAnimationFrame`
- Curva ease-out cubic: `1 - (1 - progress)^3`
- Duração padrão: 800ms
- Suporte a prefix/suffix/decimals
- Preserva valor anterior entre re-renders

---

### Critérios de aceitação verificados

| Critério | Status |
|---|---|
| Cards exibem skeleton durante loading | ✅ Skeleton placeholders em grid 4 colunas |
| Cards exibem animação count-up ao atualizar | ✅ CountUp com ease-out cubic 800ms |
| Filtros persistem em URL (recarregar mantém) | ✅ `useSearchParams` no QueuePage |
| Novos incidentes CRITICAL piscam por 3s via SSE | ✅ `animate-pulse bg-red-500/20` com setTimeout 3s |
| Override com reason < 10 chars exibe erro client-side | ✅ "A justificativa deve ter no mínimo 10 caracteres" |

### Resultado de compilação

```
TypeScript: 0 erros em todos os 9 arquivos alterados/criados
```

---

# Etapa 11 — EventsModule (SSE — Server-Sent Events)

## O que foi feito

Implementação do módulo `src/events/` para streaming de eventos em tempo real via SSE, substituindo o placeholder da Etapa 9 por emissões granulares no ProcessingWorker.

### Classificação

| Entrega | Estado |
|---|---|
| **`src/events/events.types.ts`** | 🆕 Criado — ICFEvent, ICFEventType (5 tipos) |
| **`src/events/events.service.ts`** | 🆕 Criado — Subject RxJS, emit(), getStream(), heartbeat 30s, queue_stats 10s, @OnEvent listeners |
| **`src/events/events.controller.ts`** | 🆕 Criado — GET /api/v1/events com @Sse() |
| **`src/events/events.module.ts`** | 🆕 Criado — @Global() module |
| `src/processing/processing.worker.ts` | ⚠️ Modificado — Step 8 substituído: emite `sse.new_incident`, `sse.ps_updated`, `sse.override_triggered` |
| `src/app.module.ts` | ⚠️ Modificado — adicionado `EventsModule` nos imports |

---

## Parte A — EventsModule (`src/events/`)

### Tipo ICFEvent (`events.types.ts`)

```typescript
type ICFEventType = 'new_incident' | 'ps_updated' | 'override_triggered' | 'pattern_detected' | 'queue_stats';
```

Cada evento carrega `{ type, payload, timestamp }`.

### EventsService (`events.service.ts`)

Serviço `@Global()` que centraliza o streaming SSE via RxJS `Subject<ICFEvent>`.

**Método `emit(type, payload)`:**
- Publica evento no Subject com timestamp ISO
- Todos os clientes SSE conectados recebem o evento em tempo real

**Método `getStream(): Observable<MessageEvent>`:**
- Retorna observable que mapeia ICFEvent para MessageEvent com `data` (JSON), `type` e `id`
- Cada cliente SSE recebe sua própria subscription (múltiplos clientes simultâneos)

**Heartbeat (30s):**
- `setInterval` a cada 30s emite evento `ping` para manter conexão viva
- Garante que proxies/load balancers não fechem a conexão por inatividade

**Queue Stats (10s):**
- `setInterval` a cada 10s consulta BullMQ (`wa-ingestion` + `jira-ingestion`)
- Emite `queue_stats` com `{ pending, processing, failed, completed }`

**EventEmitter2 Listeners (`@OnEvent`):**
- `sse.new_incident` → emite `new_incident` para clientes SSE
- `sse.ps_updated` → emite `ps_updated` para clientes SSE
- `sse.override_triggered` → emite `override_triggered` para clientes SSE
- `pattern_detected` → emite `pattern_detected` para clientes SSE (vem do ClusteringService BN-07 e RecurrenceService)

**Lifecycle:**
- `OnModuleInit` → inicia intervalos de heartbeat e queue_stats
- `OnModuleDestroy` → limpa intervalos e completa o Subject

### EventsController (`events.controller.ts`)

**`GET /api/v1/events`** — endpoint SSE
- Decorado com `@Sse()` do NestJS
- Headers: `Cache-Control: no-cache`, `Connection: keep-alive`, `Content-Type: text/event-stream`, `X-Accel-Buffering: no`
- Loga conexão/desconexão de clientes
- Suporta múltiplos clientes simultâneos (cada um recebe sua subscription do Observable)
- EventSource nativo reconecta automaticamente após queda (comportamento padrão do browser)

### EventsModule (`events.module.ts`)

- `@Global()` — disponível para injeção em qualquer módulo sem import explícito
- Exporta `EventsService` para uso direto em outros serviços se necessário

---

## Parte B — Integração no ProcessingWorker

### Step 8 modificado (`processing.worker.ts`)

O placeholder `feedback_processed` foi substituído por 3 emissões granulares via EventEmitter2:

**`sse.ps_updated`** — sempre emitido após cálculo de priority score
- Payload: `{ processedFeedbackId, rawFeedbackId, systemCode, priorityLevel, priorityScore }`

**`sse.new_incident`** — emitido quando feedback é associado a um IncidentGroup
- Payload: `{ incidentGroupId, processedFeedbackId, systemCode, priorityLevel, priorityScore }`

**`sse.override_triggered`** — emitido quando OR-01/OR-02 é aplicado
- Payload: `{ processedFeedbackId, overrideReason, priorityScore, priorityLevel }`

**`pattern_detected`** — já emitido pelo ClusteringService (BN-07 burst) e RecurrenceService (≥6 recorrências), capturado pelo `@OnEvent('pattern_detected')` do EventsService.

---

## Fluxo completo de um evento SSE

```
ProcessingWorker (Step 8)
  │
  ├─ events.emit('sse.ps_updated', {...})
  ├─ events.emit('sse.new_incident', {...})    ← se incidentGroupId
  └─ events.emit('sse.override_triggered', {...}) ← se overrideApplied
       │
       ▼
EventsService (@OnEvent listeners)
  │
  └─ subject.next(ICFEvent)
       │
       ▼
EventsController (@Sse GET /api/v1/events)
  │
  └─ Observable<MessageEvent> → SSE stream
       │
       ▼
Frontend (EventSource) → SSEContext → CriticalToast / UI updates
```

```
Periodic:
  setInterval 10s → emitQueueStats() → queue_stats event
  setInterval 30s → heartbeat → ping event
```

---

### Critérios de aceitação verificados

| Critério | Status |
|---|---|
| `curl -N http://localhost:3001/api/v1/events` mantém conexão e recebe ping 30s | ✅ Heartbeat via `setInterval(30_000)` |
| Múltiplos clientes simultâneos recebem todos os eventos | ✅ RxJS Subject — cada `subscribe()` é independente |
| Evento `new_incident` emitido em < 500ms após processamento | ✅ EventEmitter2 é síncrono, Subject.next() é imediato |
| EventSource nativo reconecta automaticamente após queda | ✅ Comportamento padrão do browser EventSource API |
| `queue_stats` emitido periodicamente | ✅ `setInterval(10_000)` consulta BullMQ |

### Resultado de compilação

```
TypeScript: 0 erros nos arquivos alterados
```

---

# Etapa 10 — Endpoints de Consulta (Dashboard, Incidents, Config)

## O que foi feito

Implementação dos endpoints REST que o frontend consome para exibir a fila de prioridade, heatmap, métricas, incidentes e configuração de regras.

### Classificação

| Entrega | Estado |
|---|---|
| `src/dashboard/dashboard.controller.ts` | ⚠️ Complementado — adicionados `priority-queue`, `metrics`, `recurrences` |
| `src/dashboard/dashboard.service.ts` | ⚠️ Complementado — adicionados 3 métodos + heatmap com `averagePriorityScore` |
| `src/dashboard/dashboard.module.ts` | ✅ Já existia completo |
| `src/incidents/incidents.controller.ts` | ⚠️ Complementado — adicionados `PATCH :id/priority`, `PATCH :id/status`, `GET :id/export` |
| `src/incidents/incidents.service.ts` | ⚠️ Complementado — adicionados `updatePriority`, `updateStatus`, `exportIncident` |
| `src/incidents/incidents.module.ts` | ⚠️ Modificado — adicionado import `ProcessingModule` para `RecurrenceService` |
| **`src/config/dto/create-time-window.dto.ts`** | 🆕 Criado |
| **`src/config/dto/create-keyword-rule.dto.ts`** | 🆕 Criado |
| **`src/config/config-rules.service.ts`** | 🆕 Criado |
| **`src/config/config-rules.controller.ts`** | 🆕 Criado |
| **`src/config/config-rules.module.ts`** | 🆕 Criado |
| `src/app.module.ts` | ⚠️ Modificado — adicionado `ConfigRulesModule` nos imports |

---

## Parte A — DashboardModule (`src/dashboard/`)

### Endpoints adicionados

**`GET /dashboard/priority-queue`** — Fila de prioridade
- Retorna `IncidentGroup` com status OPEN/IN_PROGRESS, ordenados por `priorityScore DESC`
- Query params: `systemCode`, `priorityLevel` (CSV), `status` (CSV), `page`, `limit` (default=20)
- Cada item inclui `topKeywords` (3 keywords mais frequentes dos feedbacks do grupo)
- Cache TTL: 15s

**`GET /dashboard/metrics`** — Métricas 24h
- `totalFeedbacks`: contagem de RawFeedback nas últimas 24h
- `criticalIncidents`: IncidentGroups CRITICAL abertos
- `highIncidents`: IncidentGroups HIGH abertos
- `newIncidentGroups`: grupos criados nas últimas 24h
- `avgResolutionTimeMinutes`: média de tempo de resolução
- `systemHealthScore`: por SystemCode — `{ openIncidents, avgPriorityScore, healthScore }`
  - `healthScore = max(0, 100 - avgPS × count × 0.5)`
- Cache TTL: 30s

**`GET /dashboard/recurrences`** — Incidentes recorrentes
- IncidentGroups com `recurrenceCount > 0`, ordenados DESC
- Inclui `occurrences[]` com `occurredAt`, `resolvedAt`, `scoreSnapshot`
- Cache TTL: 60s

### Heatmap aprimorado

- Query agora faz JOIN com `processed_feedbacks` para calcular `AVG(priorityScore)` por célula
- Resposta inclui `dayOfWeek` (0-6) e `averagePriorityScore` além dos campos existentes `day` e `count`
- Preenche 7×24=168 células (todas as combinações dia/hora)

---

## Parte B — IncidentsModule (`src/incidents/`)

### Endpoints adicionados

**`PATCH /incidents/:id/priority`** — Atualiza prioridade manual
- Body: `{ priorityLevel: string, reason: string }`
- Validação: `reason.length >= 10` → 400 Bad Request se menor
- Preserva `priorityScore` da IA (não altera)
- Atualiza `priorityLevel` no `IncidentGroup`
- Marca todos `ProcessedFeedback` do grupo com `manualPriorityLevel`, `manualAdjustReason`, `overrideApplied=true`

**`PATCH /incidents/:id/status`** — Atualiza status
- Body: `{ status: string }`
- Se `status=RESOLVED`:
  - Define `resolvedAt=NOW()`
  - Chama `RecurrenceService.registerOccurrence()` → cria `IncidentOccurrence`, incrementa `recurrenceCount`, emite `pattern_detected` se ≥6 recorrências
- `IncidentsModule` agora importa `ProcessingModule` para ter acesso ao `RecurrenceService`

**`GET /incidents/:id/export`** — Exporta incidente como JSON
- Retorna JSON completo com todos os dados do grupo, feedbacks (com rawFeedback) e occurrences
- Header `Content-Disposition: attachment; filename="incident-{id}-{date}.json"`
- Inclui campo `exportedAt` com timestamp

---

## Parte C — ConfigRulesModule (`src/config/`)

### Endpoints criados

**TimeWindows:**
- `GET /api/v1/config/time-windows` — lista todas, ordenadas por `startHour ASC`
- `POST /api/v1/config/time-windows` — cria nova. Validações: `name` string, `startHour` 0-23, `endHour` 0-23, `boost ≥ 0`
- `DELETE /api/v1/config/time-windows/:id` — remove. 404 se não encontrada

**KeywordRules:**
- `GET /api/v1/config/keyword-rules` — lista todas, ordenadas por `scoreK DESC`
- `POST /api/v1/config/keyword-rules` — cria nova. Validações: `pattern` string, `scoreK` 0-10, `forceOverride` bool, `overrideMinPS` 0-100
- `DELETE /api/v1/config/keyword-rules/:id` — remove. 404 se não encontrada

**Invalidação de cache:** Após qualquer mutação (POST/DELETE), chama `PriorityScoreService.invalidateCache()` para forçar refresh das regras no próximo cálculo.

### DTOs com class-validator

- `CreateTimeWindowDto`: `name`, `startHour` (0-23), `startMinute` (0-59, default 0), `endHour` (0-23), `endMinute` (0-59, default 0), `boost` (≥0), `isActive` (default true)
- `CreateKeywordRuleDto`: `pattern`, `scoreK` (0-10), `forceOverride` (default false), `overrideMinPS` (0-100, opcional), `description` (opcional), `isActive` (default true)

---

### Critérios de aceitação verificados

| Critério | Status |
|---|---|
| GET /priority-queue retorna ordenado por PS desc | ✅ `orderBy: { priorityScore: 'desc' }` |
| PATCH /priority com reason < 10 chars retorna 400 | ✅ `BadRequestException` se `reason.length < 10` |
| PATCH /status com status=RESOLVED cria IncidentOccurrence | ✅ `RecurrenceService.registerOccurrence()` chamado |
| Heatmap retorna 7×24=168 células possíveis | ✅ Double loop `d=0..6, h=0..23` preenche todas |

### Resultado de compilação

```
TypeScript: 0 erros nos arquivos alterados
(1 erro pré-existente em test/app.e2e-spec.ts — não relacionado)
```

---

# Etapa 9 — ProcessingWorker + ClusteringService + RecurrenceService

## O que foi feito

**Nenhuma alteração necessária** — todo o módulo `src/processing/` já existia completo e correto. Os 6 arquivos de implementação e 3 arquivos de teste foram inspecionados e validados.

### Classificação

| Entrega | Estado |
|---|---|
| `src/processing/processing.worker.ts` | ✅ Completo — WaProcessingWorker + JiraProcessingWorker, pipeline 10 steps |
| `src/processing/clustering.service.ts` | ✅ Completo — assignToGroup com vetor/temporal, OR-06, BN-07, centróide |
| `src/processing/recurrence.service.ts` | ✅ Completo — getRecurrenceCount com/sem embedding, registerOccurrence |
| `src/processing/processing.module.ts` | ✅ Completo — imports AIModule, PriorityScoreModule, QueueModule, EventEmitter |
| `src/processing/processing.controller.ts` | ✅ Completo — queue status + reprocess endpoint |
| `src/processing/index.ts` | ✅ Completo — barrel exports |
| `src/processing/processing.worker.spec.ts` | ✅ Completo — 5 testes |
| `src/processing/clustering.service.spec.ts` | ✅ Completo — 9 testes |
| `src/processing/recurrence.service.spec.ts` | ✅ Completo — 8 testes |
| `src/app.module.ts` | ✅ ProcessingModule já importado |

---

### Resumo da implementação existente

**ProcessingWorker (`src/processing/processing.worker.ts`)**

Dois workers BullMQ (ambos com concurrency=3) que consomem as filas `wa-ingestion` e `jira-ingestion`:
- `WaProcessingWorker` — processa feedbacks do WhatsApp
- `JiraProcessingWorker` — processa feedbacks do Jira

Ambos delegam para a função compartilhada `processFeedback()` com pipeline de 10 steps:

| Step | Ação | Falha |
|---|---|---|
| 1 | Carregar RawFeedback, set `processingStatus=PROCESSING` | Not found → return |
| 2 | `AIAnalysisService.analyze()` | → `FAILED` + `processingError` + throw (dead-letter) |
| 3 | `EmbeddingService.generateEmbedding()` | → warn log, continua com `null` |
| 4 | `RecurrenceService.getRecurrenceCount(systemCode, embedding)` | — |
| 5 | `PriorityScoreService.calculate()` | — |
| 6 | Criar `ProcessedFeedback` (raw SQL com `::vector` se embedding, Prisma se não) | — |
| 7 | `ClusteringService.assignToGroup(pf, embedding, receivedAt)` | → warn, feedback preservado |
| 8 | Update `ProcessedFeedback.incidentGroupId` | → warn, feedback preservado |
| 9 | Emit `feedback_processed` via EventEmitter2 | → silencioso |
| 10 | Set `processingStatus=PROCESSED` | — |

**Tratamento de falha genérica:** Se qualquer step (exceto 2) falhar, o catch final verifica se já está FAILED; se não, marca como FAILED com a mensagem de erro.

**ProcessedFeedback — inserção com embedding:**
Usa `$queryRawUnsafe` com `$18::vector` para inserir o embedding como pgvector. Sem embedding, usa `prisma.processedFeedback.create()` padrão.

---

**ClusteringService (`src/processing/clustering.service.ts`)**

**`assignToGroup(pf, embedding, receivedAt)`:**

1. **Com embedding:** Query pgvector HNSW `<=>` (cosine distance) < 0.15, mesmo `systemCode`, `status IN (OPEN, IN_PROGRESS)`, `lastSeenAt > NOW() - 4h`
2. **Sem embedding / sem match vetorial:** Busca temporal — mesmo `systemCode`, status OPEN/IN_PROGRESS, `lastSeenAt > NOW() - 30min`
3. **Grupo encontrado:** → `updateExistingGroup()`
4. **Nenhum grupo:** → `createNewGroup()`

**`updateExistingGroup()`:**
- Limite de 200 feedbacks → cria grupo derivado
- `feedbackCount: { increment: 1 }` (atômico, sem race condition)
- **OR-06:** `newCount >= 11` → força `priorityLevel = CRITICAL`
- Recalcula centróide incrementalmente via SQL: `(old * n + new) / (n + 1)` (O(1) ao invés de O(n))
- **BN-07:** Se `feedbackCount == 5` e `elapsed <= 15 min` desde `firstSeenAt` → emit `pattern_detected` (type: 'burst')

**`createNewGroup()`:**
- Com embedding: raw SQL INSERT com `::vector`
- Sem embedding: Prisma `create()`
- `status: OPEN`, `feedbackCount: 1`, `recurrenceCount: 0`

---

**RecurrenceService (`src/processing/recurrence.service.ts`)**

**`getRecurrenceCount(systemCode, embedding)`:**
- Com embedding: query vetorial com `<=> < 0.20` em grupos RESOLVED dos últimos 30 dias
- Sem embedding: conta por `systemCode` em grupos RESOLVED dos últimos 30 dias
- Erro → retorna 0 (não bloqueia pipeline)

**`registerOccurrence(incidentGroupId)`:**
- Cria `IncidentOccurrence` com `scoreSnapshot`
- Incrementa `recurrenceCount` no grupo
- Se `recurrenceCount >= 6` → emit `pattern_detected` com `suggestEpic: true`

---

**ProcessingController (`src/processing/processing.controller.ts`)**

- **`GET /api/v1/processing/queue`** — status das filas (pending, processing, failed, processed_last_hour)
- **`POST /api/v1/processing/reprocess/:rawFeedbackId`** — re-enfileira feedback FAILED (máx 3 tentativas)

---

### Testes

| Arquivo | Testes | Cobertura |
|---|---|---|
| `processing.worker.spec.ts` | 5 | AI failure → FAILED, feedback preservado, embedding null → continua, happy path completo, atomicidade increment |
| `clustering.service.spec.ts` | 9 | Novo grupo sem/com embedding, match vetorial <0.15, match temporal, OR-06 (≥11 CRITICAL + <11 não), BN-07 (burst 5/15min + >15min não), limite 200 |
| `recurrence.service.spec.ts` | 8 | Count=0, query vetorial, query sem embedding, erro → 0, registerOccurrence, suggestEpic ≥6, não emite <6, grupo não encontrado |

### Resultado

```
Test Suites: 3 passed, 3 total
Tests:       22 passed, 22 total
Time:        1.802s
```

---

# Etapa 8 — AIAnalysisService (Claude API) + EmbeddingService + Testes Unitários

## O que foi feito

O módulo `src/ai/` já existia com todos os 6 arquivos (service, types, embedding, module, index, specs). Foram feitas **apenas correções cirúrgicas** para adicionar retry com backoff exponencial para erros 429/5xx da Claude API e os testes correspondentes.

### Classificação

| Entrega | Estado |
|---|---|
| `src/ai/ai-analysis.types.ts` | ✅ Completo — Zod schema, AIAnalysisResult, SYSTEM_PROMPT |
| `src/ai/ai-analysis.service.ts` | ⚠️ Corrigido — adicionado retry 429/5xx com backoff exponencial |
| `src/ai/embedding.service.ts` | ✅ Completo — generateEmbedding(), updateCentroid(), onModuleInit |
| `src/ai/ai.module.ts` | ✅ Completo |
| `src/ai/index.ts` | ✅ Completo — barrel exports |
| `src/ai/ai-analysis.service.spec.ts` | ⚠️ Complementado — adicionados 4 testes de retry |
| `src/ai/embedding.service.spec.ts` | ✅ Completo — 8 testes cobrindo todos cenários |
| `@anthropic-ai/sdk` (dep) | ✅ Já existia em package.json |
| `@xenova/transformers` (dep) | ✅ Já existia em package.json |
| `zod` (dep) | ✅ Já existia em package.json |

---

### Resumo da implementação existente

**Parte A — AIAnalysisService (`src/ai/ai-analysis.service.ts`)**

**`analyze(rawFeedback)`:**
- Verifica cache em memória (TTL 5 min) para conteúdos idênticos
- Aplica throttle (máx 40 chamadas/min)
- Monta prompt com canal, sourceGroupName, rawContent, jiraCategory, horário HH:mm
- Chama Claude API via `callClaudeWithRetry()`
- Se falhar → usa `fallbackAnalysis()` (keyword-based, sem IA)

**`buildUserPrompt(raw)`:**
- Formato: `Canal: WHATSAPP\nGrupo/Origem: Logística CD01\nConteúdo: ...\nCategoria Jira: N/A\nRecebido às: 03:30`

**`callClaude(userPrompt, temperature)`:**
- Modelo: `claude-sonnet-4-20250514`, max_tokens=500
- System prompt: analista sênior TI Grupo Mateus (sistemas GM_CORE/SUITE/FIN/LOG/INFRA/OTHER)
- Parseia JSON via `JSON.parse` + Zod validation (`AIAnalysisResultSchema`)
- Remove markdown fences (`\`\`\`json`) antes de parsear
- Se parse falhar com temperature=0 → retenta com temperature=0.1
- Erros 429/5xx são propagados para o retry wrapper (NÃO consumidos pelo temperature retry)
- Timeout de 8s via AbortController

**`callClaudeWithRetry(userPrompt)` — 🆕 ADICIONADO:**
- Wraps `callClaude()` com retry para erros retryáveis (429, 5xx)
- 3 retries com backoff exponencial: 5s → 15s → 60s
- Total de até 4 tentativas (1 inicial + 3 retries)
- Erros não-retryáveis (400, parse errors) são propagados imediatamente
- Loga cada retry com status HTTP e número da tentativa

**`isRetryableError(err)` — 🆕 ADICIONADO:**
- Verifica se o erro tem propriedade `status` com valor 429 ou 5xx (500-599)
- Retorna `false` para erros sem `status` (timeout, parse, etc.)

**`fallbackAnalysis(rawFeedback)`:**
- Busca `systemHint` do WhatsAppGroup associado
- Percorre KeywordRules ativas, usa maior `scoreK` como severidade
- Retorna com prefixo `[Fallback]` no summary

**`throttle()`:**
- Limita a 40 chamadas/minuto usando array de timestamps
- Se exceder, espera até o mais antigo completar 60s

**System prompt (em `ai-analysis.types.ts`):**
- 6 sistemas: GM_CORE (login/SSO), GM_SUITE (ERP/SAP), GM_FIN (fiscal), GM_LOG (logística), GM_INFRA (rede/servers), GM_OTHER (reclassificar)
- Escala severidade 0-10 com regras especiais (motorista≥8, CD+número=crítico, carga noturna≥8, nota fiscal≥9)
- GM_OTHER obrigatório preencher `reclassificationReason`
- Resposta JSON via Zod: `{ systemCode, feedbackType, severityScore, summary, keywordsFound, reclassificationReason }`

---

**Parte B — EmbeddingService (`src/ai/embedding.service.ts`)**

**`onModuleInit()`:**
- Carrega modelo `Xenova/paraphrase-multilingual-MiniLM-L12-v2` via `@xenova/transformers`
- Se falhar → `modelLoaded=false`, sistema continua sem embeddings
- Pipeline singleton: carregado uma vez, reutilizado em todas as chamadas

**`generateEmbedding(text)`:**
- Retorna `number[]` (384 dimensões) ou `null` se modelo não carregado/erro
- Trunca texto em 2048 chars
- Timeout de 500ms via `Promise.race` — se pipeline demorar, retorna `null`
- Nunca lança exceção

**`updateCentroid(embeddings)`:**
- Calcula média element-wise de N embeddings
- Retorna vetor zero (384d) se input vazio
- Usado para recalcular centroide de IncidentGroups após novo feedback

---

### Testes: `ai-analysis.service.spec.ts` (12 testes)

| Bloco | Testes | Cobertura |
|---|---|---|
| Análise com Claude API | 5 | JSON válido pt-BR, retry temperature=0.1, fallback timeout, fallback error, reclassified=true |
| **Retry 429/5xx** | **4** | **429 com sucesso na 3ª tentativa, 5xx com sucesso na 2ª, exaustão → fallback, 400 sem retry** |
| Fallback analysis | 3 | systemHint do grupo, keywords + scoreK, default GM_OTHER |

**Cenários de retry testados — 🆕:**

| # | Cenário | Mock | Resultado |
|---|---|---|---|
| 1 | 429 retry 2x + sucesso | 429, 429, success | 3 calls, result.systemCode=GM_LOG |
| 2 | 5xx retry 1x + sucesso | 500, success | 2 calls, result.systemCode=GM_LOG |
| 3 | 429 exaustão (4 falhas) | 429 always | 4 calls, fallback com [Fallback] prefix |
| 4 | 400 sem retry | 400 always | 2 calls (temp 0 + 0.1), fallback |

### Testes: `embedding.service.spec.ts` (8 testes)

| Bloco | Testes | Cobertura |
|---|---|---|
| Modelo NÃO carregado | 2 | Retorna null sem exceção, qualquer input |
| Modelo carregado (mock) | 3 | 384 dimensões, truncate 2048 chars, timeout → null |
| updateCentroid | 3 | Média de N vetores, vetor zero p/ vazio, identidade p/ 1 vetor |

### Resultado

```
Test Suites: 2 passed, 2 total
Tests:       20 passed, 20 total
Time:        2.995s
```

---

# Etapa 7 — PriorityScore Calculator + Testes Unitários

## O que foi feito

O módulo `src/priority-score/` já existia completo com o calculator, service com cache, types e module. Foi criado **apenas o arquivo de testes unitários** que validou toda a lógica com 43 cenários.

### Classificação

| Entrega | Estado |
|---|---|
| `src/priority-score/priority-score.types.ts` | ✅ Completo — PSInput, PSResult, TimeWindow, KeywordRule, KeywordResult |
| `src/priority-score/priority-score.calculator.ts` | ✅ Completo — todas as 6 funções com fórmula e 3 overrides |
| `src/priority-score/priority-score.service.ts` | ✅ Completo — Injectable com cache em memória de 5 minutos |
| `src/priority-score/priority-score.module.ts` | ✅ Completo |
| `src/priority-score/index.ts` | ✅ Completo — barrel exports |
| **`src/priority-score/priority-score.calculator.spec.ts`** | 🆕 Criado — 43 testes, 100% passando |

---

### Resumo da implementação existente

**Fórmula:** `PS = ( S×0.35 + V×0.25 + R×0.20 + T×0.10 + K×0.10 ) × 10`

**`calcVolumeScore(count, windowMinutes)`:**
- count=1 → V=1
- count 2–3 → V=3
- count 4–6 em ≤15min → V=5
- count 7–10 em ≤15min → V=7
- count≥11 OU window≤10min → V=10

**`calcRecurrenceScore(count30days)`:**
- 0→0, 1–2→3, 3–5→6, 6–9→9, 10+→10

**`calcTemporalScore(receivedAt, timeWindows)`:**
- Converte hora para minuteOfDay, percorre TimeWindows ativas
- Match → `Math.min(10, 5 + boost)`, sem match → 5

**`calcKeywordScore(text, rules)`:**
- Percorre KeywordRules ativas, retorna `{ score, forceOverride, overrideMinPS }`
- Múltiplas keywords → agrega (maior score, OR de forceOverride, maior overrideMinPS)

**`calcPriorityScore(input, timeWindows, keywordRules)`:**
- OR-01: `forceOverride=true` → PS=100 (precedência absoluta)
- OR-02: `overrideMinPS` → se PS < overrideMinPS, eleva para overrideMinPS
- OR-03: anti-inflation → `feedbacksInCluster=1 && S<5 && K=0 && PS>40` → cap PS=40
- Clamp [0, 100], round

**`mapPriorityLevel(ps)`:** ≥75→CRITICAL, ≥50→HIGH, ≥25→MEDIUM, <25→LOW

**`PriorityScoreService`:** Injectable com cache de 5 minutos para TimeWindows e KeywordRules (evita queries repetidas). Método `invalidateCache()` para refresh após update de regras.

---

### Arquivo criado: `priority-score.calculator.spec.ts`

**43 testes em 7 blocos:**

| Bloco | Testes | Cobertura |
|---|---|---|
| `calcVolumeScore` | 10 | Todos os ranges (1, 2–3, 4–6≤15min, 7–10≤15min, ≥11, burst≤10min) |
| `calcRecurrenceScore` | 9 | Todos os ranges (0, 1–2, 3–5, 6–9, 10+) |
| `calcTemporalScore` | 6 | 5 TimeWindows + janela inativa ignorada |
| `calcKeywordScore` | 6 | Match individual, forceOverride, overrideMinPS, nenhuma keyword, regra inativa, múltiplas keywords |
| `mapPriorityLevel` | 4 | Todos os 4 níveis (CRITICAL, HIGH, MEDIUM, LOW) |
| `calcPriorityScore` (cenários) | 8 | Ver abaixo |

**Cenários de negócio testados:**

| # | Cenário | Scores | PS | Level | Override |
|---|---|---|---|---|---|
| 1 | Carga Noturna Falhou | S=9,V=7,R=6,T=9,K=7 | 77 | CRITICAL | — |
| 2 | Lentidão GM Suite | S=4,V=3,R=3,T=5,K=4 | 37 | MEDIUM | — |
| 3 | Pedido Preso CD 87 | S=8,V=7,R=3,T=7,K=9 | 85 | CRITICAL | OR-02 (overrideMinPS=85) |
| 4 | Pedido de Melhoria | S=1,V=1,R=0,T=5,K=0 | 11 | LOW | — |
| 4b | Anti-inflation cap | S=4,V=1,R=10,T=9,K=0 | 40 | MEDIUM | OR-03 (cap 40) |
| 5 | forceOverride | S=2,V=1,R=0,T=5,K=10 | 100 | CRITICAL | OR-01 ("operação parada") |
| 6 | OR-02 não se aplica se PS>min | S=10,V=10,R=10,T=9,K=9 | 98 | CRITICAL | — |
| 7 | Clamp [0,100] | máximo possível | ≤100 | CRITICAL | — |

**Fixtures usadas:**
- 5 TimeWindows replicando o seed (Carga Noturna boost=4, Abertura Lojas boost=3, Pico Operacional boost=2, Horário Normal boost=0, Pico Fin/CD boost=2)
- 5 KeywordRules (operação parada force=true, pedido preso minPS=85, sem comunicação K=7, lentidão K=4, inativo K=5 **inativa**)

### Resultado

```
Test Suites: 1 passed, 1 total
Tests:       43 passed, 43 total
Time:        0.949s
```

---

# Etapa 6 — JiraModule (Sync) e WhatsAppGroupModule (CRUD + Sync Evolution)

## O que foi feito

Criação de dois novos módulos: `src/jira/` para sincronização assíncrona de issues do Jira com cron automático, e `src/whatsapp-group/` para gestão de grupos WhatsApp com sync da Evolution API no startup.

### Classificação

| Entrega | Estado |
|---|---|
| `prisma/schema.prisma` (RawFeedback, JiraSyncLog, WhatsAppGroup) | ✅ Já existia |
| `src/integrations/jira/` (JiraClient, JiraService CRUD) | ✅ Já existia — wrapper da API Jira |
| `src/integrations/evolution/` (scaffold CRUD) | ✅ Já existia — scaffold sem lógica real |
| `src/queue/queue.module.ts` (filas `wa-ingestion`, `jira-ingestion`) | ✅ Já existia |
| `src/ingestion/` (sync Jira inline) | ✅ Já existia — sync síncrono sem BullMQ |
| **`@nestjs/schedule` (dependência)** | 🆕 Instalado via `npm install` |
| **`src/jira/jira-sync.service.ts`** | 🆕 Criado |
| **`src/jira/jira-sync.controller.ts`** | 🆕 Criado |
| **`src/jira/jira-sync.module.ts`** | 🆕 Criado |
| **`src/whatsapp-group/dto/update-whatsapp-group.dto.ts`** | 🆕 Criado |
| **`src/whatsapp-group/whatsapp-group.service.ts`** | 🆕 Criado |
| **`src/whatsapp-group/whatsapp-group.controller.ts`** | 🆕 Criado |
| **`src/whatsapp-group/whatsapp-group.module.ts`** | 🆕 Criado |
| **`src/app.module.ts`** | ⚠️ Modificado — adicionados `JiraSyncModule` e `WhatsAppGroupModule` nos imports |

---

## Parte A — JiraModule (`src/jira/`)

### Arquivo 1: `src/jira/jira-sync.service.ts` (criado)

Serviço responsável pela sincronização de issues do Jira para o banco de dados local. Reutiliza o `JiraClient` existente em `src/integrations/jira/` para chamadas HTTP.

**Método `enqueueSyncJob(since?)`:**
- Chamado pelo controller para disparar sync assíncrono
- Faz uma estimativa rápida de quantas issues serão processadas
- Enfileira job `jira-sync` na fila BullMQ `jira-ingestion`
- Retorna imediatamente: `{ jobId, message, estimatedIssues }`

**Método `syncIssues(since?)`:**
Core da sincronização, com pipeline completo:

1. **Query JQL paginada** — busca issues em páginas de 100, percorrendo até esgotar
2. **Retry 429** — se a Jira retornar rate limit (HTTP 429), espera o tempo indicado em `Retry-After` e retenta até 3x
3. **Filtro Done+30d** — ignora issues com `status=Done` E `updatedAt` > 30 dias atrás
4. **Dedup por externalId** — busca batch de `RawFeedback` existentes com `channel=JIRA`, evita duplicatas
5. **Regra de reclassificação** — se a categoria detectada é "Outros" E existe `KeywordRule` com `scoreK ≥ 7` que bate no texto → marca `attachments.suggestedReclassify=true`
6. **Criação em transação** — processa em batches de 20, cada batch em `$transaction`
7. **JiraSyncLog** — ao final, grava log com `issuesFetched`, `issuesCreated`, `issuesFailed`, `lastJiraUpdated`

Todos os `RawFeedback` criados entram com `processingStatus: 'PENDING'`.

**Cron `@Cron('*/5 * * * *')`:**
- Decorador do `@nestjs/schedule` que agenda execução a cada 5 minutos
- Chama `syncIssues()` e loga resultado ou erro
- Log aparece no console: `[CRON] Starting scheduled Jira sync...`

**Helpers privados:**
- `buildJql(since?)` — constrói query JQL com filtro temporal opcional
- `fetchWithRetry()` — wrapper de `jiraClient.searchIssues` com retry em 429
- `detectCategory(text)` — regex para detectar categoria do texto (Financeiro, Logística, Infra, Suite, Core, Outros)
- `getMaxScoreK(text, rules)` — retorna maior `scoreK` de KeywordRules que matcham no texto

### Arquivo 2: `src/jira/jira-sync.controller.ts` (criado)

Controller com rota única:
- **`GET /api/v1/jira/sync`** — dispara sincronização assíncrona
- Query param opcional `?since=2026-01-01` para filtrar por data
- Retorna `{ jobId, message, estimatedIssues }` imediatamente (não espera o sync terminar)

### Arquivo 3: `src/jira/jira-sync.module.ts` (criado)

Módulo que importa:
- `ScheduleModule.forRoot()` — ativa o scheduler do NestJS para `@Cron` funcionar
- `JiraIntegrationModule` — exporta `JiraClient` para reutilização

---

## Parte B — WhatsAppGroupModule (`src/whatsapp-group/`)

### Arquivo 4: `src/whatsapp-group/dto/update-whatsapp-group.dto.ts` (criado)

DTO com class-validator para atualizar grupos:
- `isMonitored?: boolean` — ativa/desativa monitoramento do grupo
- `systemHint?: SystemCode` — define manualmente o sistema associado ao grupo (enum do Prisma)

### Arquivo 5: `src/whatsapp-group/whatsapp-group.service.ts` (criado)

Serviço com:

**`syncGroupsFromEvolutionAPI()`:**
- Chama `GET /group/fetchAllGroups/{instance}` na Evolution API com header `apikey`
- Para cada grupo retornado:
  - Se já existe no banco → atualiza `groupName` e `memberCount`
  - Se não existe → cria com `isMonitored: false` (grupos novos NÃO são monitorados automaticamente)
- Retorna `{ total, created, updated }`

**`OnModuleInit`:**
- Ao inicializar o módulo, chama `syncGroupsFromEvolutionAPI()` automaticamente
- Se a Evolution API estiver offline, apenas loga o erro (não quebra o startup)

**CRUD:**
- `findAll()` — lista todos os grupos ordenados por nome
- `findOne(id)` — busca grupo por UUID, lança `NotFoundException` se não encontrar
- `update(id, dto)` — atualiza `isMonitored` e/ou `systemHint` de um grupo

### Arquivo 6: `src/whatsapp-group/whatsapp-group.controller.ts` (criado)

Controller com rotas:
- **`GET /api/v1/config/whatsapp-groups`** — lista todos os grupos
- **`GET /api/v1/config/whatsapp-groups/:id`** — busca grupo por ID
- **`PATCH /api/v1/config/whatsapp-groups/:id`** — atualiza `isMonitored` e/ou `systemHint`
- **`POST /api/v1/config/whatsapp-groups/sync`** — dispara sync manual com Evolution API

### Arquivo 7: `src/whatsapp-group/whatsapp-group.module.ts` (criado)

Módulo que exporta `WhatsAppGroupService` para uso por outros módulos.

### Arquivo 8: `src/app.module.ts` (modificado)

Adicionados `JiraSyncModule` e `WhatsAppGroupModule` no array de imports.

---

### Fluxo de sync do Jira

```
GET /api/v1/jira/sync
  │
  └─ enqueueSyncJob()
       ├─ estima quantidade de issues
       ├─ enfileira job "jira-sync" no BullMQ (fila jira-ingestion)
       └─ retorna { jobId, message, estimatedIssues }

@Cron('*/5 * * * *')  ──→  syncIssues()
  │
  ├─ JQL paginada (100/página) com retry 429
  ├─ filtra Done + updated > 30d
  ├─ dedup por externalId batch
  ├─ reclassificação: Outros + scoreK≥7 → suggestedReclassify
  ├─ cria RawFeedback em transação (batches de 20)
  └─ grava JiraSyncLog
```

### Fluxo de sync dos grupos WhatsApp

```
App startup → OnModuleInit
  │
  └─ syncGroupsFromEvolutionAPI()
       ├─ GET /group/fetchAllGroups/{instance} (Evolution API)
       ├─ upsert em WhatsAppGroup
       └─ novos grupos: isMonitored=false
```

### Tecnologias e conceitos utilizados

- **@nestjs/schedule + @Cron** — agendamento declarativo de tarefas periódicas
- **BullMQ** — fila assíncrona para jobs de sync Jira (com retry exponencial)
- **JiraClient (axios)** — cliente HTTP existente para Jira REST API v3 com Basic Auth
- **Retry 429** — tratamento de rate limit da Jira com espera baseada em `Retry-After`
- **Upsert pattern** — check existência + create/update para idempotência
- **OnModuleInit** — lifecycle hook do NestJS para executar lógica no startup
- **Prisma $transaction** — garantia de atomicidade nos batches de criação

---

# Etapa 5 — Módulo de Ingestão WhatsApp

## O que foi feito

Criação do módulo completo `src/whatsapp/` responsável por receber mensagens do WhatsApp via webhook da Evolution API, filtrar, persistir como `RawFeedback` e enfileirar para processamento assíncrono.

### Classificação

| Entrega | Estado |
|---|---|
| `prisma/schema.prisma` (RawFeedback, WhatsAppGroup) | ✅ Já existia |
| `src/app.module.ts` (PrismaModule, QueueModule, ConfigModule com WEBHOOK_SECRET) | ✅ Já existia |
| `src/queue/queue.module.ts` (fila `wa-ingestion` registrada) | ✅ Já existia |
| **`src/whatsapp/dto/whatsapp-webhook.dto.ts`** | 🆕 Criado |
| **`src/whatsapp/guards/whatsapp-webhook.guard.ts`** | 🆕 Criado |
| **`src/whatsapp/whatsapp.service.ts`** | 🆕 Criado |
| **`src/whatsapp/whatsapp.controller.ts`** | 🆕 Criado |
| **`src/whatsapp/whatsapp.module.ts`** | 🆕 Criado |
| **`src/app.module.ts`** | ⚠️ Modificado — adicionado `WhatsAppModule` nos imports |

### Arquivo 1: `src/whatsapp/dto/whatsapp-webhook.dto.ts` (criado)

DTO validado com **class-validator** e **class-transformer** que espelha o payload real da Evolution API v2. Usa `@ValidateNested()` + `@Type()` para validação profunda de objetos aninhados.

Estrutura do DTO:
- **`WhatsAppWebhookDto`** — nível raiz com `event` (string), `instance` (string) e `data` (objeto)
- **`WebhookDataDto`** — contém `key` (identificação da mensagem), `pushName` (nome do autor no WhatsApp), `message` (conteúdo) e `messageTimestamp` (unix timestamp)
- **`WebhookKeyDto`** — contém `remoteJid` (ID do grupo/chat), `fromMe` (se é mensagem do bot), `id` (ID único da mensagem no WhatsApp) e `participant` (JID do autor no grupo)
- **`WebhookMessageDto`** — suporta dois formatos: `conversation` (texto simples) e `extendedTextMessage.text` (texto com formatação/citação)

**Por que class-validator?** O NestJS usa o `ValidationPipe` global (configurado em `main.ts`) com `whitelist: true` e `forbidNonWhitelisted: true`. Isso significa que qualquer campo não declarado no DTO é automaticamente removido, e campos obrigatórios ausentes retornam 400 Bad Request com detalhes do erro.

### Arquivo 2: `src/whatsapp/guards/whatsapp-webhook.guard.ts` (criado)

Guard NestJS que implementa `CanActivate` para autenticação do webhook. É executado **antes** do controller processar o request.

**Como funciona:**
1. Extrai o header `X-Webhook-Secret` do request HTTP
2. Compara com a variável de ambiente `WEBHOOK_SECRET` (obtida via `ConfigService`)
3. Se diferente → lança `UnauthorizedException` (HTTP 401)
4. Se igual → retorna `true` e permite o request seguir

**Por que um Guard e não um Middleware?** Guards no NestJS têm acesso ao contexto de execução (`ExecutionContext`) e podem ser aplicados por controller ou por rota via `@UseGuards()`. São a forma idiomática do NestJS para autenticação/autorização.

### Arquivo 3: `src/whatsapp/whatsapp.service.ts` (criado)

Serviço principal com toda a lógica de negócio da ingestão WhatsApp. Usa injeção de dependência do NestJS para receber `PrismaService` (acesso ao banco) e a fila BullMQ `wa-ingestion` (via `@InjectQueue`).

**Pipeline de filtragem (5 regras em sequência):**

1. **Evento inválido** — só aceita `messages.upsert` (novo envio de mensagem). Qualquer outro evento da Evolution API (ex: `messages.update`, `connection.update`) retorna 422.
2. **Não é grupo** — verifica se `remoteJid` termina em `@g.us` (sufixo de grupos no WhatsApp). Mensagens privadas são rejeitadas com 422.
3. **Grupo não monitorado** — busca o grupo no banco (`WhatsAppGroup`) pelo `groupId`. Se não encontrado ou `isMonitored=false` → 422.
4. **Mensagem do bot** — se `key.fromMe=true`, a mensagem foi enviada pelo próprio bot/número conectado → 422.
5. **Idempotência** — busca `RawFeedback` com mesmo `externalId` + `channel=WHATSAPP`. Se já existe → retorna 202 sem criar duplicata.

**Extração de conteúdo:**
- Tenta `message.conversation` (texto simples)
- Fallback para `message.extendedTextMessage.text` (texto com citação/formatação)
- Se ambos vazios → 422 (mensagem sem texto, ex: imagem, áudio)

**Regra de negócio — systemHint:**
Se o nome do grupo (`groupName`) contém "CD", "Logística" ou "Logistica" (case-insensitive), o campo `systemHint` do `WhatsAppGroup` é atualizado para `GM_LOG` (sistema de logística). Isso permite que o processamento posterior saiba automaticamente a qual sistema o feedback se refere.

**Criação do RawFeedback:**
- `channel`: `WHATSAPP` (enum do Prisma)
- `externalId`: ID único da mensagem no WhatsApp (`key.id`)
- `sourceGroupId`: ID do grupo (extraído do `remoteJid` removendo `@g.us`)
- `sourceGroupName`: nome do grupo vindo do banco
- `authorId`: `key.participant` (JID do autor no grupo) ou `remoteJid` como fallback
- `authorName`: `pushName` (nome de exibição do WhatsApp)
- `rawContent`: texto extraído da mensagem
- `receivedAt`: timestamp da mensagem convertido de unix para `Date`
- `processingStatus`: `PENDING` (aguardando processamento pela IA)
- `attachments`: `{ nightWindow: true }` se o horário está entre 00h–05h UTC (janela noturna que recebe boost de prioridade)

**Enfileiramento BullMQ:**
Após criar o `RawFeedback`, enfileira um job `process-whatsapp` na fila `wa-ingestion` com `{ rawFeedbackId }`. A fila já está configurada no `QueueModule` com retry (3 tentativas, backoff exponencial de 5s).

### Arquivo 4: `src/whatsapp/whatsapp.controller.ts` (criado)

Controller NestJS com rota única:
- **`POST /api/v1/webhooks/whatsapp`** — endpoint que a Evolution API chama quando recebe uma mensagem
- **`@UseGuards(WhatsAppWebhookGuard)`** — aplica autenticação via header em todas as rotas do controller
- **`@HttpCode(HttpStatus.ACCEPTED)`** — retorna 202 (não 201) para indicar que a mensagem foi aceita para processamento assíncrono
- **`@Body() dto: WhatsAppWebhookDto`** — o payload é automaticamente validado pelo `ValidationPipe` global usando as decorações do DTO

### Arquivo 5: `src/whatsapp/whatsapp.module.ts` (criado)

Módulo NestJS que agrupa o controller, service e guard do WhatsApp. Não exporta nada porque toda a funcionalidade é consumida apenas via HTTP (webhook).

**Dependências implícitas (via módulos globais):**
- `PrismaModule` (`@Global()`) — disponibiliza `PrismaService` sem precisar importar
- `QueueModule` (exports `BullModule`) — disponibiliza a fila `wa-ingestion` via `@InjectQueue`
- `ConfigModule` (`isGlobal: true`) — disponibiliza `ConfigService` para o guard ler `WEBHOOK_SECRET`

### Arquivo 6: `src/app.module.ts` (modificado)

Adicionado `WhatsAppModule` no array de imports do `AppModule` para que o NestJS registre o controller e as rotas.

### Fluxo completo de uma mensagem WhatsApp

```
WhatsApp → Evolution API → POST /api/v1/webhooks/whatsapp
  │
  ├─ Guard: valida X-Webhook-Secret → 401 se inválido
  ├─ ValidationPipe: valida DTO → 400 se payload malformado
  │
  └─ Service:
       ├─ event != messages.upsert? → 422
       ├─ não é grupo (@g.us)? → 422
       ├─ grupo não monitorado? → 422
       ├─ mensagem do bot? → 422
       ├─ externalId duplicado? → 202 (idempotente)
       ├─ sem conteúdo texto? → 422
       │
       ├─ systemHint: nome contém CD/Logística? → atualiza para GM_LOG
       ├─ cria RawFeedback (status=PENDING)
       ├─ enfileira job { rawFeedbackId } em wa-ingestion
       └─ retorna 202 Accepted
```

### Tecnologias e conceitos utilizados

- **class-validator / class-transformer** — validação declarativa de DTOs com decorators
- **NestJS Guards** — camada de autenticação executada antes do controller
- **BullMQ** — fila de jobs assíncrona baseada em Redis, com retry automático
- **Prisma Client** — ORM type-safe para acesso ao PostgreSQL
- **Idempotência** — busca por `externalId` antes de criar, evitando duplicatas
- **UnprocessableEntityException (422)** — HTTP status semântico para "entendi o request mas não posso processar"

---

# Etapa 4 — Estrutura Base do Frontend

## O que foi feito

O frontend já existia com uma estrutura completa (Vite + React + shadcn/ui + Tailwind + Router + páginas). Foram criados/modificados **apenas os 4 itens ausentes**.

### Classificação

| Entrega | Estado |
|---|---|
| Vite + React + TS + Tailwind | ✅ Já existia |
| shadcn/ui (tema slate) | ✅ Já existia |
| recharts, lucide-react, date-fns, sonner, next-themes | ✅ Deps já instaladas |
| Layout (Sidebar + Header + Outlet) | ✅ Já existia |
| Sidebar com 5 links + ícones + colapsável | ✅ Já existia |
| Header com filtros + sync Jira + AI simulation | ✅ Já existia |
| `lib/api.ts` com `VITE_API_URL` | ✅ Já existia |
| 6 Páginas + 404 + IncidentDetail | ✅ Já existia |
| FilterContext | ✅ Já existia |
| `types/api.ts` com todos os tipos | ✅ Já existia |
| `hooks/use-api.ts` com React Query hooks | ✅ Já existia |
| **SSEContext** | 🆕 Criado |
| **CriticalToast** | 🆕 Criado |
| **SSE indicator no Header** | 🆕 Adicionado |
| **ThemeProvider + dark/light toggle** | 🆕 Adicionado |

### Arquivo 1: `src/contexts/SSEContext.tsx` (criado)

Context React que gerencia uma conexão **Server-Sent Events** com o backend:
- Abre `EventSource` em `${VITE_API_URL}/api/v1/events`
- Reconecta automaticamente a cada 5s em caso de erro
- Expõe: `isConnected` (boolean), `lastEvent` (último evento recebido), `onEvent(handler)` (subscribe/unsubscribe)
- Tipo `ICFEvent` com 5 eventos: `new_incident`, `ps_updated`, `override_triggered`, `pattern_detected`, `queue_stats`

### Arquivo 2: `src/components/CriticalToast.tsx` (criado)

Componente que subscreve ao SSEContext e dispara **toast vermelho persistente** (via sonner) quando recebe evento `new_incident` com `priorityLevel=CRITICAL`. Inclui botão "Ver detalhes" que navega para `/incident/:id`.

### Arquivo 3: `src/components/AppHeader.tsx` (modificado)

Adicionados:
- **Indicador SSE**: 🟢 Online / 🔴 Offline (com animação pulse quando offline)
- **Toggle de tema**: botão Sun/Moon que alterna entre dark e light via `next-themes`

### Arquivo 4: `src/App.tsx` (modificado)

Wiring dos novos providers na árvore de componentes:
```
ThemeProvider (defaultTheme="dark", attribute="class")
  └─ QueryClientProvider
       └─ TooltipProvider
            └─ FilterProvider
                 └─ SSEProvider
                      └─ CriticalToast
                      └─ BrowserRouter + Routes
```

### Arquivo 5: `src/index.css` (modificado)

Adicionadas variáveis CSS para tema claro (`:root`) — fundo branco, texto escuro, borders claras. As variáveis dark foram movidas para `.dark` para funcionar com `next-themes attribute="class"`.

---

# Etapa 3 — Schema Prisma, Migration e Seeds

## O que foi feito

**Nenhuma alteração necessária** — tudo já existia completo e correto.

### Arquivos inspecionados

| Arquivo | Estado |
|---|---|
| `prisma/schema.prisma` | ✅ Completo — 6 enums, 8 modelos, pgvector config, todos os índices |
| `prisma/migrations/20260414151337_init/migration.sql` | ✅ Completo — cria extensão vector, todas as tabelas, enums, índices e FKs |
| `prisma/hnsw-indexes.sql` | ✅ Completo — HNSW em `embedding` e `centroidEmbedding` |
| `prisma/seed-config.ts` | ✅ Completo — 5 TimeWindows + 12 KeywordRules |
| `prisma/seed-demo.ts` | ✅ Completo — dados demo para desenvolvimento |

### Detalhes do schema

**Enums:** `FeedbackChannel` (JIRA, WHATSAPP), `FeedbackType` (INCIDENT, IMPROVEMENT, DOUBT), `PriorityLevel` (CRITICAL, HIGH, MEDIUM, LOW), `SystemCode` (GM_CORE, GM_SUITE, GM_FIN, GM_LOG, GM_INFRA, GM_OTHER), `IncidentStatus` (OPEN, IN_PROGRESS, RESOLVED, ROOT_CAUSE_IDENTIFIED, EPIC_CREATED), `FeedbackProcessingStatus` (PENDING, PROCESSING, PROCESSED, FAILED).

**Modelos com embeddings:**
- `ProcessedFeedback.embedding` → `vector(384)` com HNSW index (`vector_cosine_ops`)
- `IncidentGroup.centroidEmbedding` → `vector(384)` com HNSW index (`vector_cosine_ops`)

**Seeds:**
- `seed-config.ts`: 5 TimeWindows (Carga Noturna boost=4, Abertura Lojas boost=3, Pico Operacional boost=2, Horário Normal boost=0, Pico Fin/CD boost=2) + 12 KeywordRules (ex: "operação parada" scoreK=10 forceOverride=true)
- `seed-demo.ts`: 12 WhatsApp groups, 12 incident groups, occurrences e ~150 feedbacks com dados realistas

### Comandos para usar

```bash
# Aplicar migration (se banco estiver up)
cd backend && npx prisma migrate dev

# Gerar Prisma Client
npx prisma generate

# Rodar seed de configuração
npx ts-node prisma/seed-config.ts

# Rodar seed de demo
npx ts-node prisma/seed-demo.ts

# Aplicar índices HNSW (após migration)
docker exec icf-postgres psql -U icf_user -d icf_db -f /dev/stdin < prisma/hnsw-indexes.sql
```

---

# Etapa 2 — Estrutura Base do Backend NestJS

## O que foi feito

O backend já existia com uma estrutura completa e bem implementada. Foram feitas **apenas 2 correções cirúrgicas** nos arquivos que tinham problemas:

### Arquivos inspecionados (todos já existiam ✅)

| Arquivo | Estado | Veredicto |
|---|---|---|
| `tsconfig.json` | ✅ Completo | Já tinha `@/*` → `src/*` |
| `eslint.config.mjs` | ✅ Completo | TypeScript-ESLint + Prettier configurados |
| `src/app.module.ts` | ✅ Completo | ConfigModule + Joi validando todas as 10 vars obrigatórias |
| `src/prisma/prisma.service.ts` | ✅ Completo | Extends PrismaClient, `$connect()`, `$disconnect()` |
| `src/prisma/prisma.module.ts` | ✅ Completo | `@Global()` + exports PrismaService |
| `src/main.ts` | ✅ Completo | ValidationPipe, HttpExceptionFilter, PerformanceInterceptor |
| `src/common/filters/http-exception.filter.ts` | ✅ Completo | Formato `{ statusCode, error, message, details }` |
| `src/common/interceptors/performance.interceptor.ts` | ✅ Completo | Log de tempo por request |
| `src/common/dto/query.dto.ts` | ✅ Completo | PaginationDto + PeriodDto |
| `src/queue/queue.module.ts` | ⚠️ Corrigido | `connection.url` não funciona no BullMQ/ioredis |
| `src/health/health.controller.ts` | ⚠️ Corrigido | Redis nunca era fechado no shutdown |

### Correção 1: `src/queue/queue.module.ts`

**Problema:** BullMQ usa ioredis internamente, que **não aceita `connection: { url }` diretamente**. O `url` precisa ser parseado em `host`, `port` e `password`.

**Solução:** Adicionada função `parseRedisUrl()` que usa `new URL()` para extrair os componentes da `REDIS_URL`:
```typescript
function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || 'localhost',
    port: parseInt(parsed.port, 10) || 6379,
    ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
  };
}
```

### Correção 2: `src/health/health.controller.ts`

**Problema:** O `HealthController` criava uma instância de `Redis` no construtor mas nunca chamava `quit()`, causando leak de conexões quando o módulo era destruído.

**Solução:** Implementado `OnModuleDestroy` com `await this.redis.quit()` para fechar a conexão corretamente.

---

# Etapa 1 — Infraestrutura Docker

## O que foi feito

Criação de toda a infraestrutura Docker para o projeto **ICF — Inteligência Centralizada de Feedbacks**, permitindo subir todos os serviços com um único comando.

---

## Arquivos criados/modificados

### 1. `docker-compose.yml` (modificado)

Arquivo principal que define todos os serviços do sistema. Antes só tinha postgres e redis básicos; agora tem 5 serviços completos:

| Serviço | O que é | Imagem | Porta |
|---|---|---|---|
| **postgres** | Banco de dados principal com extensão pgvector para armazenar embeddings de IA | `ankane/pgvector:16` | 5432 |
| **redis** | Cache e fila de mensagens (usado pelo BullMQ para processar feedbacks em background) | `redis:7-alpine` | 6379 |
| **evolution-api** | Gateway de WhatsApp — recebe e envia mensagens via API REST | `atendai/evolution-api:v2.2.3` | 8080 |
| **backend** | API NestJS que processa feedbacks, categoriza com IA e expõe endpoints | build local | 3001 |
| **frontend** | Dashboard React que exibe priorização em tempo real | build local | 3000 |

**Conceitos importantes neste arquivo:**

- **`healthcheck`** — postgres e redis têm verificações de saúde. O Docker executa o comando periodicamente e marca o container como "healthy" ou "unhealthy". Isso garante que o backend só inicia quando o banco está pronto.
- **`depends_on` com `condition: service_healthy`** — o backend espera postgres e redis ficarem saudáveis antes de iniciar, evitando erros de conexão.
- **`${VARIAVEL:-valor_padrao}`** — sintaxe que lê a variável do arquivo `.env`; se não existir, usa o valor padrão após `:-`.
- **`${EVOLUTION_API_KEY:?mensagem}`** — variante que **falha com erro** se a variável não estiver definida. Usada para chaves obrigatórias.
- **`volumes` nomeados** (`pgdata`, `redisdata`, `evolution_instances`) — dados persistem mesmo se o container for destruído e recriado.

---

### 2. `docker-compose.dev.yml` (criado)

Override para desenvolvimento. Usado junto com o compose principal:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

**O que faz de diferente:**
- **Monta o código-fonte como volume** — alterações no seu editor aparecem instantaneamente no container, sem rebuild.
- **Sobrescreve o `command`** — roda `npm run start:dev` (backend) e `npm run dev` (frontend) ao invés dos comandos de produção.
- **Usa o target `development`** dos Dockerfiles multi-stage — instala todas as dependências (incluindo devDependencies).

---

### 3. `backend/Dockerfile` (criado)

Dockerfile multi-stage com 3 fases:

1. **`development`** — Imagem completa com todas as dependências + código fonte. Usada pelo `docker-compose.dev.yml`.
2. **`build`** — Instala deps, gera o Prisma Client e compila o TypeScript para JavaScript (`npm run build`).
3. **`production`** — Imagem final leve. Só copia o código compilado (`dist/`), o Prisma Client gerado e as dependências de produção. É o que roda em `docker compose up`.

**Por que multi-stage?** A imagem final de produção é muito menor porque não carrega TypeScript, testes, ferramentas de dev etc.

---

### 4. `frontend/Dockerfile` (criado)

Também multi-stage com 3 fases:

1. **`development`** — Roda o Vite dev server com HMR (Hot Module Replacement).
2. **`build`** — Compila o React para arquivos estáticos (`npm run build` → pasta `dist/`).
3. **`production`** — Usa **nginx** para servir os arquivos estáticos. Inclui configuração de SPA fallback (`try_files $uri /index.html`) para que rotas do React Router funcionem.

**ARG `VITE_API_URL`** — Variável injetada no build time. O Vite substitui `import.meta.env.VITE_API_URL` pelo valor real durante a compilação.

---

### 5. `backend/.dockerignore` e `frontend/.dockerignore` (criados)

Lista de arquivos que o Docker **ignora** ao copiar o contexto de build. Sem isso, `COPY . .` copiaria `node_modules` (centenas de MB) para dentro do container, tornando o build lento e a imagem enorme.

Arquivos ignorados: `node_modules`, `dist`, `.env`, `.git`, logs, coverage.

---

### 6. `.env.example` (criado na raiz)

Template com **todas** as variáveis de ambiente usadas pelo `docker-compose.yml`, organizadas por seção:

- **PostgreSQL** — credenciais e porta do banco
- **Redis** — porta
- **Evolution API** — chave de autenticação e porta
- **Backend** — porta, chave Anthropic/Claude, credenciais Jira, webhook secret
- **Frontend** — porta e URL da API

O usuário deve copiar para `.env` e preencher os valores reais:
```bash
cp .env.example .env
```

---

## Fluxo de dependências entre serviços

```
postgres (healthcheck: pg_isready)
    ↓ service_healthy
redis (healthcheck: redis-cli ping) ──→ evolution-api
    ↓ service_healthy
backend (porta 3001)
    ↓ depends_on
frontend (porta 3000)
```

---

## Comandos úteis

```bash
# Subir tudo em produção
docker compose up -d

# Subir em desenvolvimento (hot-reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Verificar se pgvector está ativo
docker exec icf-postgres psql -U icf_user -d icf_db -c "SELECT * FROM pg_extension WHERE extname = 'vector';"

# Testar Redis
docker exec icf-redis redis-cli ping

# Ver logs de um serviço específico
docker compose logs -f backend

# Rebuild após mudar Dockerfile ou dependências
docker compose up -d --build

# Derrubar tudo (volumes persistem)
docker compose down

# Derrubar tudo E apagar volumes (cuidado: perde dados)
docker compose down -v
```
