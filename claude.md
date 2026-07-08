# CLAUDE.md — Guia Técnico do Projeto CobraCerta

> **Documento vivo.** Atualizar sempre que surgir novo padrão, obstáculo resolvido ou mudança de arquitetura.
> O agente de IA lê este arquivo integralmente antes de cada interação — mantenha-o preciso e completo.

---

## 1. Visão Geral da Arquitetura

**Objetivo do projeto:**
Sistema de cobrança automática (nome provisório: CobraCerta) para prestadores de serviço com clientes recorrentes (advogados, clínicas, dentistas, B2B com mensalidade). Elimina o trabalho manual de gerar cobrança, lembrar cliente via WhatsApp e controlar quem está em dia ou inadimplente.

**Diagrama resumido (MVP v1):**
```
[Cadastro de Cliente] → [Job cron gera Cobrança] → [Asaas (boleto/PIX)] → [Evolution API (WhatsApp)]
                                                            |
                                                    [Webhook de pagamento]
                                                            |
                                                   [Dashboard (Next.js)]
```

---

## 2. Stack Tecnológico

| Camada | Tecnologia | Observações |
|--------|-----------|-------------|
| Linguagem/runtime | TypeScript + Node.js (LTS) | tipagem estática em todo backend |
| Backend HTTP | Fastify | performance + ecossistema de plugins |
| Banco de dados | PostgreSQL + Prisma | schema declarativo, migrations, client tipado |
| Fila/agendamento | BullMQ + Redis | geração de cobrança e disparo de lembretes, com retry |
| Validação | Zod | env vars e entrada de use cases |
| Testes | Vitest + @vitest/coverage-v8 | TDD, cobertura focada em `domain/` e `application/` |
| Containerização | Docker / Docker Compose | Postgres + Redis em dev |
| Gateway de pagamento | Asaas | boleto + PIX, via HTTP direto (fetch), sandbox primeiro |
| WhatsApp | Evolution API | envio de lembretes/confirmações |
| E-mail | Gmail API (`googleapis`, OAuth2) | canal complementar (módulo `notificacoes-email`) |
| Observabilidade | Pino | logger estruturado integrado ao Fastify |
| Frontend dashboard | Next.js | interface simples, sem necessidade de design elaborado no v1 |
| Dev tooling | tsx (watch), ESLint | — |

Detalhes completos de convenções técnicas: `api/specs/_geral/rules.md`.

---

## 3. Configuração e Ambiente

### 3.1 Variáveis de Ambiente

Ver `api/.env.example` (fonte da verdade, sempre atualizado junto com `src/shared/config/env.ts`).

```bash
NODE_ENV=
PORT=

DATABASE_URL=

REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

ASAAS_API_KEY=
ASAAS_BASE_URL=
ASAAS_WEBHOOK_TOKEN=

EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=

COBRANCA_ANTECEDENCIA_DIAS=
```

> ⚠️ **Nunca** commitar valores reais. `.env` e `.env.test` estão no `.gitignore` da pasta `api/`.

### 3.2 Estrutura de Diretórios

```
sistema-cobranca/
├── claude.md                 # ← Este arquivo (memória viva do projeto)
├── README.md
├── api/
│   ├── src/
│   │   ├── domain/            # regras de negócio puras (cliente/, cobranca/, shared/)
│   │   ├── application/       # casos de uso (cliente/, cobranca/)
│   │   ├── infra/
│   │   │   ├── database/      # Prisma client, repositórios
│   │   │   ├── gateways/      # integrações externas (Asaas, Evolution)
│   │   │   ├── http/          # servidor Fastify (app.ts, server.ts), routes/, plugins/
│   │   │   └── queue/         # jobs BullMQ
│   │   └── shared/
│   │       ├── config/        # env.ts (validação Zod)
│   │       └── errors/        # DomainError base
│   ├── tests/
│   │   ├── unit/               # domínio e application, sem banco real
│   │   └── integration/        # tocam banco/gateway real ou fastify.inject
│   ├── prisma/schema.prisma
│   ├── docker-compose.yml      # Postgres 16 + Redis 7
│   ├── .env.example / .env.test
│   ├── package.json / tsconfig.json / tsconfig.test.json / vitest.config.ts / eslint.config.js
│   ├── mvp-v1/, mvp-v2/, mvp-v3/  # specs de escopo por versão do MVP
│   └── specs/                   # specs por módulo: clientes, cobrancas, mensagens,
│                                 # notificacoes-email, pagamentos, dashboard (spec.md/rules.md/tasks.md)
```

> **Regra:** Ao criar novos arquivos, respeitar esta estrutura DDD. Domínio nunca depende de framework/ORM — dependência sempre aponta pra dentro (infra → domínio).

---

## 4. Definições Técnicas

### 4.1 Models Principais (Prisma — `api/prisma/schema.prisma`)

