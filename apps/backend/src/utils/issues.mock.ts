import { JiraClient } from '../integrations/jira/jira.client';

type MockIssue = {
  summary: string;
  description?: string;
};

export const mockIssues: MockIssue[] = [
  {
    summary: 'nao consigo entrar',
    description:
      'na rede da empresa, trava o navegador, só comigo por enquanto e cliente ficou esperando. to tentando resolver aqui me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'pedido travado',
    description:
      'apos a ultima atualizacao, nao gera arquivo. ja tentei em outra conta e pessoal do financeiro cobrou.',
  },
  {
    summary: 'tela branca no painel',
    description:
      'quando troco de aba, volta pro inicio sem aviso. ontem funcionava e bloqueou o atendimento.',
  },
  {
    summary: 'cobranca duplicada',
    description:
      'desde ontem a noite, aparece um erro e some, só comigo por enquanto e o gerente pediu urgencia. to tentando resolver aqui',
  },
  {
    summary: 'botao salvar nao funciona',
    description:
      'apos a ultima atualizacao, nao deixa clicar. ja tentei em outra conta e preciso disso hoje.',
  },
  {
    summary: 'erro 500 intermitente',
    description:
      'em pedidos grandes, volta pro inicio sem aviso. agora parou e perdi o pedido. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'relatorio nao abre',
    description:
      'em duas maquinas diferentes, gera arquivo quebrado, ja limpei cache e ta impactando vendas. to tentando resolver aqui',
  },
  {
    summary: 'csv bagunçado',
    description:
      'quando troco de aba, da timeout. ja limpei cache e bloqueou o atendimento.',
  },
  {
    summary: 'dados sumiram',
    description:
      'desde ontem a noite, nao gera arquivo. ja testei em outro navegador e nao consigo fechar o mes.',
  },
  {
    summary: 'email nao chega',
    description:
      'em pedidos grandes, trava o navegador, ontem funcionava e perdi o pedido. to tentando resolver aqui',
  },
  {
    summary: 'reset de senha falha',
    description:
      'quando troco de aba, mostra dados antigos. ontem funcionava e tive que refazer tudo. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'app lento',
    description:
      'no horario de pico, gera arquivo quebrado. agora parou e bloqueou o atendimento.',
  },
  {
    summary: 'upload falha',
    description:
      'fora da rede, nao mostra nenhuma mensagem, ontem funcionava e perdi o pedido. to tentando resolver aqui',
  },
  {
    summary: 'status nao atualiza',
    description:
      'quando troco de aba, volta pro inicio sem aviso. agora parou e bloqueou o atendimento.',
  },
  {
    summary: 'push nao chega',
    description:
      'com varios itens, nao gera arquivo. só comigo por enquanto e pessoal do financeiro cobrou.',
  },
  {
    summary: 'busca incompleta',
    description:
      'em pedidos pequenos, gera arquivo quebrado, nao sei se mudou algo e pessoal do financeiro cobrou. to tentando resolver aqui me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'checkout com erro',
    description:
      'no safari, nao deixa clicar. ja testei em outro navegador e bloqueou o atendimento.',
  },
  {
    summary: 'fila travada',
    description:
      'apos a ultima atualizacao, gera arquivo quebrado. ja tentei 3 vezes e preciso disso hoje.',
  },
  {
    summary: 'impressao fecha',
    description:
      'com varios itens, nao atualiza a tela, funciona e para e o time todo ficou parado. to tentando resolver aqui',
  },
  {
    summary: 'permissao negada',
    description:
      'no safari, aparece um erro e some. ja tentei em outra conta e preciso disso hoje.',
  },
  {
    summary: 'servico caiu',
    description:
      'em pedidos grandes, fica tudo em branco. acontece com mais gente e tive que refazer tudo. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'estoque nao baixa',
    description:
      'com varios itens, da 403, ja limpei cache e perdi o pedido. to tentando resolver aqui',
  },
  {
    summary: 'timeout integracao',
    description:
      'quando volto uma tela, gera arquivo quebrado. acontece com mais gente e pessoal do financeiro cobrou.',
  },
  {
    summary: 'tela congela',
    description:
      'fora da rede, aparece 502. agora parou e o time todo ficou parado.',
  },
  {
    summary: 'confirmar nao responde',
    description:
      'apos a ultima atualizacao, aparece um erro e some, ja tentei 3 vezes e o time todo ficou parado. to tentando resolver aqui',
  },
  {
    summary: 'pedido nao aparece',
    description:
      'apos a ultima atualizacao, volta pro inicio sem aviso. funciona e para e nao consigo fechar o mes. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'status errado',
    description:
      'quando troco de aba, aparece 500. ja tentei 3 vezes e o gerente pediu urgencia.',
  },
  {
    summary: 'campo some',
    description:
      'fora da rede, fica carregando e nao termina, nao sei se mudou algo e pessoal do financeiro cobrou. to tentando resolver aqui',
  },
  {
    summary: 'filtro bugado',
    description:
      'no celular, nao mostra nenhuma mensagem. nao sei se mudou algo e cliente ficou esperando.',
  },
  {
    summary: 'app fechou',
    description:
      'no desktop, mostra dados antigos. ja testei em outro navegador e bloqueou o atendimento.',
  },
  {
    summary: 'arquivo corrompido',
    description:
      'quando uso dados moveis, da timeout, nao sei se mudou algo e perdi o pedido. to tentando resolver aqui me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'nao salva',
    description:
      'no celular, aparece 500. só comigo por enquanto e preciso disso hoje.',
  },
  {
    summary: 'carregamento infinito',
    description:
      'no chrome, trava o navegador. só comigo por enquanto e preciso disso hoje.',
  },
  {
    summary: 'erro desconhecido',
    description:
      'no chrome, da 403, acontece com mais gente e o gerente pediu urgencia. to tentando resolver aqui',
  },
  {
    summary: 'erro 502',
    description:
      'em duas maquinas diferentes, trava o navegador. ja tentei em outra conta e tive que refazer tudo.',
  },
  {
    summary: 'carrinho sumiu',
    description:
      'quando o cliente liga, nao deixa clicar. comeca e depois falha e bloqueou o atendimento. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'boleto nao gera',
    description:
      'hoje cedo, aparece 502, agora parou e tive que refazer tudo. to tentando resolver aqui',
  },
  {
    summary: 'link em branco',
    description:
      'no chrome, mostra dados antigos. ja limpei cache e tive que refazer tudo.',
  },
  {
    summary: 'lento de manha',
    description:
      'em pedidos grandes, nao gera arquivo. acontece com mais gente e ta impactando vendas.',
  },
  {
    summary: 'tela preta',
    description:
      'quando troco de aba, nao atualiza a tela, ja testei em outro navegador e preciso disso hoje. to tentando resolver aqui',
  },
  {
    summary: 'dados antigos',
    description:
      'depois de ficar parado, volta pro inicio sem aviso. nao sei se mudou algo e preciso disso hoje. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'safari nao abre',
    description:
      'quando uso dados moveis, da timeout. só comigo por enquanto e o gerente pediu urgencia.',
  },
  {
    summary: 'opcao imprimir sumiu',
    description:
      'no horario de pico, aparece 502, comeca e depois falha e o gerente pediu urgencia. to tentando resolver aqui',
  },
  {
    summary: 'falha ao enviar',
    description:
      'desde ontem a noite, some o botao. ja tentei em outra conta e bloqueou o atendimento.',
  },
  {
    summary: 'valor errado',
    description:
      'em pedidos pequenos, fica tudo em branco. ja tentei em outra conta e pessoal do financeiro cobrou.',
  },
  {
    summary: 'botao sumiu',
    description:
      'depois de ficar parado, volta pro inicio sem aviso, ja tentei em outra conta e cliente ficou esperando. to tentando resolver aqui me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'sem acesso',
    description:
      'quando troco de aba, trava o navegador. ontem funcionava e perdi o pedido.',
  },
  {
    summary: 'recarrega sozinho',
    description:
      'fora da rede, fica carregando e nao termina. ja tentei em outra conta e bloqueou o atendimento.',
  },
  {
    summary: 'pedido nao abre',
    description:
      'depois de ficar parado, da timeout, ja testei em outro navegador e nao consigo fechar o mes. to tentando resolver aqui',
  },
  {
    summary: 'busca lenta',
    description:
      'fora da rede, fecha sozinho. nao sei se mudou algo e perdi o pedido.',
  },
  {
    summary: 'sem resposta',
    description:
      'no horario de pico, aparece 502. nao sei se mudou algo e o time todo ficou parado. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'travou no envio',
    description:
      'com varios itens, mostra dados antigos, ja tentei em outra conta e tive que refazer tudo. to tentando resolver aqui',
  },
  {
    summary: 'duplicou pedido',
    description:
      'no horario de pico, nao atualiza a tela. funciona e para e nao consigo fechar o mes.',
  },
  {
    summary: 'consulta travada',
    description:
      'com varios itens, fica tudo em branco. ontem funcionava e cliente ficou esperando.',
  },
  {
    summary: 'dados inconsistentes',
    description:
      'no desktop, da token invalido, acontece com mais gente e tive que refazer tudo. to tentando resolver aqui',
  },
  {
    summary: 'qr code nao gera',
    description:
      'quando volto uma tela, fica carregando e nao termina. ontem funcionava e nao consigo fechar o mes. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'erro ao deletar',
    description:
      'apos a ultima atualizacao, da erro de rede. ontem funcionava e pessoal do financeiro cobrou.',
  },
  {
    summary: 'link expirado',
    description:
      'no celular, fecha sozinho, ja reiniciei o pc e preciso disso hoje. to tentando resolver aqui',
  },
  {
    summary: 'agendamento falhou',
    description:
      'quando volto uma tela, da token invalido. acontece com mais gente e bloqueou o atendimento.',
  },
  {
    summary: 'alerta atrasado',
    description:
      'depois de ficar parado, some o botao. ja reiniciei o pc e o gerente pediu urgencia.',
  },
  {
    summary: 'nao consigo entrar',
    description:
      'em duas maquinas diferentes, some o botao, ontem funcionava e o time todo ficou parado. to tentando resolver aqui me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'pedido travado',
    description:
      'fora da rede, fica carregando e nao termina. ja limpei cache e nao consigo fechar o mes.',
  },
  {
    summary: 'tela branca no painel',
    description:
      'com varios itens, da erro de rede. ja reiniciei o pc e ta impactando vendas.',
  },
  {
    summary: 'cobranca duplicada',
    description:
      'fora da rede, aparece 500, funciona e para e pessoal do financeiro cobrou. to tentando resolver aqui',
  },
  {
    summary: 'botao salvar nao funciona',
    description:
      'fora da rede, aparece um erro e some. ja reiniciei o pc e perdi o pedido.',
  },
  {
    summary: 'erro 500 intermitente',
    description:
      'em duas maquinas diferentes, aparece 502. ja reiniciei o pc e pessoal do financeiro cobrou. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'relatorio nao abre',
    description:
      'no desktop, aparece 502, agora parou e ta impactando vendas. to tentando resolver aqui',
  },
  {
    summary: 'csv bagunçado',
    description:
      'hoje cedo, aparece 502. comeca e depois falha e pessoal do financeiro cobrou.',
  },
  {
    summary: 'dados sumiram',
    description:
      'apos a ultima atualizacao, nao mostra nenhuma mensagem. só comigo por enquanto e bloqueou o atendimento.',
  },
  {
    summary: 'email nao chega',
    description:
      'com varios itens, fica tudo em branco, só comigo por enquanto e pessoal do financeiro cobrou. to tentando resolver aqui',
  },
  {
    summary: 'reset de senha falha',
    description:
      'apos a ultima atualizacao, da timeout. nao sei se mudou algo e o gerente pediu urgencia. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'app lento',
    description:
      'apos a ultima atualizacao, fica tudo em branco. ja testei em outro navegador e tive que refazer tudo.',
  },
  {
    summary: 'upload falha',
    description:
      'hoje cedo, trava o navegador, agora parou e o time todo ficou parado. to tentando resolver aqui',
  },
  {
    summary: 'status nao atualiza',
    description:
      'quando o cliente liga, aparece 502. comeca e depois falha e pessoal do financeiro cobrou.',
  },
  {
    summary: 'push nao chega',
    description:
      'quando o cliente liga, nao gera arquivo. ontem funcionava e tive que refazer tudo.',
  },
  {
    summary: 'busca incompleta',
    description:
      'hoje cedo, fica carregando e nao termina, funciona e para e perdi o pedido. to tentando resolver aqui me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'checkout com erro',
    description:
      'com apenas 1 item, trava o navegador. só comigo por enquanto e bloqueou o atendimento.',
  },
  {
    summary: 'fila travada',
    description:
      'no desktop, fica carregando e nao termina. ja tentei 3 vezes e bloqueou o atendimento.',
  },
  {
    summary: 'impressao fecha',
    description:
      'no safari, da token invalido, ja reiniciei o pc e ta impactando vendas. to tentando resolver aqui',
  },
  {
    summary: 'permissao negada',
    description:
      'na rede da empresa, da erro de rede. ontem funcionava e o gerente pediu urgencia.',
  },
  {
    summary: 'servico caiu',
    description:
      'quando o cliente liga, volta pro inicio sem aviso. funciona e para e pessoal do financeiro cobrou. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'estoque nao baixa',
    description:
      'em pedidos pequenos, gera arquivo quebrado, ontem funcionava e o gerente pediu urgencia. to tentando resolver aqui',
  },
  {
    summary: 'timeout integracao',
    description:
      'com apenas 1 item, trava o navegador. ontem funcionava e tive que refazer tudo.',
  },
  {
    summary: 'tela congela',
    description:
      'com apenas 1 item, da token invalido. ja limpei cache e o time todo ficou parado.',
  },
  {
    summary: 'confirmar nao responde',
    description:
      'no celular, fica carregando e nao termina, ja testei em outro navegador e tive que refazer tudo. to tentando resolver aqui',
  },
  {
    summary: 'pedido nao aparece',
    description:
      'quando o cliente liga, aparece 502. agora parou e perdi o pedido. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'status errado',
    description:
      'quando volto uma tela, volta pro inicio sem aviso. acontece com mais gente e preciso disso hoje.',
  },
  {
    summary: 'campo some',
    description:
      'com apenas 1 item, nao gera arquivo, nao sei se mudou algo e perdi o pedido. to tentando resolver aqui',
  },
  {
    summary: 'filtro bugado',
    description:
      'quando volto uma tela, volta pro inicio sem aviso. ja reiniciei o pc e bloqueou o atendimento.',
  },
  {
    summary: 'app fechou',
    description:
      'no chrome, volta pro inicio sem aviso. ja tentei em outra conta e preciso disso hoje.',
  },
  {
    summary: 'arquivo corrompido',
    description:
      'em pedidos pequenos, nao gera arquivo, ja limpei cache e perdi o pedido. to tentando resolver aqui me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'nao salva',
    description:
      'em pedidos pequenos, nao atualiza a tela. agora parou e preciso disso hoje.',
  },
  {
    summary: 'carregamento infinito',
    description:
      'depois de ficar parado, da token invalido. ja reiniciei o pc e nao consigo fechar o mes.',
  },
  {
    summary: 'erro desconhecido',
    description:
      'em pedidos pequenos, da token invalido, ontem funcionava e o time todo ficou parado. to tentando resolver aqui',
  },
  {
    summary: 'erro 502',
    description:
      'com apenas 1 item, nao deixa clicar. funciona e para e preciso disso hoje.',
  },
  {
    summary: 'carrinho sumiu',
    description:
      'no chrome, nao gera arquivo. ja reiniciei o pc e o time todo ficou parado. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'boleto nao gera',
    description:
      'quando o cliente liga, da 403, ja tentei em outra conta e o gerente pediu urgencia. to tentando resolver aqui',
  },
  {
    summary: 'link em branco',
    description:
      'em pedidos pequenos, nao atualiza a tela. ja tentei em outra conta e bloqueou o atendimento.',
  },
  {
    summary: 'lento de manha',
    description:
      'em pedidos grandes, aparece um erro e some. ja reiniciei o pc e nao consigo fechar o mes.',
  },
  {
    summary: 'tela preta',
    description:
      'no horario de pico, trava o navegador, funciona e para e pessoal do financeiro cobrou. to tentando resolver aqui',
  },
  {
    summary: 'dados antigos',
    description:
      'quando o cliente liga, da erro de rede. ja testei em outro navegador e o time todo ficou parado. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'safari nao abre',
    description:
      'em duas maquinas diferentes, nao mostra nenhuma mensagem. só comigo por enquanto e o time todo ficou parado.',
  },
  {
    summary: 'opcao imprimir sumiu',
    description:
      'no celular, nao deixa clicar, ja testei em outro navegador e o gerente pediu urgencia. to tentando resolver aqui',
  },
  {
    summary: 'falha ao enviar',
    description:
      'com apenas 1 item, da timeout. acontece com mais gente e o gerente pediu urgencia.',
  },
  {
    summary: 'valor errado',
    description:
      'no desktop, fecha sozinho. acontece com mais gente e perdi o pedido.',
  },
  {
    summary: 'botao sumiu',
    description:
      'fora da rede, fica carregando e nao termina, acontece com mais gente e preciso disso hoje. to tentando resolver aqui me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'sem acesso',
    description:
      'em pedidos pequenos, aparece 500. funciona e para e cliente ficou esperando.',
  },
  {
    summary: 'recarrega sozinho',
    description:
      'quando uso dados moveis, nao atualiza a tela. ontem funcionava e ta impactando vendas.',
  },
  {
    summary: 'pedido nao abre',
    description:
      'no safari, da token invalido, ja tentei em outra conta e perdi o pedido. to tentando resolver aqui',
  },
  {
    summary: 'busca lenta',
    description:
      'em duas maquinas diferentes, nao mostra nenhuma mensagem. ja tentei em outra conta e nao consigo fechar o mes.',
  },
  {
    summary: 'sem resposta',
    description:
      'no chrome, volta pro inicio sem aviso. ja testei em outro navegador e nao consigo fechar o mes. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'travou no envio',
    description:
      'quando o cliente liga, da 403, comeca e depois falha e nao consigo fechar o mes. to tentando resolver aqui',
  },
  {
    summary: 'duplicou pedido',
    description:
      'quando uso dados moveis, trava o navegador. ontem funcionava e preciso disso hoje.',
  },
  {
    summary: 'consulta travada',
    description:
      'quando troco de aba, aparece 502. funciona e para e pessoal do financeiro cobrou.',
  },
  {
    summary: 'dados inconsistentes',
    description:
      'apos a ultima atualizacao, da erro de rede, ja limpei cache e tive que refazer tudo. to tentando resolver aqui',
  },
  {
    summary: 'qr code nao gera',
    description:
      'em pedidos grandes, aparece um erro e some. ja tentei 3 vezes e cliente ficou esperando. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'erro ao deletar',
    description:
      'apos a ultima atualizacao, da erro de rede. ja tentei em outra conta e ta impactando vendas.',
  },
  {
    summary: 'link expirado',
    description:
      'em duas maquinas diferentes, aparece um erro e some, ja tentei 3 vezes e perdi o pedido. to tentando resolver aqui',
  },
  {
    summary: 'agendamento falhou',
    description:
      'em pedidos pequenos, fica carregando e nao termina. acontece com mais gente e preciso disso hoje.',
  },
  {
    summary: 'alerta atrasado',
    description:
      'em pedidos grandes, da erro de rede. agora parou e tive que refazer tudo.',
  },
  {
    summary: 'nao consigo entrar',
    description:
      'desde ontem a noite, da token invalido, funciona e para e bloqueou o atendimento. to tentando resolver aqui me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'pedido travado',
    description:
      'no horario de pico, fica tudo em branco. ja tentei 3 vezes e cliente ficou esperando.',
  },
  {
    summary: 'tela branca no painel',
    description:
      'no celular, some o botao. ja tentei 3 vezes e nao consigo fechar o mes.',
  },
  {
    summary: 'cobranca duplicada',
    description:
      'com apenas 1 item, some o botao, ja tentei 3 vezes e o time todo ficou parado. to tentando resolver aqui',
  },
  {
    summary: 'botao salvar nao funciona',
    description:
      'com apenas 1 item, fica tudo em branco. ja tentei 3 vezes e pessoal do financeiro cobrou.',
  },
  {
    summary: 'erro 500 intermitente',
    description:
      'hoje cedo, da erro de rede. ja limpei cache e cliente ficou esperando. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'relatorio nao abre',
    description:
      'hoje cedo, da token invalido, ontem funcionava e bloqueou o atendimento. to tentando resolver aqui',
  },
  {
    summary: 'csv bagunçado',
    description:
      'com apenas 1 item, aparece 502. ja reiniciei o pc e o time todo ficou parado.',
  },
  {
    summary: 'dados sumiram',
    description:
      'no horario de pico, da 403. comeca e depois falha e o time todo ficou parado.',
  },
  {
    summary: 'email nao chega',
    description:
      'quando volto uma tela, da timeout, ontem funcionava e nao consigo fechar o mes. to tentando resolver aqui',
  },
  {
    summary: 'reset de senha falha',
    description:
      'no desktop, nao deixa clicar. acontece com mais gente e bloqueou o atendimento. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'app lento',
    description:
      'quando o cliente liga, da timeout. acontece com mais gente e cliente ficou esperando.',
  },
  {
    summary: 'upload falha',
    description:
      'quando o cliente liga, fica carregando e nao termina, ja tentei em outra conta e nao consigo fechar o mes. to tentando resolver aqui',
  },
  {
    summary: 'status nao atualiza',
    description:
      'em pedidos grandes, fica tudo em branco. ja limpei cache e perdi o pedido.',
  },
  {
    summary: 'push nao chega',
    description:
      'quando uso dados moveis, da token invalido. comeca e depois falha e nao consigo fechar o mes.',
  },
  {
    summary: 'busca incompleta',
    description:
      'depois de ficar parado, nao deixa clicar, funciona e para e nao consigo fechar o mes. to tentando resolver aqui me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'checkout com erro',
    description:
      'desde ontem a noite, aparece 500. ja testei em outro navegador e tive que refazer tudo.',
  },
  {
    summary: 'fila travada',
    description:
      'no chrome, aparece 500. ja limpei cache e nao consigo fechar o mes.',
  },
  {
    summary: 'impressao fecha',
    description:
      'fora da rede, nao atualiza a tela, ontem funcionava e pessoal do financeiro cobrou. to tentando resolver aqui',
  },
  {
    summary: 'permissao negada',
    description:
      'em duas maquinas diferentes, volta pro inicio sem aviso. ja tentei 3 vezes e bloqueou o atendimento.',
  },
  {
    summary: 'servico caiu',
    description:
      'fora da rede, fica tudo em branco. ja limpei cache e pessoal do financeiro cobrou. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'estoque nao baixa',
    description:
      'quando uso dados moveis, aparece um erro e some, nao sei se mudou algo e nao consigo fechar o mes. to tentando resolver aqui',
  },
  {
    summary: 'timeout integracao',
    description:
      'com apenas 1 item, some o botao. ja reiniciei o pc e preciso disso hoje.',
  },
  {
    summary: 'tela congela',
    description:
      'hoje cedo, aparece um erro e some. ja tentei 3 vezes e perdi o pedido.',
  },
  {
    summary: 'confirmar nao responde',
    description:
      'quando o cliente liga, da timeout, agora parou e cliente ficou esperando. to tentando resolver aqui',
  },
  {
    summary: 'pedido nao aparece',
    description:
      'quando uso dados moveis, fica carregando e nao termina. ja tentei 3 vezes e nao consigo fechar o mes. me ajuda pq nao sei o que fazer',
  },
  {
    summary: 'status errado',
    description:
      'em duas maquinas diferentes, aparece um erro e some. agora parou e preciso disso hoje.',
  },
  {
    summary: 'campo some',
    description:
      'quando o cliente liga, da timeout, acontece com mais gente e o time todo ficou parado. to tentando resolver aqui',
  },
  {
    summary: 'filtro bugado',
    description:
      'quando o cliente liga, mostra dados antigos. funciona e para e ta impactando vendas.',
  },
  {
    summary: 'app fechou',
    description:
      'quando o cliente liga, volta pro inicio sem aviso. funciona e para e preciso disso hoje.',
  },
];

export async function seedMockIssues(
  jiraClient: JiraClient,
  projectKey: string,
) {
  return jiraClient.createIssuesBulk(projectKey, mockIssues);
}
