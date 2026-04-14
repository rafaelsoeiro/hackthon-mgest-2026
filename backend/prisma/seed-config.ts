import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ─── TimeWindows ──────────────────────────────────────
  const timeWindows = [
    { name: 'Carga Noturna', startHour: 0, endHour: 5, boost: 4 },
    { name: 'Abertura Lojas', startHour: 5, endHour: 8, boost: 3 },
    { name: 'Pico Operacional', startHour: 8, endHour: 10, boost: 2 },
    { name: 'Horário Normal', startHour: 10, endHour: 17, boost: 0 },
    { name: 'Pico Fin/CD', startHour: 17, endHour: 20, boost: 2 },
  ];

  await prisma.timeWindow.deleteMany();
  const twResult = await prisma.timeWindow.createMany({ data: timeWindows });
  console.log(`✔ ${twResult.count} TimeWindows inseridos`);

  // ─── KeywordRules ─────────────────────────────────────
  const keywordRules = [
    { pattern: 'operação parada', scoreK: 10, forceOverride: true },
    { pattern: 'parou de faturar', scoreK: 10, forceOverride: true },
    { pattern: 'cd travado', scoreK: 10, forceOverride: true },
    { pattern: 'motorista', scoreK: 8, overrideMinPS: 85 },
    { pattern: 'caminhão', scoreK: 8, overrideMinPS: 85 },
    { pattern: 'nota fiscal', scoreK: 9, overrideMinPS: 85 },
    { pattern: 'nf não passa', scoreK: 9, overrideMinPS: 85 },
    { pattern: 'carga noturna', scoreK: 7 },
    { pattern: 'rotina caiu', scoreK: 7 },
    { pattern: 'lentidão', scoreK: 4 },
    { pattern: 'lento', scoreK: 4 },
    { pattern: 'preso', scoreK: 6 },
  ];

  await prisma.keywordRule.deleteMany();
  const krResult = await prisma.keywordRule.createMany({ data: keywordRules });
  console.log(`✔ ${krResult.count} KeywordRules inseridos`);
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