| Model | Tabela | Responsabilidade |
|-------|--------|-----------------|
| `Cliente` | `clientes` | Nome, documento (CPF/CNPJ, obrigatório), e-mail, endereço opcional, inscrição estadual opcional, nome de contato opcional, referência de serviço opcional, valor de cobrança, dia de vencimento, status (ATIVO/INATIVO) |
| `TelefoneCliente` | `telefones_cliente` | Telefone (E.164) de um cliente, 1:N — pelo menos 1 obrigatório, exatamente 1 marcado `principal` (MVP v1.2) |
| `Cobranca` | `cobrancas` | Cobrança gerada para um cliente: valor, vencimento, status (PENDENTE/PAGO/ATRASADO/CANCELADO), dados do gateway |
| `MensagemEnviada` | `mensagens_enviadas` | Registro de mensagem enviada por cobrança (LEMBRETE/VENCIMENTO/ATRASO/CONFIRMACAO) |

### 4.2 Services / Use Cases

| Use Case | Localização | Responsabilidade |
|---|---|---|
| `CriarClienteUseCase` | `src/application/cliente/criar-cliente-use-case.ts` | CAD-01 — valida e persiste novo cliente (status inicial ATIVO) |
| `InativarClienteUseCase` | `src/application/cliente/inativar-cliente-use-case.ts` | CAD-03 — inativa cliente existente (mantém histórico) |
| `EditarClienteUseCase` | `src/application/cliente/editar-cliente-use-case.ts` | CAD-04 — edita dados de cliente existente reaplicando invariantes |
| `GerarCobrancaUseCase` | `src/application/cobranca/gerar-cobranca-use-case.ts` | COB-01 — para cada cliente ativo, calcula vencimento do ciclo, checa duplicidade (COB-R-04), cria cobrança no `GatewayPagamento` e persiste como `PENDENTE` (COB-R-02, COB-R-03, COB-R-05) |
| `ConfirmarPagamentoUseCase` | `src/application/cobranca/confirmar-pagamento-use-case.ts` | PAG-01 — busca cobrança por `gatewayChargeId`, ignora sem erro se já `PAGO`/`CANCELADO` (PAG-R-04, idempotência), senão chama `Cobranca.marcarComoPaga` e, se `CONFIRMACAO_PAGAMENTO_HABILITADA`, dispara `NotificadorConfirmacao` (PAG-R-05) |

Demais módulos (`mensagens`, `notificacoes-email`, `dashboard`): ver `api/specs/<módulo>/tasks.md` para a lista rastreável por ID. Ainda não iniciados.

### 4.3 Rotas HTTP

| Rota | Método | Responsabilidade |
|---|---|---|
| `/health` | GET | Healthcheck simples |
| `/webhooks/asaas` | POST | PAG-01/02 — valida header `asaas-access-token` contra `ASAAS_WEBHOOK_TOKEN` (401 se inválido, sem tocar em nenhuma cobrança), senão chama `ConfirmarPagamentoUseCase`; `CobrancaNaoEncontradaError` é logada e responde 200 (evita retry infinito do Asaas para eventos que não correspondem a nenhuma cobrança local) |

### 4.4 Jobs Assíncronos

| Job | Trigger | Descrição | Status |
|-----|---------|-----------|--------|
| Geração de cobrança | cron diário (previsto) | `GerarCobrancaUseCase` já existe e é testável; falta apenas o wrapper BullMQ que chama `.executar(new Date())` num cron diário | Use case pronto, job BullMQ **não implementado** |
| Disparo de lembretes | após geração de cobrança / cron diário | Envia mensagens via Evolution API (lembrete, vencimento, atraso D+1/D+3) | Não iniciado (módulo `mensagens`) |

---

## 5. Padrões de Projeto (Design Patterns)

> **Regra crítica:** Antes de implementar qualquer funcionalidade, verificar se já existe um padrão documentado aqui ou em `api/specs/_geral/rules.md`. **Não inventar novas abstrações** sem atualizar este documento.

| # | Padrão | Onde usar | Exemplo no projeto |
|---|--------|-----------|-------------------|
| 1 | Service Object / Use Case | Lógica de negócio, um verbo + substantivo | `CriarClienteUseCase`, `InativarClienteUseCase` |
| 2 | Job Pattern | Tarefas assíncronas (BullMQ) | job de geração de cobrança, job de disparo de lembrete |
| 3 | Repository Pattern | Acesso a dados via Prisma, interface no domínio | `ClienteRepository` |
| 4 | Porta/Adapter | Integração externa (gateway de pagamento, WhatsApp) | porta "o que um gateway de pagamento faz" ⇄ `AsaasGateway`; `NotificadorConfirmacao` ⇄ `LogNotificadorConfirmacao` (stub até o módulo `mensagens` existir) |
| 5 | Erro de domínio | Erros de regra de negócio | `DomainError` (base, `src/shared/errors/domain-error.ts`) → subclasses como `ClienteInvalidoError` |
| 6 | _[Adicionar conforme o projeto cresce]_ | — | — |

---

## 6. Obstáculos Comuns (Common Hurdles)

> Esta é a seção **mais importante** do documento. Registrar aqui todo problema encontrado e sua solução para evitar que o agente repita os mesmos erros.

