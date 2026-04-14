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

  console.log('\n🎉 Seed demo concluído!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
