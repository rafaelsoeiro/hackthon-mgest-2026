import { PrismaClient, FeedbackChannel, FeedbackType, PriorityLevel, SystemCode, IncidentStatus } from '@prisma/client';

const prisma = new PrismaClient();

function rand(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3600_000);
}
function calcPriority(ps: number): PriorityLevel {
  if (ps >= 75) return 'CRITICAL';
  if (ps >= 50) return 'HIGH';
  if (ps >= 25) return 'MEDIUM';
  return 'LOW';
}

async function main() {
  console.log('🗑️  Limpando tabelas...');
  await prisma.incidentOccurrence.deleteMany();
  await prisma.processedFeedback.deleteMany();
  await prisma.rawFeedback.deleteMany();
  await prisma.incidentGroup.deleteMany();
  await prisma.whatsAppGroup.deleteMany();
  await prisma.jiraSyncLog.deleteMany();

  // ─── WhatsApp Groups ────────────────────────────────
  console.log('📱 Criando WhatsApp groups...');
  const waGroups = [
    { groupId: 'wa-ti-slz', groupName: 'TI - Loja São Luís Centro', memberCount: 24, systemHint: SystemCode.GM_CORE },
    { groupId: 'wa-ti-imp', groupName: 'TI - Loja Imperatriz', memberCount: 18, systemHint: SystemCode.GM_CORE },
    { groupId: 'wa-cd-ma', groupName: 'CD Maranhão - Operações', memberCount: 32, systemHint: SystemCode.GM_LOG },
    { groupId: 'wa-cd-pa', groupName: 'CD Pará - Logística', memberCount: 28, systemHint: SystemCode.GM_LOG },
    { groupId: 'wa-fin-hq', groupName: 'Financeiro - Matriz', memberCount: 15, systemHint: SystemCode.GM_FIN },
    { groupId: 'wa-fin-lojas', groupName: 'Financeiro - Lojas', memberCount: 42, systemHint: SystemCode.GM_FIN },
    { groupId: 'wa-infra-rede', groupName: 'Infra - Rede e Conectividade', memberCount: 12, systemHint: SystemCode.GM_INFRA },
    { groupId: 'wa-infra-dc', groupName: 'Infra - Datacenter', memberCount: 8, systemHint: SystemCode.GM_INFRA },
    { groupId: 'wa-suite-erp', groupName: 'Suite ERP - Suporte', memberCount: 35, systemHint: SystemCode.GM_SUITE },
    { groupId: 'wa-ti-bel', groupName: 'TI - Loja Belém', memberCount: 20, systemHint: SystemCode.GM_CORE },
    { groupId: 'wa-ti-trs', groupName: 'TI - Loja Teresina', memberCount: 16, systemHint: SystemCode.GM_CORE },
    { groupId: 'wa-log-frota', groupName: 'Logística - Frota', memberCount: 22, systemHint: SystemCode.GM_LOG },
  ];
  await prisma.whatsAppGroup.createMany({ data: waGroups });
  console.log(`✔ ${waGroups.length} WhatsApp groups`);

  // ─── Incident Groups ────────────────────────────────
  console.log('🔥 Criando incident groups...');
  const incidentDefs = [
    { title: 'Faturamento travado em horário de pico', system: SystemCode.GM_FIN, ps: 92, status: IncidentStatus.OPEN, count: 18, recurrence: 5 },
    { title: 'CD Maranhão — WMS sem comunicação', system: SystemCode.GM_LOG, ps: 88, status: IncidentStatus.OPEN, count: 12, recurrence: 3 },
    { title: 'Login SSO falhando em todas as lojas', system: SystemCode.GM_CORE, ps: 82, status: IncidentStatus.IN_PROGRESS, count: 25, recurrence: 2 },
    { title: 'Nota fiscal não passa na SEFAZ', system: SystemCode.GM_FIN, ps: 68, status: IncidentStatus.OPEN, count: 9, recurrence: 4 },
    { title: 'Lentidão no ERP Módulo Estoque', system: SystemCode.GM_SUITE, ps: 55, status: IncidentStatus.OPEN, count: 7, recurrence: 2 },
    { title: 'Rede intermitente Loja Imperatriz', system: SystemCode.GM_INFRA, ps: 48, status: IncidentStatus.IN_PROGRESS, count: 6, recurrence: 1 },
    { title: 'Relatório gerencial não exporta', system: SystemCode.GM_SUITE, ps: 35, status: IncidentStatus.OPEN, count: 4, recurrence: 1 },
    { title: 'App mobile fecha ao abrir pedido', system: SystemCode.GM_CORE, ps: 42, status: IncidentStatus.OPEN, count: 5, recurrence: 2 },
    { title: 'Timeout na integração SAP', system: SystemCode.GM_SUITE, ps: 30, status: IncidentStatus.OPEN, count: 3, recurrence: 1 },
    { title: 'Falha recorrente no cálculo de frete', system: SystemCode.GM_LOG, ps: 72, status: IncidentStatus.ROOT_CAUSE_IDENTIFIED, count: 14, recurrence: 7, epic: 'GM-1234' },
    { title: 'Divergência de estoque entre sistemas', system: SystemCode.GM_LOG, ps: 65, status: IncidentStatus.EPIC_CREATED, count: 11, recurrence: 6, epic: 'GM-1567' },
    { title: 'Impressora fiscal desconfigura após reboot', system: SystemCode.GM_INFRA, ps: 58, status: IncidentStatus.ROOT_CAUSE_IDENTIFIED, count: 8, recurrence: 4, epic: 'GM-1890' },
  ];

  const createdGroups: { id: string; def: typeof incidentDefs[0] }[] = [];
  for (const def of incidentDefs) {
    const daysBack = Math.floor(Math.random() * 12) + 2;
    const ig = await prisma.incidentGroup.create({
      data: {
        title: def.title,
        systemCode: def.system,
        feedbackType: def.ps >= 50 ? FeedbackType.INCIDENT : FeedbackType.IMPROVEMENT,
        priorityScore: def.ps,
        priorityLevel: calcPriority(def.ps),
        status: def.status,
        feedbackCount: def.count,
        recurrenceCount: def.recurrence,
        firstSeenAt: hoursAgo(daysBack * 24),
        lastSeenAt: hoursAgo(Math.floor(Math.random() * 12)),
        rootCauseSummary: def.status !== 'OPEN' ? `Análise de causa raiz: ${def.title}` : null,
        epicJiraKey: (def as any).epic ?? null,
      },
    });
    createdGroups.push({ id: ig.id, def });
  }
  console.log(`✔ ${createdGroups.length} incident groups`);

  // ─── Incident Occurrences ───────────────────────────
  console.log('📊 Criando occurrences...');
  let occCount = 0;
  for (const { id, def } of createdGroups) {
    for (let i = 0; i < def.recurrence; i++) {
      await prisma.incidentOccurrence.create({
        data: {
          incidentGroupId: id,
          occurredAt: hoursAgo((def.recurrence - i) * 48 + Math.floor(Math.random() * 24)),
          resolvedAt: i < def.recurrence - 1 ? hoursAgo((def.recurrence - i) * 48 - 12) : null,
          scoreSnapshot: def.ps + rand(-5, 5),
        },
      });
      occCount++;
    }
  }
  console.log(`✔ ${occCount} occurrences`);

  // ─── Raw + Processed Feedbacks ──────────────────────
  console.log('💬 Criando feedbacks...');
  const feedbackTexts = [
    'Sistema parou de faturar, loja inteira parada',
    'Não consigo gerar nota fiscal desde ontem',
    'WMS travou, CD sem expedição',
    'Login não funciona em nenhuma máquina',
    'Erro 500 ao tentar fechar caixa',
    'Lentidão absurda no ERP, demora 2 min pra abrir tela',
    'Relatório de vendas vem zerado',
    'Impressora fiscal parou de funcionar',
    'App do vendedor fecha sozinho',
    'Integração com SAP dando timeout',
    'Estoque mostra quantidade errada',
    'Caminhão parado no CD esperando liberação do sistema',
    'Não consigo acessar o painel gerencial',
    'Reset de senha não envia email',
    'Boleto gerado com valor errado',
    'Pedido duplicou no sistema',
    'Rede caiu na loja toda',
    'Motorista esperando há 3 horas por causa do sistema',
    'Rotina noturna de fechamento não rodou',
    'Cliente reclamando que o cupom não funciona',
    'Tela branca ao acessar dashboard',
    'Arquivo CSV exporta com dados corrompidos',
    'Carga noturna falhou, estoque desatualizado',
    'Operação parada, faturamento zerado',
    'NF não passa na SEFAZ, erro de certificado',
    'Push de promoção não chegou para clientes',
    'Consulta de preço retornando valor antigo',
    'Sistema de fila de atendimento travou',
    'Permissão negada para gerente acessar relatório',
    'QR Code de pagamento não gera',
  ];

  let fbCount = 0;
  for (const { id: groupId, def } of createdGroups) {
    const numFeedbacks = def.count;
    for (let i = 0; i < numFeedbacks; i++) {
      const channel = Math.random() > 0.4 ? FeedbackChannel.JIRA : FeedbackChannel.WHATSAPP;
      const receivedHoursAgo = Math.floor(Math.random() * 336); // up to 14 days
      const receivedAt = hoursAgo(receivedHoursAgo);
      const waGroup = channel === 'WHATSAPP' ? pick(waGroups) : null;

      const raw = await prisma.rawFeedback.create({
        data: {
          channel,
          externalId: channel === 'JIRA' ? `GM-${2000 + fbCount}` : null,
          sourceGroupId: waGroup?.groupId ?? null,
          sourceGroupName: waGroup?.groupName ?? 'Jira Service Desk',
          authorName: pick(['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Lima', 'Juliana Rocha', 'Roberto Alves']),
          rawContent: pick(feedbackTexts),
          receivedAt,
          processingStatus: 'PROCESSED',
        },
      });

      const scoreS = rand(3, 10);
      const scoreV = rand(2, 10);
      const scoreR = rand(1, 10);
      const scoreT = rand(1, 8);
      const scoreK = rand(1, 10);
      const priorityScore = Math.round(
        (scoreS * 0.35 + scoreV * 0.25 + scoreR * 0.20 + scoreT * 0.10 + scoreK * 0.10) * 10
      );
      const reclassified = Math.random() > 0.7;

      await prisma.processedFeedback.create({
        data: {
          rawFeedbackId: raw.id,
          systemCode: def.system,
          feedbackType: def.ps >= 50 ? FeedbackType.INCIDENT : FeedbackType.IMPROVEMENT,
          severityScore: scoreS,
          aiSummary: `Feedback classificado automaticamente: ${def.title}`,
          keywordsFound: pick(feedbackTexts).split(' ').slice(0, 3),
          reclassified,
          scoreS, scoreV, scoreR, scoreT, scoreK,
          priorityScore,
          priorityLevel: calcPriority(priorityScore),
          incidentGroupId: groupId,
          processedAt: new Date(receivedAt.getTime() + 30_000),
        },
      });
      fbCount++;
    }
  }
  console.log(`✔ ${fbCount} feedbacks (raw + processed)`);

  // ─── Sync Log ───────────────────────────────────────
  await prisma.jiraSyncLog.create({
    data: {
      syncedAt: new Date(),
      issuesFetched: fbCount,
      issuesCreated: fbCount,
      issuesFailed: 0,
    },
  });
  console.log('✔ JiraSyncLog registrado');

  // ─── 5 Cenários de Demonstração Específicos ─────────
  console.log('\n🎯 Criando 5 cenários de demonstração...');

  // Cenário 1: Carga Noturna Falhou
  const cenario1 = await prisma.incidentGroup.create({
    data: {
      title: 'Carga Noturna Falhou',
      systemCode: SystemCode.GM_CORE,
      feedbackType: FeedbackType.INCIDENT,
      priorityScore: 85,
      priorityLevel: PriorityLevel.CRITICAL,
      status: IncidentStatus.OPEN,
      feedbackCount: 5,
      recurrenceCount: 4,
      firstSeenAt: hoursAgo(336), // 14 days ago
      lastSeenAt: hoursAgo(2),
    },
  });
  // 5 feedbacks WHATSAPP
  for (let i = 0; i < 5; i++) {
    const receivedAt = hoursAgo(i * 24 + 2);
    const raw = await prisma.rawFeedback.create({
      data: {
        channel: FeedbackChannel.WHATSAPP,
        sourceGroupId: 'wa-ti-slz',
        sourceGroupName: 'TI - Loja São Luís Centro',
        authorName: pick(['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Lima']),
        rawContent: pick([
          'Carga noturna não rodou, estoque completamente desatualizado',
          'Batch de processamento noturno falhou novamente, lojas sem dados',
          'Sistema mostra estoque zerado por causa da carga que falhou',
          'Urgente: carga noturna não completou, operação comprometida',
          'Terceira vez esta semana que a carga noturna não roda',
        ]),
        receivedAt,
        processingStatus: 'PROCESSED',
      },
    });
    await prisma.processedFeedback.create({
      data: {
        rawFeedbackId: raw.id,
        systemCode: SystemCode.GM_CORE,
        feedbackType: FeedbackType.INCIDENT,
        severityScore: 9,
        aiSummary: 'Falha recorrente na carga noturna causando desatualização de estoque',
        keywordsFound: ['carga noturna', 'estoque', 'falhou'],
        reclassified: false,
        scoreS: 9, scoreV: 8, scoreR: 7, scoreT: 6, scoreK: 9,
        priorityScore: 85,
        priorityLevel: PriorityLevel.CRITICAL,
        overrideApplied: true,
        overrideReason: 'Impacto direto em operação de vendas',
        incidentGroupId: cenario1.id,
        processedAt: new Date(receivedAt.getTime() + 30_000),
      },
    });
  }
  // 4 IncidentOccurrence históricas
  for (let i = 0; i < 4; i++) {
    await prisma.incidentOccurrence.create({
      data: {
        incidentGroupId: cenario1.id,
        occurredAt: hoursAgo((4 - i) * 72),
        resolvedAt: i < 3 ? hoursAgo((4 - i) * 72 - 12) : null,
        scoreSnapshot: 85 + rand(-3, 3),
      },
    });
  }
  console.log('✔ Cenário 1: Carga Noturna Falhou');

  // Cenário 2: Pedido Preso em Doca CD 87
  const cenario2 = await prisma.incidentGroup.create({
    data: {
      title: 'Pedido Preso em Doca CD 87',
      systemCode: SystemCode.GM_LOG,
      feedbackType: FeedbackType.INCIDENT,
      priorityScore: 92,
      priorityLevel: PriorityLevel.CRITICAL,
      status: IncidentStatus.OPEN,
      feedbackCount: 9,
      recurrenceCount: 2,
      firstSeenAt: hoursAgo(168), // 7 days ago
      lastSeenAt: hoursAgo(1),
    },
  });
  // 8 feedbacks WHATSAPP + 1 JIRA
  const c2Texts = [
    'Pedido travado na doca 87, caminhão esperando há 4 horas',
    'CD não libera pedido, sistema de WMS parou',
    'Motorista na doca 87 sem previsão de liberação',
    'Operação logística parada, doca 87 bloqueada',
    'WMS não processa saída na doca 87',
    'Gerente CD reporta doca 87 inoperante',
    'Pedidos acumulando na doca 87 por falha no sistema',
    'Sistema logístico travado, impacto em 12 entregas',
  ];
  for (let i = 0; i < 9; i++) {
    const channel = i < 8 ? FeedbackChannel.WHATSAPP : FeedbackChannel.JIRA;
    const receivedAt = hoursAgo(i * 8 + 1);
    const raw = await prisma.rawFeedback.create({
      data: {
        channel,
        externalId: channel === 'JIRA' ? 'GM-3001' : null,
        sourceGroupId: channel === 'WHATSAPP' ? 'wa-cd-ma' : null,
        sourceGroupName: channel === 'WHATSAPP' ? 'CD Maranhão - Operações' : 'Jira Service Desk',
        authorName: pick(['Roberto Alves', 'Juliana Rocha', 'Carlos Lima', 'Maria Santos']),
        rawContent: i < 8 ? c2Texts[i] : 'Bloqueio na doca 87 do CD — ticket escalado',
        receivedAt,
        processingStatus: 'PROCESSED',
      },
    });
    await prisma.processedFeedback.create({
      data: {
        rawFeedbackId: raw.id,
        systemCode: SystemCode.GM_LOG,
        feedbackType: FeedbackType.INCIDENT,
        severityScore: 9.5,
        aiSummary: 'Pedido preso na doca 87 do CD por falha no WMS',
        keywordsFound: ['doca 87', 'pedido preso', 'WMS'],
        reclassified: false,
        scoreS: 9.5, scoreV: 9, scoreR: 6, scoreT: 8, scoreK: 9,
        priorityScore: 92,
        priorityLevel: PriorityLevel.CRITICAL,
        incidentGroupId: cenario2.id,
        processedAt: new Date(receivedAt.getTime() + 30_000),
      },
    });
  }
  console.log('✔ Cenário 2: Pedido Preso em Doca CD 87');

  // Cenário 3: Erro Tributação Faturamento
  const cenario3 = await prisma.incidentGroup.create({
    data: {
      title: 'Erro Tributação Faturamento',
      systemCode: SystemCode.GM_SUITE,
      feedbackType: FeedbackType.INCIDENT,
      priorityScore: 68,
      priorityLevel: PriorityLevel.HIGH,
      status: IncidentStatus.IN_PROGRESS,
      feedbackCount: 6,
      recurrenceCount: 3,
      firstSeenAt: hoursAgo(240),
      lastSeenAt: hoursAgo(4),
    },
  });
  for (let i = 0; i < 6; i++) {
    const receivedAt = hoursAgo(i * 40 + 4);
    const raw = await prisma.rawFeedback.create({
      data: {
        channel: FeedbackChannel.WHATSAPP,
        sourceGroupId: 'wa-fin-hq',
        sourceGroupName: 'Financeiro - Matriz',
        authorName: pick(['Ana Oliveira', 'João Silva', 'Pedro Costa']),
        rawContent: pick([
          'Tributação errada no faturamento, ICMS calculando errado',
          'Erro de NCM no módulo fiscal',
          'Nota saindo com alíquota errada',
          'Faturamento com erro tributário, precisa corrigir urgente',
          'Regime tributário não está sendo aplicado corretamente',
          'CFOP errado nas notas de saída',
        ]),
        receivedAt,
        processingStatus: 'PROCESSED',
      },
    });
    await prisma.processedFeedback.create({
      data: {
        rawFeedbackId: raw.id,
        systemCode: SystemCode.GM_SUITE,
        feedbackType: FeedbackType.INCIDENT,
        severityScore: 7,
        aiSummary: 'Erro de tributação no módulo de faturamento',
        keywordsFound: ['tributação', 'faturamento', 'ICMS'],
        originalCategory: 'Outros',
        reclassified: true,
        scoreS: 7, scoreV: 6, scoreR: 5, scoreT: 5, scoreK: 7,
        priorityScore: 68,
        priorityLevel: PriorityLevel.HIGH,
        incidentGroupId: cenario3.id,
        processedAt: new Date(receivedAt.getTime() + 30_000),
      },
    });
  }
  console.log('✔ Cenário 3: Erro Tributação Faturamento (reclassified)');

  // Cenário 4: Lentidão GM Suite
  const cenario4 = await prisma.incidentGroup.create({
    data: {
      title: 'Lentidão GM Suite',
      systemCode: SystemCode.GM_SUITE,
      feedbackType: FeedbackType.INCIDENT,
      priorityScore: 38,
      priorityLevel: PriorityLevel.MEDIUM,
      status: IncidentStatus.OPEN,
      feedbackCount: 2,
      recurrenceCount: 1,
      firstSeenAt: hoursAgo(48),
      lastSeenAt: hoursAgo(12),
    },
  });
  for (let i = 0; i < 2; i++) {
    const receivedAt = hoursAgo(i * 36 + 12);
    const raw = await prisma.rawFeedback.create({
      data: {
        channel: FeedbackChannel.WHATSAPP,
        sourceGroupId: 'wa-suite-erp',
        sourceGroupName: 'Suite ERP - Suporte',
        authorName: pick(['Juliana Rocha', 'Roberto Alves']),
        rawContent: pick([
          'GM Suite muito lento hoje, demora uns 3 minutos pra abrir cada tela',
          'Lentidão no ERP está prejudicando o atendimento ao cliente',
        ]),
        receivedAt,
        processingStatus: 'PROCESSED',
      },
    });
    await prisma.processedFeedback.create({
      data: {
        rawFeedbackId: raw.id,
        systemCode: SystemCode.GM_SUITE,
        feedbackType: FeedbackType.INCIDENT,
        severityScore: 4,
        aiSummary: 'Lentidão generalizada no GM Suite',
        keywordsFound: ['lentidão', 'GM Suite', 'lento'],
        reclassified: false,
        scoreS: 4, scoreV: 4, scoreR: 3, scoreT: 3, scoreK: 4,
        priorityScore: 38,
        priorityLevel: PriorityLevel.MEDIUM,
        incidentGroupId: cenario4.id,
        processedAt: new Date(receivedAt.getTime() + 30_000),
      },
    });
  }
  console.log('✔ Cenário 4: Lentidão GM Suite');

  // Cenário 5: Melhoria de Tela Financeiro
  const cenario5 = await prisma.incidentGroup.create({
    data: {
      title: 'Melhoria de Tela Financeiro',
      systemCode: SystemCode.GM_FIN,
      feedbackType: FeedbackType.IMPROVEMENT,
      priorityScore: 8,
      priorityLevel: PriorityLevel.LOW,
      status: IncidentStatus.OPEN,
      feedbackCount: 1,
      recurrenceCount: 0,
      firstSeenAt: hoursAgo(72),
      lastSeenAt: hoursAgo(72),
    },
  });
  {
    const receivedAt = hoursAgo(72);
    const raw = await prisma.rawFeedback.create({
      data: {
        channel: FeedbackChannel.WHATSAPP,
        sourceGroupId: 'wa-fin-lojas',
        sourceGroupName: 'Financeiro - Lojas',
        authorName: 'Ana Oliveira',
        rawContent: 'Seria bom se a tela de conciliação bancária tivesse filtro por data e banco, hoje só filtra por valor',
        receivedAt,
        processingStatus: 'PROCESSED',
      },
    });
    await prisma.processedFeedback.create({
      data: {
        rawFeedbackId: raw.id,
        systemCode: SystemCode.GM_FIN,
        feedbackType: FeedbackType.IMPROVEMENT,
        severityScore: 1,
        aiSummary: 'Sugestão de melhoria na tela de conciliação bancária — filtros adicionais',
        keywordsFound: ['melhoria', 'conciliação', 'filtro'],
        reclassified: false,
        scoreS: 1, scoreV: 1, scoreR: 0.5, scoreT: 0.5, scoreK: 1,
        priorityScore: 8,
        priorityLevel: PriorityLevel.LOW,
        incidentGroupId: cenario5.id,
        processedAt: new Date(receivedAt.getTime() + 30_000),
      },
    });
  }
  console.log('✔ Cenário 5: Melhoria de Tela Financeiro');

  // ─── TimeWindows + KeywordRules seed ────────────────
  console.log('\n⚙️ Criando configurações demo...');
  await prisma.timeWindow.deleteMany();
  await prisma.keywordRule.deleteMany();

  await prisma.timeWindow.createMany({
    data: [
      { name: 'Carga Noturna', startHour: 0, startMinute: 0, endHour: 5, endMinute: 0, boost: 15, isActive: true },
      { name: 'Abertura Lojas', startHour: 5, startMinute: 0, endHour: 8, endMinute: 0, boost: 10, isActive: true },
      { name: 'Horário de Pico', startHour: 11, startMinute: 0, endHour: 14, endMinute: 0, boost: 8, isActive: true },
    ],
  });
  console.log('✔ 3 TimeWindows');

  await prisma.keywordRule.createMany({
    data: [
      { pattern: 'parado|travado|bloqueado', scoreK: 9, forceOverride: true, overrideMinPS: 70, description: 'Operação completamente parada', isActive: true },
      { pattern: 'faturamento|nota fiscal|NF', scoreK: 8, forceOverride: false, description: 'Problemas fiscais / faturamento', isActive: true },
      { pattern: 'lentidão|lento|demora', scoreK: 4, forceOverride: false, description: 'Performance degradada', isActive: true },
      { pattern: 'melhoria|sugestão|seria bom', scoreK: 1, forceOverride: false, description: 'Feedbacks de melhoria', isActive: true },
    ],
  });
  console.log('✔ 4 KeywordRules');

  console.log('\n🎉 Seed demo concluído!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