### 6.1 APIs Externas

_Nenhuma integração implementada ainda (Asaas e Evolution API entram nos módulos `cobrancas`/`mensagens`, ainda não iniciados). Registrar aqui assim que surgir o primeiro obstáculo real (rate limit, formato de payload, etc.)._

### 6.2 Ambiente e Deploy

- **Problema:** `tsconfig.json` com `rootDir: "src"` quebra o typecheck (`TS6059`) se `tests/` também for incluído no mesmo programa TS.
  **Solução:** `tsconfig.json` inclui só `src` (usado pelo `build`/`start`). Criado `tsconfig.test.json` (estende o principal, `rootDir: "."`, inclui `src` + `tests`) para typecheck de editor/CI sobre os testes, sem afetar o build de produção.

- **Problema:** pacotes de lint TypeScript com nome trocado (`@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` não são o que `eslint.config.js` usa quando o config é escrito com o helper `typescript-eslint` em flat config).
  **Solução:** `eslint.config.js` importa `typescript-eslint` (pacote único, flat-config) e `@eslint/js`; `package.json` lista essas duas em vez das duas antigas separadas.

### 6.3 Testes de Integração

- **Problema:** com Vitest no modo padrão, arquivos de teste de `tests/integration/` rodam em paralelo em workers diferentes. Como `prisma-cliente-repository.test.ts` e `prisma-cobranca-repository.test.ts` compartilham o mesmo banco Postgres real, o `afterEach` de um arquivo (`prisma.cliente.deleteMany()`) podia rodar concorrentemente enquanto o outro arquivo ainda usava um cliente recém-criado — `Foreign key constraint violated on the constraint: cobrancas_cliente_id_fkey` de forma intermitente, só quando a suíte inteira rodava (`npm test`), nunca isolando um arquivo por vez.
  **Solução:** `vitest.config.ts` define `fileParallelism: false`, forçando todos os arquivos de teste (unit + integration) a rodar sequencialmente. Mais lento, mas necessário enquanto os testes de integração compartilharem estado de banco entre módulos.
  **Regra geral:** todo novo teste de integração que dependa de outra tabela/entidade (FK) deve considerar que outros arquivos de teste podem limpar tabelas relacionadas — ou usar dados isolados por teste, ou manter `fileParallelism: false`.

### 6.4 Banco de Dados

- **Problema:** `docker-compose.yml` sem `name:` no topo usa o nome da pasta pai (`api`) como nome do projeto Compose. Outro projeto na máquina (`rh_inteligente\Convoca\api`) também é uma pasta `api` sem `name:` explícito — os dois colidiam no mesmo nome de projeto Compose (`api`) e na mesma rede (`api_default`). Rodar `docker compose up -d` aqui **recriou o container Postgres do outro projeto** (`convoca_postgres`) e derrubou o Evolution API dele (`convoca_evolution`), mesmo sem qualquer relação de código entre os dois repositórios.
  **Solução:** `docker-compose.yml` agora declara `name: cobracerta` no topo, isolando o projeto Compose definitivamente por nome (não mais por pasta). Portas também migradas para evitar conflito com outros serviços já em uso na máquina: Postgres `5433:5432` (era `5432:5432`), Redis `6380:6379` (era `6379:6379`). `DATABASE_URL`/`REDIS_PORT` em `.env.example` e `.env.test` atualizados de acordo.
  **Regra geral:** todo `docker-compose.yml` novo neste ambiente (múltiplos projetos na mesma máquina) **deve** declarar `name:` explícito — nunca confiar no nome de pasta implícito.

### 6.5 Prisma Migrate em Ambiente Não-Interativo

- **Problema:** `npx prisma migrate dev --name X` falha com `Error: Prisma Migrate has detected that the environment is non-interactive` sempre que a migration teria um passo que normalmente pediria confirmação (ex: `ALTER COLUMN ... SET NOT NULL`, `ADD CONSTRAINT UNIQUE` com aviso de possíveis duplicatas) — mesmo `--create-only` não evita o prompt, porque o aviso já é emitido antes da criação do arquivo.
  **Solução:** quando o dado envolvido é conhecido como seguro (ex: tabela vazia, confirmado via `docker exec <container> psql -U cobracerta -d <db> -c "SELECT count(*) FROM <tabela>;"` antes), escrever o arquivo `migration.sql` manualmente em `prisma/migrations/<timestamp>_<nome>/`, no mesmo formato que o Prisma geraria (comentário `Warnings:` + SQL), e aplicar com `npx prisma migrate deploy` (não interativo) em vez de `migrate dev`.
  **Regra geral:** neste ambiente (Claude Code / CLI não-interativo), qualquer migration que envolva `NOT NULL`, `UNIQUE` ou remoção de coluna deve ser criada manualmente dessa forma — nunca tentar contornar com flags do `migrate dev`, que não existem para esse caso.

### 6.6 Evolução de Schema já Commitado

