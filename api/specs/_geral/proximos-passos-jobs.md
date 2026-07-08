# Próximo passo — Wiring dos jobs BullMQ (geração de cobrança + régua de mensagens)

> Instruções para o próximo agente. Contexto: Sprint 3 (PAG, MSG, EMAIL) está concluída — todos os
> use cases de negócio existem e têm cobertura de teste via fakes, mas **nada roda de verdade ainda**
> fora do webhook HTTP. `src/infra/queue/` existe e está vazio.

## O que falta, em ordem de dependência

### 1. `AsaasGateway` (adapter HTTP real do Asaas) — bloqueia tudo o resto

`GerarCobrancaUseCase` (`src/application/cobranca/gerar-cobranca-use-case.ts`) depende da porta
`GatewayPagamento` (`src/domain/cobranca/gateway-pagamento.ts`, método `criarCobranca`), mas **não
existe nenhuma implementação real** — só o fake usado nos testes
(`tests/unit/fakes/fake-gateway-pagamento.ts`, confirme o nome exato antes de reusar). Sem isso, o
job de geração de cobrança não tem como criar cobrança real nenhuma.

- Criar `src/infra/gateways/asaas-gateway.ts`, implementando `GatewayPagamento`, HTTP direto via
  `fetch` (mesmo padrão de `EvolutionCanalMensagem` e `GmailNotificador` — sem SDK de terceiros)
  contra `env.ASAAS_BASE_URL` com `env.ASAAS_API_KEY`.
- Endpoint real do Asaas para criar cobrança: `POST /v3/payments` (sandbox:
  `https://sandbox.asaas.com/api/v3/payments`). Vai precisar de um `customerId` do Asaas — **decisão
  em aberto**: `Cliente` não tem campo pra guardar o id do cliente no Asaas hoje. Duas opções, decidir
  com o usuário antes de implementar:
  1. Criar o customer no Asaas on-the-fly a cada cobrança gerada (chamando `POST /v3/customers`
     primeiro, ou buscando por `cpfCnpj` se já existir) — mais simples, sem migration.
  2. Adicionar campo `asaasCustomerId` opcional em `Cliente`/schema Prisma, preenchido na primeira
     cobrança e reaproveitado depois — evita recriar customer toda vez, mas exige migration (ver
     seção 6.5 do `CLAUDE.md` da raiz pro padrão de migration manual não-interativa).
- TDD: escrever teste de unidade pro parsing da resposta antes de codar (mock de `fetch`, não bater
  na sandbox real nos testes automatizados — mesmo princípio já usado no projeto: testes usam fakes,
  não a rede).
- Regra do projeto (CLAUDE.md raiz, seção 5): abstrair atrás da porta já existente, não inventar
  abstração nova.

### 2. Ajustar `GerarCobrancaUseCase` para expor as cobranças criadas

`executar()` hoje não retorna nada (`Promise<void>`). O job precisa saber **quais `Cobranca` foram
criadas nesta execução** para disparar `DispararLembreteInicialUseCase` só pra elas (não pra todas as
cobranças pendentes do sistema). Mudar a assinatura pra `Promise<Cobranca[]>`, retornando as cobranças
efetivamente criadas e salvas no loop. Atualizar os testes unitários existentes
(`tests/unit/application/cobranca/gerar-cobranca-use-case.test.ts`) — hoje eles não afirmam o retorno,
só o estado do fake repository.

### 3. Job BullMQ — geração de cobrança + disparo de lembrete inicial

Local: `src/infra/queue/`. Seguir o padrão de nomenclatura do projeto (arquivo
`gerar-cobranca-job.ts` ou `queue.ts` + `worker.ts`, à escolha, mas documentar a decisão no CLAUDE.md
seção 5 se for um padrão novo).

- BullMQ precisa de uma `Queue` + um `Worker` (ou `QueueScheduler` conforme a versão instalada —
  checar `package.json`, já está em `^5.34.0`) conectados ao Redis via `env.REDIS_HOST`/
  `REDIS_PORT`/`REDIS_PASSWORD`.
- Repeatable job (cron diário) que chama, na sequência:
  1. `GerarCobrancaUseCase.executar(new Date())` → recebe as `Cobranca[]` criadas
  2. Para cada uma, `DispararLembreteInicialUseCase.executar(cobranca)` (já existe e é testável,
     precisa só ser instanciado com os adapters reais: `PrismaClienteRepository`,
     `PrismaMensagemEnviadaRepository`, `EvolutionCanalMensagem`, `GmailNotificador` — mesmo padrão
     de instanciação já usado em `src/infra/http/routes/webhook-asaas.ts`, copiar dali)
- Isolar falha por cliente/cobrança igual já é feito dentro dos próprios use cases (eles não lançam
  em caso de falha de envio) — o job não precisa de try/catch por item, só um try/catch geral pra
  logar erro inesperado sem matar o worker.

### 4. Job BullMQ — régua de atraso

Mesmo `src/infra/queue/`, repeatable job cron diário separado, chamando
`DispararReguaAtrasoUseCase.executar(new Date())` com os mesmos adapters reais.

### 5. Registrar os workers na inicialização

`src/infra/http/server.ts` hoje só sobe o Fastify. Decidir com o usuário: workers no mesmo processo
do servidor HTTP (mais simples, adequado pro tamanho atual do projeto) ou processo separado
(`src/infra/queue/worker.ts` como entrypoint próprio, rodado por um `npm run worker` novo em
`package.json`). Dado que o projeto é MVP single-tenant de baixo volume (ver seção 9 do CLAUDE.md
raiz, "Single-tenant"), o mesmo processo tende a ser suficiente — mas perguntar antes de decidir,
é uma escolha de arquitetura visível em produção.

## Depois disso — checklist de sempre

- `npm test`, `npm run lint`, `npx tsc -p tsconfig.test.json --noEmit`, `npx prisma migrate status`
  (só necessário se a decisão do passo 1 exigir migration)
- Atualizar `api/specs/cobrancas/tasks.md` (COB-03, hoje só a porta existe) e
  `api/specs/mensagens/tasks.md` ("Não feito ainda", job BullMQ e wiring do lembrete inicial)
- Atualizar `CLAUDE.md` da raiz: seção 4.4 (tabela de Jobs Assíncronos, tirar "não implementado"),
  seção 5 se surgir um padrão novo de Job, seção 10 (nova entrada na linha do tempo) — **não editar
  entradas antigas da linha do tempo, só adicionar uma nova no topo**

## Fora de escopo deste próximo passo

- Dashboard (Sprint 4) — só depois dos jobs estarem rodando de verdade
- Credenciais reais do Gmail/Asaas em produção — ficam vazias em `.env` até o usuário configurar
  as contas reais (Google Cloud Console pro Gmail, conta sandbox→produção do Asaas)