- **Problema:** o MVP v1.2 (`api/mvp-v1/mvp v1.2.md`) chegou depois do módulo `clientes` já implementado, testado e commitado com `telefone: string` único e `documento` opcional. Mudar para `telefones` (lista, 1:N) e `documento` obrigatório quebra a forma pública da entidade `Cliente` (`ClienteProps`/`ClienteEdicao`) e o schema Prisma ao mesmo tempo.
  **Solução:** como o projeto está em dev/pré-produção (nenhum cliente real cadastrado ainda), a mudança foi feita diretamente na entidade e no schema, sem shim de compatibilidade: `telefone` virou tabela `TelefoneCliente` (1:N, exatamente 1 `principal`), `documento` passou a exigir 11 (CPF) ou 14 (CNPJ) dígitos. Migration `20260708180622_enriquecer_cadastro_cliente_v1_2` aplicada com `ALTER COLUMN documento SET NOT NULL` — só funciona porque a tabela estava vazia nos bancos dev/test; em produção com dados reais precisaria de um passo de backfill antes.
  **Regra geral:** specs incrementais (`mvp-v*.md` ou `spec.md` de um módulo já implementado) que mudam o shape de uma entidade existente devem ser tratadas como breaking change direto enquanto não houver dados de produção — não vale a pena manter compatibilidade retroativa para um shape que nunca foi usado de verdade.

### 6.7 Outros

- O `.gitignore` da raiz originalmente continha `specs`, `mvp-v1`, `mvp-v2`, `mvp-v3` e `claude.md`, o que ignorava silenciosamente toda a documentação de specs/MVP dentro de `api/` e este próprio arquivo.
  **Solução:** `.gitignore` da raiz reduzido para conter apenas `.claude` (config local do Claude Code). Specs e `claude.md` agora são versionados normalmente.

---

## 7. Guias Operacionais

### 7.1 Pipeline Semanal/Diário (planejado — MVP v1, ainda não implementado)

```
Cron diário → verifica cobranças a gerar (com base em COBRANCA_ANTECEDENCIA_DIAS)
  ├─ Gera cobrança no Asaas (boleto + PIX), salva link de pagamento
  ├─ Evolution API dispara lembrete via WhatsApp
  ├─ Cliente paga → webhook Asaas atualiza status → confirmação disparada (opcional)
  └─ Se não pagar → régua fixa D+1 / D+3 dispara mensagens de atraso
```

### 7.2 Checklist Pós-Implementação

Após qualquer nova feature ou bugfix, validar:

- [ ] Testes passando (`npm test` dentro de `api/`)
- [ ] Nenhuma migration pendente (`npx prisma migrate status`)
- [ ] Variáveis de ambiente novas documentadas em `api/.env.example` e em `src/shared/config/env.ts`
- [ ] Novos padrões adicionados na seção 5 deste arquivo
- [ ] Novos obstáculos documentados na seção 6 deste arquivo
- [ ] Task correspondente marcada em `api/specs/<módulo>/tasks.md`
- [ ] Lint (`npm run lint`) e typecheck (`npx tsc -p tsconfig.test.json --noEmit`) limpos

### 7.3 Comandos Úteis

```bash
# Dentro de api/

# Ambiente
cp .env.example .env
docker compose up -d          # Postgres 16 (porta 5433) + Redis 7 (porta 6380), projeto Compose "cobracerta" isolado

# Desenvolvimento
npm install
npm run dev                   # Fastify em watch mode (tsx)

# Banco
npm run prisma:migrate        # aplica migrations em dev
npm run prisma:studio

# Testes
npm test                      # Vitest, roda tudo
npm run test:coverage         # cobertura (domain/ e application/)

# Qualidade
npm run lint
npx tsc -p tsconfig.test.json --noEmit
```

---

## 8. Histórico de Decisões Técnicas (ADR)

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-07-08 | Código da API vive em `api/src` (não na raiz do repo) | Mantém specs (`api/specs`), MVPs (`api/mvp-v*`) e código no mesmo diretório de topo, já que o repo é dedicado à API/backend do CobraCerta |
| 2026-07-08 | Postgres + Redis via Docker Compose em dev, desde o início | Regra geral do projeto (`api/specs/_geral/rules.md`): paridade com produção (Easypanel) e setup local sem instalação manual de serviços |
| 2026-07-08 | Configuração inicial entregue como esqueleto puro, sem regra de negócio | Decisão explícita do usuário: primeiro validar stack/tooling (Fastify, Prisma, Vitest, ESLint, Docker) funcionando ponta a ponta, módulo `clientes` (CAD) fica para a próxima etapa |
| 2026-07-08 | `.gitignore` da raiz reduzido para só `.claude` | As linhas `specs`, `mvp-v1/2/3`, `claude.md` estavam ignorando documentação real do projeto, aparentemente por engano (nomes genéricos demais para um ignore global) |
| 2026-07-08 | `docker-compose.yml` declara `name: cobracerta` e usa portas 5433 (Postgres)/6380 (Redis) em vez das portas padrão | Nome de projeto Compose implícito (nome da pasta `api`) colidiu com outro projeto na mesma máquina (`rh_inteligente\Convoca\api`, também pasta `api`), causando recriação indevida do Postgres do outro projeto. Ver seção 6.3 |
| 2026-07-08 | Módulo `clientes` (CAD) implementado com entidade rica (`Cliente.criar`/`restaurar`, validação via Zod interna) em vez de validação só na borda HTTP | Regra geral do projeto (`api/specs/_geral/rules.md` §7): entidades protegem suas próprias invariantes, independente de quem chama (use case, teste, futura importação em lote) |
| 2026-07-08 | Ciclo de cobrança para checagem de duplicidade (COB-R-04) definido como mês/ano calendário do campo `vencimento`, não a data exata | Decisão explícita do usuário: se o dia de vencimento do cliente mudar no meio do mês, ainda assim só pode haver uma cobrança não cancelada por mês; vencimento exato seria frágil demais a essa mudança |
| 2026-07-08 | Sprint 2 dividida em duas etapas: núcleo DDD (entidade `Cobranca`, `GerarCobrancaUseCase`, portas `GatewayPagamento`/`CobrancaRepository`, `PrismaCobrancaRepository`) primeiro, `AsaasGateway` real (HTTP contra sandbox) e job BullMQ depois | Decisão explícita do usuário: permite fechar o ciclo TDD (RED-GREEN-REFACTOR) do domínio/application sem depender de credenciais/sandbox do Asaas ainda não configuradas |
| 2026-07-08 | `vitest.config.ts` roda todos os arquivos de teste sequencialmente (`fileParallelism: false`) | Testes de integração de `clientes` e `cobrancas` compartilham o mesmo banco Postgres real; em paralelo, o `afterEach` de um arquivo apagava dados que o outro ainda usava (violação de FK intermitente). Ver seção 6.3 |
| 2026-07-08 | MVP v1.2 (enriquecimento de cadastro) aplicado como breaking change direto na entidade `Cliente` e no schema Prisma, sem shim de compatibilidade | Decisão explícita do usuário: projeto ainda em dev/pré-produção, sem clientes reais cadastrados — não há dado de produção pra migrar/preservar, então manter os dois shapes (antigo e novo) só adicionaria complexidade sem benefício. Ver seção 6.6 |
| 2026-07-08 | `documento` (CPF/CNPJ) tornado obrigatório na entidade `Cliente`, com validação apenas de tamanho (11 ou 14 dígitos), sem dígito verificador | Decisão explícita do usuário, alinhada à evidência do MVP v1.2 (documento presente em 100% dos orçamentos reais analisados); validação de dígito verificador explicitamente fora de escopo do v1.2 |
| 2026-07-08 | `telefone` (string única) virou `TelefoneCliente` (tabela 1:N), com exatamente 1 telefone marcado `principal` por cliente, validado na entidade (não só no banco) | Regra geral do projeto (`api/specs/_geral/rules.md` §7): entidade protege a invariante "exatamente 1 principal" independente de quem chama, e o telefone principal é quem o módulo MSG (ainda não implementado) vai usar por padrão pro disparo de WhatsApp |
| 2026-07-08 | `ConfirmarPagamentoUseCase` trata idempotência (PAG-R-04) verificando o status da cobrança *antes* de chamar `marcarComoPaga`, em vez de tornar a entidade tolerante a chamadas repetidas | Decisão explícita do usuário: mantém `Cobranca.marcarComoPaga` lançando erro para transição inválida (contrato já testado na Sprint 2), e deixa a decisão de "quando nem tentar" no use case, que é quem conhece o contexto de webhook idempotente |
| 2026-07-08 | Webhook simula o formato real do Asaas (`{ event, payment: { id } }`, token no header `asaas-access-token`) em vez de um payload simplificado provisório | Decisão explícita do usuário: reduz o retrabalho de reformatar o parsing quando a integração real com o Asaas (ainda não implementada, só o `AsaasGateway` de cobrança falta) entrar em produção |
| 2026-07-08 | `gatewayChargeId` de `Cobranca` ganhou índice único (`@unique`) no schema | Necessário para `buscarPorGatewayChargeId` (usado pelo webhook) ser uma busca correta e eficiente; aplicado via migration manual (ver seção 6.5) já que as tabelas de cobrança estavam vazias em dev/test |

---

## 9. Glossário do Domínio

| Termo | Definição |
|-------|-----------|
| Cliente | Pessoa/empresa cobrada recorrentemente pelo usuário do sistema (não confundir com o usuário da plataforma — MVP v1 é single-tenant) |
| Cobrança | Instância mensal de cobrança gerada para um cliente, com valor, vencimento e status próprios |
| Régua de cobrança | Sequência de mensagens automáticas disparadas conforme a proximidade/atraso do vencimento (fixa no MVP v1: lembrete, vencimento, D+1, D+3) |
| Single-tenant | MVP v1 atende um único usuário/empresa; multi-tenant (RBAC) é escopo do v2 |
| CAD / COB / MSG / EMAIL / PAG / DASH | Prefixos de rastreabilidade dos módulos: clientes, cobrancas, mensagens, notificacoes-email, pagamentos, dashboard |

---

## 10. Linha do Tempo do Projeto (0% → 100%)

> Registro cronológico de marcos. Cada entrada nova vai **no topo** da lista (mais recente primeiro), com data e um resumo do que mudou de estado.

### 2026-07-08 — Sprint 3 (parcial): módulo Pagamentos (PAG) via TDD
- Primeiro módulo da Sprint 3 (`api/sprints/sprint-03-mensagens-email-pagamentos.md`), na ordem sugerida PAG → MSG → EMAIL. Fecha PAG-01 a PAG-03 e a parte de toggle de PAG-04 (`api/specs/pagamentos/tasks.md`):
  - `src/domain/cobranca/cobranca-repository.ts` ganhou `buscarPorGatewayChargeId` (fake + `PrismaCobrancaRepository`), necessário pro webhook localizar a cobrança sem depender do `id` interno
  - `src/domain/cobranca/notificador-confirmacao.ts` — porta `NotificadorConfirmacao` (`notificarPagamentoConfirmado`), implementação real de disparo fica para o módulo `mensagens`
  - `src/domain/cobranca/cobranca-nao-encontrada-error.ts` — erro de domínio para `gatewayChargeId` sem cobrança correspondente
  - `src/application/cobranca/confirmar-pagamento-use-case.ts` — `ConfirmarPagamentoUseCase`: busca por `gatewayChargeId`, idempotente pra `PAGO`/`CANCELADO` (PAG-R-04, checagem de status *antes* de chamar a entidade, sem alterar o contrato de `Cobranca.marcarComoPaga`), chama `marcarComoPaga` (PAG-R-03) e dispara `NotificadorConfirmacao` só se `CONFIRMACAO_PAGAMENTO_HABILITADA` (PAG-R-05)
  - `src/infra/http/routes/webhook-asaas.ts` — `POST /webhooks/asaas`, valida header `asaas-access-token` contra `ASAAS_WEBHOOK_TOKEN` (401 sem tocar em nada se inválido — PAG-R-01, PAG-R-02), trata `CobrancaNaoEncontradaError` como log + 200 (evita retry infinito do gateway)
  - `src/infra/notificacoes/log-notificador-confirmacao.ts` — `LogNotificadorConfirmacao`, stub que só loga (módulo `mensagens` real ainda não existe)
  - `env.ts`/`.env.example`/`.env.test` — nova variável `CONFIRMACAO_PAGAMENTO_HABILITADA` (default `false`)
  - `prisma/schema.prisma` — `Cobranca.gatewayChargeId` ganhou `@unique`; migration `20260708182438_gateway_charge_id_unico` criada manualmente (ver seção 6.5) e aplicada em dev e test
- Testes: 7 unitários de `ConfirmarPagamentoUseCase` + 3 de integração de `POST /webhooks/asaas` (`fastify.inject`, banco Postgres real) — suíte completa do projeto em 70 testes, todos verdes.
- Lint e typecheck (ambos tsconfigs) limpos; `npx prisma migrate status` sem pendências.
- **Obstáculo de infra resolvido durante o módulo:** ver seção 6.5 e ADR — `npx prisma migrate dev` falha em ambiente não-interativo quando a migration envolve `NOT NULL`/`UNIQUE`; corrigido escrevendo o `migration.sql` manualmente e aplicando com `migrate deploy`, após confirmar via `psql` que as tabelas afetadas estavam vazias.
- **Não feito ainda:** disparo real de confirmação (depende do módulo `mensagens`); módulos `mensagens` e `notificacoes-email` seguem não iniciados — próximos da Sprint 3, na ordem PAG → MSG → EMAIL já concluída a etapa PAG.

### 2026-07-08 — MVP v1.2: enriquecimento do cadastro de Cliente (CAD-06 a CAD-08) via TDD
- Aplicado via ciclo RED-GREEN-REFACTOR (skills `/tdd-workflow` + `/senior-backend`) sobre o módulo `clientes` já implementado, a partir da spec incremental `api/mvp-v1/mvp v1.2.md` (evidência de orçamentos reais de um prestador de manutenção veicular). Specs atualizadas em `api/specs/clientes/spec.md`, `rules.md`, `tasks.md` (novos IDs `CAD-06` a `CAD-08`, `CAD-EXT-R-01` a `CAD-EXT-R-04`):
  - `src/domain/cliente/cliente.ts` — `documento` passou de opcional/sem validação para obrigatório com formato CPF (11 dígitos) ou CNPJ (14 dígitos), exposto via `tipoDocumento`; `telefone: string` virou `telefones: TelefoneClienteProps[]`, com invariante de exatamente 1 `principal` (`telefonePrincipal` getter); novos campos opcionais `inscricaoEstadual`, `endereco` (rua/número/bairro/cidade/uf/cep), `nomeContato`, `referenciaServico`
  - `prisma/schema.prisma` — `Cliente` ganhou os campos opcionais novos e `documento` não-nulo; nova tabela `TelefoneCliente` (1:N, índice em `cliente_id`); migration `20260708180622_enriquecer_cadastro_cliente_v1_2` aplicada em `cobracerta` (dev) e `cobracerta_test` (test)
  - `src/infra/database/prisma-cliente-repository.ts` — `salvar()` agora roda em `$transaction` (upsert de `Cliente` + replace-all de `TelefoneCliente` via delete + createMany); `buscarPorId`/`buscarPorNome`/`listarAtivos` incluem `telefones` na query
  - Testes de use case (`criar`/`editar`/`inativar-cliente-use-case.test.ts`) e de `gerar-cobranca-use-case.test.ts` atualizados para o novo shape de `ClienteProps`
- Testes: 23 unitários de entidade (13 novos, cobrindo CAD-EXT-R-01 a R-04) + 9 de integração (3 novos: múltiplos telefones, campos opcionais de endereço/contato) — suíte completa do projeto em 60 testes, todos verdes.
- Lint e typecheck (ambos tsconfigs) limpos; `npx prisma migrate status` sem pendências em dev e test.
- **Decisão de arquitetura registrada na seção 6.5 e ADR:** mudança tratada como breaking change direto (sem shim de compatibilidade), já que o projeto está em dev/pré-produção e não há clientes reais cadastrados ainda.
- **Não feito ainda:** rotas HTTP para o módulo clientes seguem não implementadas (igual Sprint 1); módulo `mensagens` (que vai consumir `telefonePrincipal`) segue não iniciado.

### 2026-07-08 — Sprint 2: núcleo DDD de Cobranças (COB) via TDD — ~25%
- Implementado via ciclo RED-GREEN-REFACTOR (skill `/tdd-workflow`), fechando COB-01, COB-02, COB-04 e a parte de porta de COB-03 (`api/specs/cobrancas/tasks.md`, `api/sprints/sprint-02-cobrancas.md`):
  - `src/domain/cobranca/cobranca.ts` — entidade `Cobranca` com `criar()` (status inicial `PENDENTE`, exige `gatewayChargeId`/`linkPagamento` não vazios — COB-R-03) e `restaurar()`; métodos `marcarComoPaga()`, `marcarComoAtrasada()`, `cancelar()`, cada um protegendo as transições de status válidas (ex: não cancela cobrança já paga)
  - `src/domain/cobranca/cobranca-invalida-error.ts`, `cliente-inativo-error.ts`, `cobranca-duplicada-error.ts` — erros de domínio
  - `src/domain/cobranca/gateway-pagamento.ts` — porta `GatewayPagamento` (`criarCobranca`), sem qualquer referência a SDK/HTTP do Asaas
  - `src/domain/cobranca/cobranca-repository.ts` — porta (`salvar`, `buscarPorId`, `existeParaCicloVigente`)
  - `src/application/cobranca/gerar-cobranca-use-case.ts` — `GerarCobrancaUseCase`: para cada cliente `ATIVO`, calcula o vencimento do ciclo a partir de `diaVencimento` + mês/ano de referência, filtra pela janela de `COBRANCA_ANTECEDENCIA_DIAS`, checa duplicidade (COB-R-04) antes de chamar o gateway, e só persiste após resposta válida do gateway (COB-R-03 — nunca salva cobrança com dados de gateway ausentes)
  - `src/infra/database/prisma-cobranca-repository.ts` — implementação Prisma da porta; `existeParaCicloVigente` filtra por `vencimento` dentro do mês/ano (decisão registrada na seção 8) e ignora cobranças `CANCELADO`
  - `src/domain/cliente/cliente-repository.ts` ganhou `listarAtivos()` (necessário para o use case iterar só clientes `ATIVO` — COB-R-05), implementado no fake e no `PrismaClienteRepository`
- Testes: 17 unitários (11 de entidade + 6 de use case, com `FakeCobrancaRepository`/`FakeGatewayPagamento`/`FakeClienteRepository` em memória) + 6 de integração (`tests/integration/prisma-cobranca-repository.test.ts`, banco Postgres real) — suíte completa do projeto em 47 testes, todos verdes.
- Lint e typecheck (ambos tsconfigs) limpos; `npx prisma migrate status` sem pendências (schema `Cobranca` já existia desde o esqueleto inicial, sem nova migration necessária).
- **Obstáculo de infra resolvido durante a sprint:** ver seção 6.3 e ADR — testes de integração de `clientes` e `cobrancas` compartilham o mesmo banco e corrompiam uns aos outros quando rodavam em paralelo (violação de FK intermitente); corrigido com `fileParallelism: false` em `vitest.config.ts`.
- **Não feito ainda (fica para a próxima etapa da Sprint 2):** `AsaasGateway` (adapter HTTP real contra sandbox do Asaas — COB-03), job agendado BullMQ que chama `GerarCobrancaUseCase.executar()` num cron diário (COB-01), log estruturado + painel de erros (COB-05). Módulos `mensagens`, `notificacoes-email`, `pagamentos`, `dashboard` seguem não iniciados.

### 2026-07-08 — Sprint 1: módulo Clientes (CAD) completo — ~15%
- Implementado o CRUD de cliente ponta a ponta em DDD, fechando todas as tasks CAD-01 a CAD-05 (`api/specs/clientes/tasks.md`, `api/sprints/sprint-01-clientes.md`):
  - `src/domain/cliente/cliente.ts` — entidade `Cliente` com `criar()` (status inicial ATIVO) e `restaurar()` (hidratação sem reaplicar defaults), validação de invariantes via Zod interno (nome não vazio, telefone E.164, dia de vencimento 1–28, valor de cobrança positivo), métodos `inativar()`, `reativar()`, `editar()`
  - `src/domain/cliente/cliente-invalido-error.ts` e `cliente-nao-encontrado-error.ts` — erros de domínio (subclasses de `DomainError`)
  - `src/domain/cliente/cliente-repository.ts` — porta (`salvar`, `buscarPorId`, `buscarPorNome`)
  - `src/application/cliente/` — `CriarClienteUseCase`, `InativarClienteUseCase`, `EditarClienteUseCase`
  - `src/infra/database/prisma-cliente-repository.ts` — implementação Prisma da porta, incluindo `buscarPorNome` (CAD-05, `contains` + `mode: insensitive`) e `salvar` via `upsert`
  - Migration `20260708171616_init` aplicada nos bancos `cobracerta` (dev) e `cobracerta_test` (test)
- Testes: 19 unitários (domínio + application, com `FakeClienteRepository` em memória em `tests/unit/fakes/`) + 4 de integração (`tests/integration/prisma-cliente-repository.test.ts`, banco Postgres real) — suíte completa em 24 testes, todos verdes.
- Lint e typecheck (ambos tsconfigs) limpos; `npx prisma migrate status` sem pendências.
- **Incidente de infra resolvido durante a sprint:** ver seção 6.3 e ADR — `docker compose up` inicial colidiu com outro projeto (`Convoca`) por nome de projeto Compose implícito repetido; corrigido com `name: cobracerta` + portas dedicadas (5433/6380) antes de aplicar qualquer migration.
- **Não feito ainda:** rotas HTTP para o módulo clientes (a spec/sprint não pediu endpoints, só o núcleo DDD); demais módulos (`cobrancas`, `mensagens`, `notificacoes-email`, `pagamentos`, `dashboard`) seguem não iniciados. Próxima sprint natural: Sprint 2 — Cobranças (`api/sprints/sprint-02-cobrancas.md`), que depende de `Cliente` já existir (agora existe).

### 2026-07-08 — Configuração inicial da API (esqueleto) — ~5%
- Repositório já continha specs completas do MVP v1/v2/v3 e specs por módulo (`clientes`, `cobrancas`, `mensagens`, `notificacoes-email`, `pagamentos`, `dashboard`), mas nenhum código.
- Criada a estrutura DDD em `api/src` (`domain/`, `application/`, `infra/`, `shared/`) e `api/tests` (`unit/`, `integration/`), vazias exceto pelos primeiros arquivos técnicos.
- Configurado o esqueleto técnico completo, sem nenhuma regra de negócio ainda:
  - `package.json`, `tsconfig.json` + `tsconfig.test.json`, `eslint.config.js`, `vitest.config.ts`
  - `prisma/schema.prisma` com os 3 models do MVP v1: `Cliente`, `Cobranca`, `MensagemEnviada` (enums `StatusCliente`, `StatusCobranca`, `TipoMensagem`), snake_case mapeado via `@map`/`@@map`, índices em `cliente_id` e `status` de `Cobranca`
  - `src/shared/config/env.ts` — validação de env com Zod, single source of truth
  - `src/shared/errors/domain-error.ts` — classe base `DomainError`
  - `src/infra/database/prisma-client.ts` — client Prisma singleton
  - `src/infra/http/app.ts` + `server.ts` + `routes/health.ts` — Fastify com rota `/health`, logger Pino (pretty em dev)
  - `docker-compose.yml` — Postgres 16 + Redis 7
  - `.env.example`, `.env.test`
  - Primeiro teste (`tests/integration/health.test.ts`), validando `GET /health` via `app.inject`
- Validado ponta a ponta: `npm install`, `npx prisma generate`, `npx vitest run` (1 teste passando), `npx eslint .` (limpo), `npx tsc --noEmit` em ambos os tsconfigs (limpo).
- Corrigido `.gitignore` da raiz, que ignorava `api/specs/**`, `api/mvp-v*/**` e `claude.md` por acidente.
- **Não feito ainda:** nenhum use case, entidade de domínio, repositório real, integração com Asaas/Evolution API, migration aplicada em banco real, nem o dashboard Next.js. Próximo passo natural: módulo `clientes` (CAD-01 a CAD-05, ver `api/specs/clientes/tasks.md`).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
