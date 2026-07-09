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
| E-mail | Gmail via `nodemailer` (senha de app) | canal complementar (módulo `notificacoes-email`) |
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
| `Cobranca` | `cobrancas` | Cobrança gerada para um cliente: valor, vencimento, status (PENDENTE/PAGO/ATRASADO/CANCELADO), dados do gateway (`gatewayChargeId`, `linkPagamento`, `pixCopiaECola` opcional) |
| `MensagemEnviada` | `mensagens_enviadas` | Registro de mensagem enviada por cobrança (LEMBRETE/VENCIMENTO/ATRASO/CONFIRMACAO) |

### 4.2 Services / Use Cases

| Use Case | Localização | Responsabilidade |
|---|---|---|
| `CriarClienteUseCase` | `src/application/cliente/criar-cliente-use-case.ts` | CAD-01 — valida e persiste novo cliente (status inicial ATIVO) |
| `InativarClienteUseCase` | `src/application/cliente/inativar-cliente-use-case.ts` | CAD-03 — inativa cliente existente (mantém histórico) |
| `EditarClienteUseCase` | `src/application/cliente/editar-cliente-use-case.ts` | CAD-04 — edita dados de cliente existente reaplicando invariantes |
| `GerarCobrancaUseCase` | `src/application/cobranca/gerar-cobranca-use-case.ts` | COB-01 — para cada cliente ativo, calcula vencimento do ciclo, checa duplicidade (COB-R-04), cria cobrança no `GatewayPagamento` e persiste como `PENDENTE` (COB-R-02, COB-R-03, COB-R-05) |
| `ConfirmarPagamentoUseCase` | `src/application/cobranca/confirmar-pagamento-use-case.ts` | PAG-01 — busca cobrança por `gatewayChargeId`, ignora sem erro se já `PAGO`/`CANCELADO` (PAG-R-04, idempotência), senão chama `Cobranca.marcarComoPaga` e, se `CONFIRMACAO_PAGAMENTO_HABILITADA`, dispara `NotificadorConfirmacao` (PAG-R-05) |
| `DispararLembreteInicialUseCase` | `src/application/mensagem/disparar-lembrete-inicial-use-case.ts` | MSG-01 — dado uma `Cobranca` recém-gerada, monta texto de LEMBRETE e envia pro `telefonePrincipal` do cliente via `CanalMensagem` **e**, se o cliente tiver e-mail, também por `CanalNotificacao` (envio em paralelo, não fallback — ver decisão abaixo) via `enviarMensagemMultiplosCanais`; registra 1 `MensagemEnviada` por canal tentado (whatsapp/email), cada uma com seu próprio ENVIADO/FALHA, nunca lança em caso de falha de envio |
| `DispararReguaAtrasoUseCase` | `src/application/mensagem/disparar-regua-atraso-use-case.ts` | MSG-02/03/04 — cron diário: lista cobranças `PENDENTE`/`ATRASADO`, calcula dias desde o vencimento (0/+1/+3), dispara VENCIMENTO ou ATRASO nos mesmos moldes (WhatsApp + e-mail em paralelo do lembrete inicial), deduplicando por `MensagemEnviadaRepository.existeParaCobrancaETipo` (basta 1 registro de qualquer canal existir pro tipo/cobrança pra não duplicar no próximo cron) e nunca interrompendo a fila em caso de falha (MSG-R-04, MSG-R-06) |

`enviarMensagemMultiplosCanais` (`src/application/mensagem/enviar-mensagem-multiplos-canais.ts`) é o helper compartilhado pelos três disparos (lembrete, régua, confirmação): sempre tenta `CanalMensagem` (WhatsApp) e, se houver e-mail cadastrado, sempre tenta também `CanalNotificacao` — os dois em paralelo, não é mais fallback (decisão de 2026-07-08, ver seção 8/10: cliente precisa do e-mail com o link da fatura Asaas — boleto + PIX — mesmo quando o WhatsApp funciona). Devolve um array de `{ statusEnvio, canal }`, um item por canal efetivamente tentado (1 item se só WhatsApp, 2 se também e-mail); os três use cases persistem 1 `MensagemEnviada` por item do array. Substituiu `enviarMensagemComFallback` (deletado, sem shim).

`MensagemNotificadorConfirmacao` (`src/infra/notificacoes/mensagem-notificador-confirmacao.ts`) implementa `NotificadorConfirmacao` (módulo `cobrancas`) reaproveitando esse mesmo helper — é o que o webhook do Asaas chama quando `CONFIRMACAO_PAGAMENTO_HABILITADA` está ligado (substituiu o antigo stub `LogNotificadorConfirmacao`).

| `ListarCobrancasDashboardUseCase` | `src/application/cobranca/listar-cobrancas-dashboard-use-case.ts` | DASH-01/02/03/04 — recebe filtro opcional (`status`, `busca`, `mes`/`ano`; default mês/ano corrente), delega para a porta `DashboardCobrancaQuery` e devolve `{ itens, totais }` |

`DashboardCobrancaQuery` (`src/domain/cobranca/dashboard-cobranca-query.ts`) é uma porta de **leitura** dedicada (não é o `CobrancaRepository` de escrita/domínio) — decisão explícita do usuário para não misturar leitura de apresentação (precisa de `nomeCliente`, join com `Cliente`) com o ciclo de vida da entidade `Cobranca`. Implementação Prisma em `src/infra/database/prisma-dashboard-cobranca-query.ts` (`listar` com `include: { cliente }` + filtro por mês/status/nome; `calcularTotais` via `groupBy` por `status`).

Módulo `dashboard`: backend (DASH-01 a DASH-04) implementado; frontend Next.js ainda não iniciado (decisão explícita do usuário: backend primeiro, ver seção 10).

### 4.3 Rotas HTTP

| Rota | Método | Responsabilidade |
|---|---|---|
| `/health` | GET | Healthcheck simples |
| `/webhooks/asaas` | POST | PAG-01/02 — valida header `asaas-access-token` contra `ASAAS_WEBHOOK_TOKEN` (401 se inválido, sem tocar em nenhuma cobrança), senão chama `ConfirmarPagamentoUseCase`; `CobrancaNaoEncontradaError` é logada e responde 200 (evita retry infinito do Asaas para eventos que não correspondem a nenhuma cobrança local) |
| `/dashboard/cobrancas` | GET | DASH-01/02/03/04 — query params opcionais `status`, `busca`, `mes`, `ano` (default: mês/ano corrente); 400 se `status` não for um `StatusCobranca` válido; chama `ListarCobrancasDashboardUseCase` e devolve `{ itens: CobrancaDashboardItem[], totais: TotaisDashboard }` |

### 4.4 Jobs Assíncronos

| Job | Trigger | Descrição | Status |
|-----|---------|-----------|--------|
| Geração de cobrança | cron diário `0 8 * * *` (BullMQ `upsertJobScheduler`) | `src/infra/queue/gerar-cobranca-job.ts` chama `GerarCobrancaUseCase.executar(new Date())` (retorna as `Cobranca[]` geradas) e, para cada uma, dispara `DispararLembreteInicialUseCase.executar(cobranca)`, isolando falha por cobrança (loga e continua) | **Implementado**, roda no mesmo processo do Fastify |
| Disparo da régua de atraso | cron diário `0 9 * * *` (BullMQ `upsertJobScheduler`) | `src/infra/queue/disparar-regua-atraso-job.ts` chama `DispararReguaAtrasoUseCase.executar(new Date())` | **Implementado**, roda no mesmo processo do Fastify |

---

## 5. Padrões de Projeto (Design Patterns)

> **Regra crítica:** Antes de implementar qualquer funcionalidade, verificar se já existe um padrão documentado aqui ou em `api/specs/_geral/rules.md`. **Não inventar novas abstrações** sem atualizar este documento.

| # | Padrão | Onde usar | Exemplo no projeto |
|---|--------|-----------|-------------------|
| 1 | Service Object / Use Case | Lógica de negócio, um verbo + substantivo | `CriarClienteUseCase`, `InativarClienteUseCase` |
| 2 | Job Pattern | Tarefas assíncronas (BullMQ) | job de geração de cobrança, job de disparo de lembrete |
| 3 | Repository Pattern | Acesso a dados via Prisma, interface no domínio | `ClienteRepository` |
| 4 | Porta/Adapter | Integração externa (gateway de pagamento, WhatsApp, e-mail) | porta "o que um gateway de pagamento faz" ⇄ `AsaasGateway`; `NotificadorConfirmacao` ⇄ `MensagemNotificadorConfirmacao` (`src/infra/notificacoes/`, WhatsApp com fallback e-mail); `CanalMensagem` ⇄ `EvolutionCanalMensagem` (`src/infra/gateways/evolution-canal-mensagem.ts`, HTTP direto via fetch contra a Evolution API, sem SDK de terceiros); `CanalNotificacao` ⇄ `NodemailerGmailNotificador` (`src/infra/gateways/nodemailer-gmail-notificador.ts`, Gmail via `nodemailer`, transport `service: "gmail"` autenticado com usuário + senha de app) |
| 5 | Erro de domínio | Erros de regra de negócio | `DomainError` (base, `src/shared/errors/domain-error.ts`) → subclasses como `ClienteInvalidoError` |
| 6 | Queue + Worker + JobScheduler (BullMQ) | Cron diário que roda no mesmo processo do Fastify | `src/infra/queue/gerar-cobranca-job.ts` e `disparar-regua-atraso-job.ts`: cada job expõe `criar<Nome>Queue()`, `agendar<Nome>Job(queue)` (chama `queue.upsertJobScheduler` com `pattern` cron) e `criar<Nome>Worker()`; `src/infra/queue/use-cases-factory.ts` centraliza a instanciação dos use cases com adapters reais (mesmo padrão de `webhook-asaas.ts`); `src/infra/queue/workers.ts#iniciarWorkers` é chamado uma vez em `server.ts` após o `app.listen` |
| 7 | Read Query Port | Leitura de apresentação (dashboard/relatórios) que precisa de join/agregação, sem tocar o ciclo de vida da entidade de domínio | `DashboardCobrancaQuery` (`src/domain/cobranca/dashboard-cobranca-query.ts`) ⇄ `PrismaDashboardCobrancaQuery`: porta separada do `CobrancaRepository` (que só cuida de salvar/restaurar a entidade `Cobranca`), devolve DTOs simples (`CobrancaDashboardItem`, `TotaisDashboard`) já com dado de outras entidades (nome do cliente) embutido |
| 8 | _[Adicionar conforme o projeto cresce]_ | — | — |

---

## 6. Obstáculos Comuns (Common Hurdles)

> Esta é a seção **mais importante** do documento. Registrar aqui todo problema encontrado e sua solução para evitar que o agente repita os mesmos erros.

### 6.1 APIs Externas

#### Gmail via Nodemailer
- **Decisão (atual, 2026-07-08):** autenticação via usuário + senha de app do Google (`nodemailer.createTransport({ service: "gmail", auth: { user, pass } })`), não mais OAuth2. `NodemailerGmailNotificador` (`src/infra/gateways/nodemailer-gmail-notificador.ts`) monta o envio direto via `transporter.sendMail({ from, to, subject, html })` — Nodemailer cuida do envelope da mensagem, não precisa mais montar RFC 2822/base64url manualmente.
- **Decisão anterior (revertida):** o módulo usou Gmail API via OAuth2 (`googleapis`, client id/secret + refresh token) entre 2026-07-08 e a troca para Nodemailer no mesmo dia — nunca chegou a ser configurado com credenciais reais em produção. Trocado por Nodemailer + senha de app por ser mais simples de configurar (não depende de criar projeto/OAuth consent screen no Google Cloud Console, só gerar uma senha de app na conta Gmail). Ver ADR (seção 8).
- **Validado contra o Gmail real em 2026-07-08:** com a senha de app gerada pelo usuário e configurada em `GMAIL_USUARIO`/`GMAIL_SENHA_APP`/`GMAIL_REMETENTE` no `.env`, um envio real via `nodemailer.createTransport({ service: "gmail", ... })` foi disparado e confirmado entregue (resposta SMTP `250 2.0.0 OK` do Gmail). A senha de app com espaços (formato exibido pelo Google, ex: `abcd efgh ijkl mnop`) funciona sem precisar remover os espaços.

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

### 6.7 `env.ts` não carregava `.env` fora dos testes

- **Problema:** `src/shared/config/env.ts` sempre leu só `process.env` cru — nunca chamou `dotenv.config()`. Os testes nunca sentiram isso porque `tests/setup-env.ts` já carrega `.env.test` via `dotenv` antes da suíte rodar (`vitest.config.ts` → `setupFiles`). Mas `npm run dev`/`npm start` (que rodam `server.ts` direto, sem esse setup) sempre falhavam no boot com "Variáveis de ambiente inválidas" mesmo com um `.env` preenchido, porque nada colocava o `.env` em `process.env` antes da validação Zod. Só foi descoberto ao validar o wiring dos jobs subindo o servidor de verdade pela primeira vez (ver seção 10, entrada de wiring dos jobs BullMQ).
  **Solução:** `env.ts` agora chama `config()` do pacote `dotenv` (já era dependência do projeto) no topo do arquivo, condicionado a `NODE_ENV !== "test"` (em test o carregamento continua sendo responsabilidade explícita de `tests/setup-env.ts`, pra não ler o `.env` errado).
  **Regra geral:** qualquer entrypoint novo que não passe por `tests/setup-env.ts` (scripts standalone, workers separados, etc.) depende desse `config()` em `env.ts` para funcionar fora de `npm test` — não recriar carregamento de `.env` em outros lugares.

### 6.8 Outros

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
| 2026-07-08 | Módulo `mensagens` (MSG) dividido em dois use cases (`DispararLembreteInicialUseCase` para MSG-01, `DispararReguaAtrasoUseCase` para MSG-02/03/04) em vez de um único use case genérico | Decisão explícita do usuário (opção escolhida entre as alternativas apresentadas): mantém explícito qual é o gatilho de cada mensagem — o lembrete inicial nasce junto da geração da cobrança, a régua de atraso roda em cron diário separado — em vez de um único use case tentando cobrir os dois gatilhos |
| 2026-07-08 | Deduplicação de envio (evitar reenviar o mesmo tipo de mensagem pra mesma cobrança, ex: cron rodando 2x) feita consultando `MensagemEnviadaRepository.existeParaCobrancaETipo` em vez de um campo de controle novo na entidade `Cobranca` | Decisão explícita do usuário: reaproveita a tabela `MensagemEnviada` que MSG-R-05 já exige como fonte de verdade, sem duplicar esse estado em `Cobranca` (entidade de COB, módulo já estável) |
| 2026-07-08 | Campo `statusEnvio` de `MensagemEnviada` guarda só o resultado (`"ENVIADO"` \| `"FALHA"`), não o texto bruto do erro | Decisão explícita do usuário: mantém a tabela simples para MSG-R-05/06; debug de erro de envio fica pro log estruturado (Pino), não pra coluna do banco |
| 2026-07-08 | `AsaasGateway` cria/busca o customer no Asaas on-the-fly (por `cpfCnpj`) a cada cobrança, em vez de guardar `asaasCustomerId` em `Cliente` | Decisão explícita do usuário (opção escolhida entre as duas apresentadas): evita migration/campo novo numa entidade já estável (`Cliente`), aceitando uma chamada HTTP a mais (`GET /v3/customers?cpfCnpj=`) por cobrança gerada — volume baixo o suficiente (MVP single-tenant) pra não justificar o cache |
| 2026-07-08 | Workers BullMQ (geração de cobrança + régua de atraso) rodam no mesmo processo do Fastify, iniciados por `iniciarWorkers()` chamado após `app.listen` em `server.ts` | Decisão explícita do usuário: dado o volume baixo do MVP single-tenant (seção 9, "Single-tenant"), processo separado (`npm run worker` dedicado) adicionaria complexidade operacional sem benefício correspondente agora |
| 2026-07-08 | `GerarCobrancaUseCase.executar()` passou a retornar `Cobranca[]` (antes `Promise<void>`) | Necessário para o job de geração saber exatamente quais cobranças foram criadas nesta execução e disparar `DispararLembreteInicialUseCase` só para elas — evita reprocessar todas as cobranças pendentes do sistema a cada rodada do cron |
| 2026-07-08 | `GmailNotificador` (Gmail API via OAuth2/`googleapis`) substituído por `NodemailerGmailNotificador` (Nodemailer, transport Gmail com usuário + senha de app) | Decisão explícita do usuário, trazendo uma spec já validada em outro projeto: senha de app é mais simples de configurar (só a conta Google → Segurança → Senhas de app) do que o fluxo OAuth2 (projeto no Google Cloud Console, client id/secret, geração de refresh token) — nenhuma das duas credenciais chegou a ser configurada em produção, então a troca não teve custo de migração de dado real. A porta `CanalNotificacao` não mudou, só o adapter (ver seção 6.1) |
| 2026-07-08 | Módulo `dashboard`: backend implementado primeiro (endpoint `GET /dashboard/cobrancas`), frontend Next.js deixado para uma etapa separada | Decisão explícita do usuário (opção escolhida entre as duas apresentadas), consistente com o padrão do projeto desde a Sprint 0 (stack/backend validado antes de somar camada nova) |
| 2026-07-08 | Leitura do dashboard modelada como porta própria (`DashboardCobrancaQuery`), separada do `CobrancaRepository` de escrita/domínio | Decisão explícita do usuário (opção escolhida entre as duas apresentadas): a leitura de apresentação precisa de `nomeCliente` (join com `Cliente`) e agregação por status, concerns que não pertencem à entidade `Cobranca` nem ao repositório que cuida do seu ciclo de vida; evita "contaminar" `CobrancaRepository` com DTOs de tela |
| 2026-07-08 | E-mail deixou de ser só fallback do WhatsApp — passou a ser enviado sempre em paralelo, quando o cliente tem e-mail cadastrado (lembrete, régua de atraso, confirmação de pagamento) | Decisão explícita do usuário: cliente precisa da fatura Asaas (boleto + PIX, `linkPagamento`/`invoiceUrl`) por e-mail mesmo quando o WhatsApp já funcionou, não só quando falha |
| 2026-07-08 | Cada disparo de mensagem passou a gerar 1 registro `MensagemEnviada` por canal efetivamente tentado (até 2: whatsapp + email), em vez de 1 registro único com 1 canal | Decisão explícita do usuário (opção escolhida entre as duas apresentadas): mantém o schema de `MensagemEnviada` sem alteração (nenhuma migration necessária) e preserva histórico granular por canal; a dedup da régua (`existeParaCobrancaETipo`) continua correta porque só verifica cobrança+tipo, não canal |
| 2026-07-09 | E-mail/WhatsApp de lembrete e régua passaram a incluir também o código PIX copia-e-cola (texto puro), não só o link da fatura Asaas | Decisão explícita do usuário (opção escolhida entre "só PIX copia-e-cola" vs. "PDF do boleto anexado"): cliente consegue pagar via PIX sem precisar abrir o link, copiando o código direto da mensagem; PDF anexado ficou fora de escopo por ora |
| 2026-07-09 | `AsaasGateway.criarCobranca()` busca o PIX (`GET /payments/{id}/pixQrCode`) logo após criar o payment, e devolve `pixCopiaECola` já pronto pra persistir em `Cobranca` — não busca de novo a cada disparo de mensagem | Decisão explícita do usuário (opção escolhida entre "buscar na criação" vs. "buscar a cada disparo"): evita 1 chamada HTTP ao Asaas por mensagem enviada (lembrete + até 2 da régua = até 3 chamadas extras por cobrança); campo populado 1x e reaproveitado em todos os disparos |
| 2026-07-09 | Falha ao buscar o PIX não interrompe a criação da cobrança — `pixCopiaECola` fica `null` e a cobrança segue sendo persistida normalmente com o link da fatura | Decisão explícita do usuário: o endpoint do PIX é um extra sobre uma cobrança já criada com sucesso; um erro temporário nele não deveria bloquear a geração da cobrança inteira, já que o link da fatura sozinho já permite o pagamento |
| 2026-07-09 | Evolution API sobe via Docker Compose reaproveitando o Postgres/Redis do CobraCerta (schema `evolution_api` separado no mesmo Postgres, DB index `/6` no mesmo Redis), em vez de containers de banco dedicados | Decisão explícita do usuário (opção escolhida entre as duas apresentadas): evita subir containers extras de banco só para a Evolution API, mantendo o ambiente local mais simples |
| 2026-07-09 | Serviço `evolution-manager` (UI standalone) removido do `docker-compose.yml` logo após ser adicionado | A imagem `evoapicloud/evolution-manager:latest` tem um bug de config nginx nesta versão (`invalid value "must-revalidate"`, container em restart loop); a própria `evolution-api` já serve um manager embutido funcional em `/manager`, tornando o container separado redundante |
| 2026-07-09 | `CONFIG_SESSION_PHONE_VERSION` não é usada — deixada sem configurar | Investigação no código-fonte (`whatsapp.baileys.service.ts` do branch `main` da Evolution API) mostrou que essa env var foi descontinuada; a versão do Baileys é sempre buscada dinamicamente via `fetchLatestWaWebVersion()`, direto do `sw.js` do WhatsApp Web real — não há mais como fixar manualmente, e a versão auto-detectada já é a mais recente de produção |

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

### 2026-07-09 — Evolution API (WhatsApp) configurada e validada com envio real

- Fecha a última credencial pendente do MVP v1 (ver seção 6.1 e entradas anteriores desta linha do tempo: Gmail já validado em 2026-07-08, Asaas sandbox já validado). Com isso, os 3 canais externos do sistema (Asaas, Gmail, Evolution API) estão todos validados contra serviços reais, não só mocks/fakes:
  - `docker-compose.yml` — novo serviço `evolution-api` (imagem `evoapicloud/evolution-api:latest`, porta `8080`), reaproveitando `postgres` (schema `evolution_api` separado, mesma instância) e `redis` (DB index `/6`) já existentes no compose; volume `cobracerta_evolution_instances` para persistência de sessão
  - `.env` — `EVOLUTION_API_URL=http://localhost:8080`, `EVOLUTION_API_KEY` (gerada aleatoriamente), `EVOLUTION_INSTANCE=cobracerta`; `.env.example` documentado
  - Instância WhatsApp `cobracerta` criada via `POST /instance/create` (integração `WHATSAPP-BAILEYS`) e conectada com sucesso via QR Code (manager embutido em `http://localhost:8080/manager`)
- **Obstáculos resolvidos durante a configuração:**
  - Container `evolution-manager` (UI standalone, imagem `evoapicloud/evolution-manager:latest`) entrou em restart loop por bug de config nginx (`invalid value "must-revalidate"`) — removido do compose; a própria `evolution-api` já serve um manager funcional embutido em `/manager`, sem necessidade de container extra
  - QR Code não era lido pela câmera do celular em duas tentativas — investigado como possível problema de versão do Baileys desatualizada (`CONFIG_SESSION_PHONE_VERSION`), mas essa env var foi confirmada como **descontinuada** no código-fonte atual da Evolution API (a versão do Baileys é sempre buscada dinamicamente do WhatsApp Web real via `fetchLatestWaWebVersion()`, já retornando a versão de produção mais atual). A causa real era **timing**: o QR Code expira em poucos segundos, e o tempo entre gerar a imagem e o usuário conseguir escanear era maior que isso. Resolvido gerando o QR Code (decodificado de base64 para PNG, upscaled para melhor legibilidade) e abrindo a imagem imediatamente antes do scan
- **Validado com WhatsApp real (não só mock):** instância conectada (`connectionStatus: "open"`, número vinculado); mensagem de teste enviada via `POST /message/sendText/cobracerta` direto pela API; depois, o fluxo completo do sistema (`EditarClienteUseCase` para atualizar o telefone do cliente de teste + `DispararLembreteInicialUseCase` usando o adapter real `EvolutionCanalMensagem`) confirmado com `MensagemEnviada` registrando `canal: "whatsapp"`, `statusEnvio: "ENVIADO"` — e também `canal: "email"` em paralelo, confirmando o comportamento de envio simultâneo (ver entrada anterior desta linha do tempo sobre e-mail deixar de ser fallback)
- **Não feito ainda:** nenhuma pendência de código — a integração está funcionalmente completa. Resta apenas o frontend Next.js do dashboard como pendência maior do MVP v1.

### 2026-07-09 — Código PIX copia-e-cola incluído nas mensagens de cobrança (via TDD)

- Motivação do usuário: além do link da fatura (boleto+PIX numa página só), o cliente deve conseguir pagar via PIX copiando o código direto do WhatsApp/e-mail, sem precisar abrir link. Decisão explícita, opção escolhida entre "só código PIX" vs. "PDF do boleto anexado" (PDF ficou fora de escopo). A busca do PIX acontece 1x, na criação da cobrança (não a cada disparo de mensagem — opção também escolhida entre as duas apresentadas):
  - `src/domain/cobranca/gateway-pagamento.ts` — `CriarCobrancaGatewayOutput` ganhou `pixCopiaECola: string | null`
  - `src/domain/cobranca/cobranca.ts` — `CobrancaProps`/`Cobranca` ganharam `pixCopiaECola` (opcional, nullish no schema Zod), getter `pixCopiaECola`
  - `src/infra/gateways/asaas-gateway.ts` — `AsaasGateway.criarCobranca()` passou a chamar `GET /payments/{id}/pixQrCode` logo após criar o payment e devolver o campo `payload` da resposta como `pixCopiaECola`; validado contra a sandbox real do Asaas (endpoint retorna `{ success, encodedImage, payload, expirationDate, description }`); se a busca do PIX falhar (`try/catch` interno, não propaga), `pixCopiaECola` fica `null` sem impedir a criação da cobrança (decisão explícita do usuário)
  - `prisma/schema.prisma` — `Cobranca.pixCopiaECola` (`String?`, `@map("pix_copia_e_cola")`); migration `20260709031951_adiciona_pix_copia_e_cola_cobranca` (coluna nullable simples, sem prompt não-interativo, aplicada via `prisma migrate dev` + `migrate deploy` no banco de test)
  - `src/infra/database/prisma-cobranca-repository.ts` — `salvar`/`paraEntidade` passam o campo adiante
  - `src/application/cobranca/gerar-cobranca-use-case.ts` — persiste `resultadoGateway.pixCopiaECola` na `Cobranca` criada
  - `src/domain/mensagem/template-mensagem.ts` — `DadosTemplateMensagem` ganhou `pixCopiaECola?: string | null`; texto de LEMBRETE/VENCIMENTO/ATRASO acrescenta `" Ou pague via Pix copia-e-cola: <código>"` quando presente
  - `src/domain/mensagem/template-email.ts` — corpo HTML acrescenta um bloco `<p>Ou pague via Pix copia-e-cola:</p><p><code>...</code></p>` quando presente
  - `src/application/mensagem/disparar-lembrete-inicial-use-case.ts` e `disparar-regua-atraso-use-case.ts` — passam `cobranca.pixCopiaECola` para os templates (confirmação de pagamento não usa, é pós-pagamento)
- Testes: 2 novos em `cobranca.test.ts`, 4 novos em `asaas-gateway.test.ts` (busca do PIX com sucesso, propagação pro customer novo, falha isolada não quebra a cobrança), 2 novos em `template-mensagem.test.ts` e `template-email.test.ts`, 1 novo em `gerar-cobranca-use-case.test.ts` — suíte completa do projeto em 141 testes, todos verdes.
- Lint e typecheck (ambos tsconfigs) limpos; `npx prisma migrate status` sem pendências em dev e test.
- **Validado contra a sandbox real do Asaas** (não só mock de `fetch`): criada uma cobrança PIX+boleto de teste (`billingType: "UNDEFINED"`), confirmado que `GET /payments/{id}/pixQrCode` devolve o `payload` esperado, e que o fluxo `AsaasGateway.criarCobranca()` ponta a ponta (`npx tsx`, script descartável, removido depois) devolve `pixCopiaECola` populado; payment e customer de teste removidos da sandbox depois (`DELETE /payments/:id`, `DELETE /customers/:id`).
- **Não feito ainda:** PDF do boleto anexado ao e-mail (avaliado e descartado por decisão explícita do usuário nesta etapa); dashboard/frontend Next.js segue como única pendência maior do MVP v1.

### 2026-07-08 — E-mail deixa de ser fallback: envio sempre em paralelo ao WhatsApp (via TDD)

- Motivação do usuário: cliente precisa receber por e-mail o link da fatura Asaas (boleto + PIX juntos, `linkPagamento`/`invoiceUrl`) mesmo quando o WhatsApp já funcionou — antes o e-mail só era enviado quando o WhatsApp falhava (fallback). Decisão explícita, opção escolhida entre duas apresentadas: manter os dois canais em paralelo (não fallback), e registrar 1 `MensagemEnviada` por canal tentado em vez de mudar o schema:
  - `src/application/mensagem/enviar-mensagem-multiplos-canais.ts` — `enviarMensagemMultiplosCanais`, substitui `enviarMensagemComFallback` (deletado sem shim): sempre tenta `CanalMensagem` (WhatsApp); se o cliente tiver e-mail, sempre tenta também `CanalNotificacao`, independente do resultado do WhatsApp; devolve `ResultadoEnvioPorCanal[]` (1 ou 2 itens), nunca lança
  - `src/application/mensagem/disparar-lembrete-inicial-use-case.ts`, `disparar-regua-atraso-use-case.ts`, `src/infra/notificacoes/mensagem-notificador-confirmacao.ts` — os 3 pontos de disparo trocaram `enviarMensagemComFallback` por `enviarMensagemMultiplosCanais` e passaram a persistir 1 `MensagemEnviada` por item do array retornado (`for (const resultado of resultados) { ... }`), em vez de 1 registro único
- Testes: novo `tests/unit/application/mensagem/enviar-mensagem-multiplos-canais.test.ts` (5 casos: paralelo com sucesso nos dois, sem e-mail cadastrado, falha só no whatsapp, falha só no e-mail, falha nos dois) substituiu a cobertura indireta que existia via os use cases; os 3 arquivos de teste dos use cases/notificador foram ajustados para esperar 2 registros de `MensagemEnviada` quando o cliente tem e-mail (antes esperavam 1, do canal que "venceu" o fallback) — suíte completa do projeto em 134 testes, todos verdes.
- Lint e typecheck (ambos tsconfigs) limpos; `npx prisma migrate status` sem pendências — **nenhuma migration nova**, porque `MensagemEnviada` já suportava múltiplos registros por `cobrancaId`+`tipo` desde sempre (não há constraint de unicidade ali); a dedup da régua de atraso (`existeParaCobrancaETipo`) continua correta sem mudança, pois já verificava só cobrança+tipo, não canal.
- **Não muda:** o `AsaasGateway` já criava a cobrança com `billingType: "UNDEFINED"`, então `linkPagamento` (o `invoiceUrl` da fatura Asaas) já contém boleto e QR Code PIX juntos numa página só — não foi necessário nenhuma mudança na integração com o Asaas nem nos templates de e-mail/WhatsApp para atender o pedido "enviar boleto/PIX por e-mail", só a política de quando o e-mail é disparado.
- **Não feito ainda:** anexar o PDF do boleto (ou o código PIX copia-e-cola em texto) diretamente no corpo do e-mail — avaliado como opção nesta conversa e descartado por decisão explícita do usuário em favor de só ajustar a política de envio; ficaria pra uma etapa futura se o link da fatura não for suficiente na prática.

### 2026-07-08 — Sprint 4 (parcial): backend do Dashboard (DASH) via TDD

- Único módulo do MVP v1 que ainda não tinha sido iniciado. Fecha DASH-01 a DASH-04 (`api/specs/dashboard/tasks.md`) só no backend — decisão explícita do usuário de deixar o frontend Next.js para uma etapa separada, e de modelar a leitura como porta própria em vez de estender o `CobrancaRepository` de escrita (ambas as decisões escolhidas entre alternativas apresentadas, ver seção 8):
  - `src/domain/cobranca/dashboard-cobranca-query.ts` — porta `DashboardCobrancaQuery` (`listar`, `calcularTotais`), tipos `FiltroDashboardCobranca`, `CobrancaDashboardItem`, `TotaisDashboard`
  - `src/application/cobranca/listar-cobrancas-dashboard-use-case.ts` — `ListarCobrancasDashboardUseCase`: recebe filtro opcional (`status`, `busca`, `mes`/`ano`), default mês/ano corrente calculado a partir de uma data de referência injetável (facilita teste), devolve `{ itens, totais }`
  - `src/infra/database/prisma-dashboard-cobranca-query.ts` — `PrismaDashboardCobrancaQuery`: `listar` via `findMany` com `include: { cliente: { select: { nome } } }` (join), filtro por intervalo do mês (`Date.UTC`, mesmo padrão de `existeParaCicloVigente`), `status` opcional e `busca` via `cliente.nome.contains` (`mode: insensitive`, DASH-R-04); `calcularTotais` via `groupBy(["status"])` + soma de `valor`, somando PENDENTE+ATRASADO para "a receber" (DASH-R-03)
  - `src/infra/http/routes/dashboard.ts` — `GET /dashboard/cobrancas`, query params opcionais `status`/`busca`/`mes`/`ano`, 400 se `status` não for um `StatusCobranca` válido; registrada em `src/infra/http/app.ts`
- Testes: 5 unitários novos (`tests/unit/application/cobranca/listar-cobrancas-dashboard-use-case.test.ts`, com `FakeDashboardCobrancaQuery` em memória, cobrindo default de mês/ano, filtro de status, busca por nome, totais e mês/ano explícito) + 5 de integração novos (`tests/integration/dashboard.test.ts`, banco Postgres real via `fastify.inject`, cobrindo DASH-R-01 a R-04 e o 400 de status inválido) — suíte completa do projeto em 128 testes, todos verdes.
- Lint e typecheck (ambos tsconfigs) limpos; `npx prisma migrate status` sem pendências (nenhuma migration nova — a leitura reaproveita o schema existente, só faz join).
- **Obstáculo de ambiente, não de código:** Docker Desktop não estava rodando no início desta etapa, então os 4 arquivos de teste de integração existentes falharam por falta de conexão com Postgres (`localhost:5433`) até o Docker terminar de inicializar — não era regressão; confirmado rodando a suíte de novo após `docker ps` mostrar os containers `cobracerta-postgres-1`/`cobracerta-redis-1` de pé.
- **Não feito ainda:** frontend Next.js do dashboard (DASH-01 previa "endpoint + frontend", só o endpoint foi feito nesta etapa); `MSG-05`/`COB-05` (painel de erros) podem agora reaproveitar este endpoint/módulo, mas ainda não foram conectados a ele. Com o backend do dashboard fechado, resta o frontend como única pendência de escopo do MVP v1 ainda não iniciada.

### 2026-07-08 — Troca do canal de e-mail: Gmail API/OAuth2 → Nodemailer/senha de app (via TDD)
- Decisão explícita do usuário (opção "substituir" escolhida entre as alternativas apresentadas): trocar a implementação de `CanalNotificacao` de `GmailNotificador` (Gmail API, OAuth2 com client id/secret/refresh token) para `NodemailerGmailNotificador` (biblioteca `nodemailer`, transport Gmail com usuário + senha de app), reaproveitando uma spec já validada em outro projeto (`api/specs/email-notification/`, incorporada em `api/specs/notificacoes-email/` e depois removida para não duplicar). Nenhuma das duas credenciais (OAuth2 ou senha de app) chegou a ser configurada em produção, então a troca não teve custo de migração de dado real:
  - `src/infra/gateways/nodemailer-gmail-notificador.ts` — `NodemailerGmailNotificador`, implementa a porta `CanalNotificacao` (sem mudança na interface) via `nodemailer.createTransport({ service: "gmail", auth: { user, pass } })` + `transporter.sendMail({ from, to, subject, html })`; `gmail-notificador.ts` (implementação OAuth2) deletado sem shim
  - `src/shared/config/env.ts` — `GMAIL_CLIENT_ID`/`GMAIL_CLIENT_SECRET`/`GMAIL_REFRESH_TOKEN` trocados por `GMAIL_USUARIO` (email) e `GMAIL_SENHA_APP`; `GMAIL_REMETENTE` mantido
  - `src/infra/queue/use-cases-factory.ts` (`criarDispararLembreteInicialUseCase`, `criarDispararReguaAtrasoUseCase`) e `src/infra/http/routes/webhook-asaas.ts` — os 3 pontos de instanciação trocados de `new GmailNotificador({...})` para `new NodemailerGmailNotificador({...})`
  - `.env.example`/`.env.test` — bloco Gmail atualizado para as 3 novas variáveis
  - `package.json` — `googleapis` removido, `nodemailer` + `@types/nodemailer` adicionados
  - `api/specs/notificacoes-email/{spec,rules,tasks}.md` — referências a Gmail API/OAuth2 (EMAIL-R-02, EMAIL-02, decisão técnica) reescritas para Nodemailer/senha de app
- Testes: 3 unitários novos (`tests/unit/infra/gateways/nodemailer-gmail-notificador.test.ts`, mock de `nodemailer.createTransport`, cobrindo criação do transporter, envio com campos corretos e propagação de erro) — suíte completa do projeto em 118 testes, todos verdes. Nenhum teste existente precisou mudar: todos os testes de comportamento de e-mail (use cases, `MensagemNotificadorConfirmacao`) já passavam pela porta `CanalNotificacao` com fake (`FakeCanalNotificacao`), nunca pela implementação concreta.
- Lint e typecheck (ambos tsconfigs) limpos; `npx prisma migrate status` sem pendências (nenhuma mudança de schema).
- **Escopo explicitamente não alterado:** a porta `CanalNotificacao`, os templates (`template-email.ts`, `template-confirmacao.ts`, texto simples em `<p>`) e o fluxo de fallback (`enviarMensagemComFallback`) continuam os mesmos — a spec trazida pelo usuário também sugeria um template HTML elaborado (visual dourado/preto), mas isso foi propositalmente deixado de fora por estar fora do pedido (só o transporte SMTP mudou).
- **Não feito ainda:** senha de app real do Gmail segue não configurada em `.env` (mesma situação de sempre com a credencial anterior, ver seção 6.1) — `NodemailerGmailNotificador` só foi validado contra mock/fake, nunca contra o Gmail real.

### 2026-07-08 — Wiring dos jobs BullMQ (geração de cobrança + régua de mensagens) via TDD
- Executa `api/specs/_geral/proximos-passos-jobs.md` de ponta a ponta: os use cases de negócio (Sprint 3) agora rodam de verdade em cron, não só via webhook HTTP. Duas decisões em aberto no documento foram resolvidas com o usuário antes de implementar: (1) `AsaasGateway` cria/busca customer no Asaas on-the-fly por `cpfCnpj`, sem novo campo em `Cliente`; (2) workers rodam no mesmo processo do Fastify, não em processo separado:
  - `src/domain/cobranca/gateway-pagamento.ts` — `CriarCobrancaGatewayInput` ganhou `nomeCliente`, `documentoCliente`, `emailCliente` (necessários pro Asaas criar/buscar o customer)
  - `src/infra/gateways/asaas-gateway.ts` — `AsaasGateway`, adapter HTTP direto (fetch, sem SDK, mesmo padrão de `EvolutionCanalMensagem`/`GmailNotificador`) contra `env.ASAAS_BASE_URL`: busca customer por `GET /customers?cpfCnpj=`, cria via `POST /customers` se não existir, depois `POST /payments` (header `access_token`, não `Authorization`, conforme a API real do Asaas)
  - `src/application/cobranca/gerar-cobranca-use-case.ts` — `executar()` passou de `Promise<void>` para `Promise<Cobranca[]>`, retornando as cobranças efetivamente criadas nesta execução (necessário pro job saber pra quais cobranças disparar o lembrete inicial, sem reprocessar as pendentes de execuções anteriores)
  - `src/infra/queue/redis-connection.ts` — `ConnectionOptions` do BullMQ a partir de `env.REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`
  - `src/infra/queue/use-cases-factory.ts` — `criarGerarCobrancaUseCase`/`criarDispararLembreteInicialUseCase`/`criarDispararReguaAtrasoUseCase`, centraliza a instanciação dos use cases com adapters reais (Prisma + `AsaasGateway`/`EvolutionCanalMensagem`/`GmailNotificador`), mesmo padrão de instanciação já usado em `webhook-asaas.ts`
  - `src/infra/queue/gerar-cobranca-job.ts` — `Queue`/`Worker`/`agendarGerarCobrancaJob` (via `queue.upsertJobScheduler`, cron `0 8 * * *`); o worker chama `GerarCobrancaUseCase.executar()` e, para cada `Cobranca` retornada, `DispararLembreteInicialUseCase.executar()`, isolando falha por cobrança (loga e segue, não derruba o worker)
  - `src/infra/queue/disparar-regua-atraso-job.ts` — mesmo padrão, cron `0 9 * * *`, chama `DispararReguaAtrasoUseCase.executar(new Date())`
  - `src/infra/queue/workers.ts` — `iniciarWorkers(logger)`, agenda os dois `JobScheduler`s e registra os workers com listener de `"failed"` pra log estruturado
  - `src/infra/http/server.ts` — chama `iniciarWorkers(app.log)` após `app.listen` resolver (workers no mesmo processo do Fastify, decisão explícita do usuário)
  - `src/shared/config/env.ts` — passou a chamar `dotenv.config()` (condicionado a `NODE_ENV !== "test"`); ver obstáculo abaixo
  - `.env` — `ASAAS_API_KEY` estava comentada (`#ASAAS_API_KEY=...`) atrás de uma variável solta (`Wallet_ID=`) que não existe em `env.ts`; corrigido para `ASAAS_API_KEY=` descomentada com o valor já fornecido pelo usuário
- Testes: 5 unitários novos de `AsaasGateway` (`tests/unit/infra/gateways/asaas-gateway.test.ts`, mock de `fetch`, cobrindo customer existente/novo e propagação de erro HTTP em cada etapa) + ajuste dos testes existentes de `GerarCobrancaUseCase` para o novo retorno — suíte completa do projeto em 115 testes, todos verdes.
- Lint e typecheck (ambos tsconfigs) limpos; `npx prisma migrate status` sem pendências (nenhuma migration nova — decisão de customer on-the-fly evitou mexer no schema).
- **Verificação end-to-end real (não só testes):** subiu `server.ts` de verdade contra o Postgres/Redis do `docker compose` local; `GET /health` respondeu OK e os dois `JobScheduler`s apareceram no Redis (`bull:gerar-cobranca:repeat*`, `bull:disparar-regua-atraso:repeat*`), confirmando que os crons foram agendados de verdade, não só que o código compila.
- **Obstáculo de infra descoberto e corrigido durante a verificação:** `env.ts` nunca chamou `dotenv.config()` — sempre leu `process.env` cru. Os testes nunca sentiram isso porque `tests/setup-env.ts` já carrega `.env.test` via `dotenv` antes da suíte. Mas `npm run dev`/`npm start` sempre falhariam no boot fora do Vitest, mesmo com `.env` preenchido — só apareceu ao subir o servidor de verdade pela primeira vez neste projeto. Ver seção 6.7.
- **`AsaasGateway` validado contra a sandbox real do Asaas** (não só mock de `fetch`), comparando com a documentação oficial (`docs.asaas.com/reference/comece-por-aqui`, `criar-novo-cliente`, `listar-clientes`, `criar-nova-cobranca`) e confirmando via `curl` direto contra `https://sandbox.asaas.com/api/v3`: header `access_token` correto; base URL do `.env` (`sandbox.asaas.com/api/v3`) é equivalente à documentada atualmente (`api-sandbox.asaas.com/v3`, mesmo backend, ambas responderam 200 aos mesmos testes) — não precisou trocar; `GET /customers?cpfCnpj=` retorna `{ data: [...] }` como esperado; `POST /customers` retorna `{ id: "cus_..." }`; `POST /payments` com `billingType: "UNDEFINED"` retorna `{ id: "pay_...", invoiceUrl: "https://sandbox.asaas.com/i/..." }`. Fluxo completo (criar customer → criar cobrança) testado e os registros de teste removidos da sandbox depois (`DELETE /payments/:id`, `DELETE /customers/:id`). Nenhuma mudança de código foi necessária — a implementação já estava correta.
- **Não feito ainda:** credenciais reais de Evolution API e Gmail seguem vazias em `.env` (mesma situação de sempre, ver seção 6.1); painel de erros no `dashboard` (MSG-05/COB-05, módulo não iniciado). Próximo passo natural: iniciar a Sprint 4 (dashboard) ou configurar credenciais reais de Evolution API/Gmail.

### 2026-07-08 — Sprint 3 (conclusão): módulo Notificações por E-mail (EMAIL) via TDD
- Terceiro e último módulo da Sprint 3 (PAG → MSG → EMAIL). Fecha EMAIL-01 a EMAIL-05 (`api/specs/notificacoes-email/tasks.md`) e, com isso, fecha a Sprint 3 inteira — inclusive revisita PAG-04 (disparo real de confirmação, antes pendente) e mantém MSG-05 parcial (painel de erros ainda depende do `dashboard`, não iniciado):
  - `src/domain/mensagem/canal-notificacao.ts` — porta `CanalNotificacao` (`enviarEmail`), sem qualquer referência a SDK/HTTP do Gmail
  - `src/domain/mensagem/mensagem-enviada.ts` — `MensagemEnviada` ganhou campo `canal` (`"whatsapp" | "email"`, default `"whatsapp"`), validado via Zod (schema `.default()`), com getter `canal`
  - `src/domain/mensagem/template-email.ts` — `montarEmailMensagem`, adapta `montarTextoMensagem` (LEMBRETE/VENCIMENTO/ATRASO) pro formato HTML básico (`<p>` + link `<a href>`), com assunto próprio por tipo
  - `src/domain/mensagem/template-confirmacao.ts` — `montarTextoConfirmacao`/`montarEmailConfirmacao`, template dedicado pro tipo CONFIRMACAO (fora do escopo de `template-mensagem.ts`/`template-email.ts` por decisão da Sprint 2)
  - `prisma/schema.prisma` — novo enum `CanalNotificacao` (`whatsapp`/`email`, mapeado `canal_notificacao`); `MensagemEnviada.canal` (`NOT NULL DEFAULT whatsapp`); migration `20260708190000_adiciona_canal_mensagem_enviada` (manual, ver seção 6.5 — tabela `mensagens_enviadas` vazia em dev/test, sem necessidade de backfill)
  - `src/infra/database/prisma-mensagem-enviada-repository.ts` — `salvar()` persiste `canal`
  - `src/infra/gateways/gmail-notificador.ts` — `GmailNotificador`, adapter via `googleapis` (`google.gmail({version: "v1"})`), autenticado com `google.auth.OAuth2` + refresh token (EMAIL-R-02); monta a mensagem manualmente em RFC 2822 e codifica em base64url antes de `users.messages.send` (ver seção 6.1)
  - `src/application/mensagem/enviar-mensagem-com-fallback.ts` — `enviarMensagemComFallback`, helper compartilhado pelos três pontos de disparo (lembrete, régua, confirmação): tenta `CanalMensagem`, cai pra `CanalNotificacao` só se `email` não for nulo (EMAIL-R-01, EMAIL-R-05), nunca lança (EMAIL-R-07), devolve `{ statusEnvio, canal }`
  - `src/application/mensagem/disparar-lembrete-inicial-use-case.ts` e `disparar-regua-atraso-use-case.ts` — passaram a receber `CanalNotificacao` no construtor e usar `enviarMensagemComFallback` em vez do try/catch direto contra `CanalMensagem`; `MensagemEnviada` agora registra o `canal` real usado
  - `src/infra/notificacoes/mensagem-notificador-confirmacao.ts` — `MensagemNotificadorConfirmacao`, implementa `NotificadorConfirmacao` (módulo `cobrancas`) reaproveitando `enviarMensagemComFallback`; registra `MensagemEnviada` tipo CONFIRMACAO; **substituiu** `LogNotificadorConfirmacao` (deletado, ficou morto) na rota `POST /webhooks/asaas`, fechando PAG-04 (EMAIL-R-04, reaproveita o toggle `CONFIRMACAO_PAGAMENTO_HABILITADA` do módulo `pagamentos`)
  - `env.ts`/`.env.example`/`.env`/`.env.test` — novas variáveis `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_REMETENTE`
  - `package.json` — nova dependência `googleapis`
- Testes: 18 unitários novos (2 de `template-email` + 2 de `template-confirmacao` + 2 de `canal` em `mensagem-enviada` + 6 de fallback nos use cases de lembrete/régua + 2 de `MensagemNotificadorConfirmacao` + demais ajustes) + 1 de integração novo (`canal` persistido/recuperado em `PrismaMensagemEnviadaRepository`) — suíte completa do projeto em 110 testes, todos verdes.
- Lint e typecheck (ambos tsconfigs) limpos; `npx prisma migrate status` sem pendências.
- **Obstáculo de infra resolvido durante o módulo:** dois arquivos de teste de integração (`webhook-asaas.test.ts`, `prisma-cobranca-repository.test.ts`) começaram a falhar com `Foreign key constraint violated on the constraint: mensagens_enviadas_cobranca_id_fkey` no `afterEach`, porque `MensagemNotificadorConfirmacao` agora grava `MensagemEnviada` de verdade e o `afterEach` apagava `cobranca` antes de `mensagemEnviada`. Corrigido adicionando `prisma.mensagemEnviada.deleteMany()` antes de `prisma.cobranca.deleteMany()` nesses dois arquivos (mesmo padrão já usado em `prisma-mensagem-enviada-repository.test.ts`).
- **Não feito ainda:** credenciais reais do Gmail (client id/secret, refresh token) — `GmailNotificador` só foi validado contra fake nos testes, nunca contra a API real (ver seção 6.1); job BullMQ dos crons de geração de cobrança e régua de mensagens (mesma situação de sempre, ver seção 4.4); wiring de `DispararLembreteInicialUseCase` a partir de `GerarCobrancaUseCase`; painel de erros no `dashboard` (MSG-05, módulo não iniciado). Com EMAIL fechado, a Sprint 3 está concluída — próximo passo natural é a Sprint 4 (dashboard) ou o wiring dos jobs BullMQ pendentes.

### 2026-07-08 — Sprint 3 (parcial): módulo Mensagens (MSG) via TDD
- Segundo módulo da Sprint 3, na ordem PAG → MSG → EMAIL. Fecha MSG-01 a MSG-04 (`api/specs/mensagens/tasks.md`); MSG-05 parcial (log via try/catch nos use cases, painel de erros fica pro módulo `dashboard`, não iniciado):
  - `src/domain/mensagem/mensagem-enviada.ts` — entidade `MensagemEnviada` (`criar()`/`restaurar()`), campos `cobrancaId`, `tipo` (LEMBRETE/VENCIMENTO/ATRASO/CONFIRMACAO), `statusEnvio` (ENVIADO/FALHA), `enviadoEm`
  - `src/domain/mensagem/mensagem-invalida-error.ts` — erro de domínio
  - `src/domain/mensagem/mensagem-enviada-repository.ts` — porta (`salvar`, `existeParaCobrancaETipo`, usada pra deduplicação)
  - `src/domain/mensagem/canal-mensagem.ts` — porta `CanalMensagem` (`enviarMensagem`), sem qualquer referência a SDK/HTTP da Evolution API
  - `src/domain/mensagem/template-mensagem.ts` — `montarTextoMensagem`, helper puro que monta o texto de LEMBRETE/VENCIMENTO/ATRASO com nome, valor, vencimento e link de pagamento (CONFIRMACAO fora de escopo deste helper, é do módulo `pagamentos`)
  - `src/domain/cobranca/cobranca-repository.ts` ganhou `listarPendentesOuAtrasadas` (fake + `PrismaCobrancaRepository`), necessário pra régua iterar só cobranças ainda não pagas/canceladas
  - `src/application/mensagem/disparar-lembrete-inicial-use-case.ts` — `DispararLembreteInicialUseCase` (MSG-01): dado uma `Cobranca`, busca o cliente e o `telefonePrincipal`, monta e envia LEMBRETE, registra `MensagemEnviada` com ENVIADO ou FALHA sem nunca lançar em caso de falha de envio (MSG-R-06)
  - `src/application/mensagem/disparar-regua-atraso-use-case.ts` — `DispararReguaAtrasoUseCase` (MSG-02/03/04): cron diário (ainda não agendado), lista cobranças PENDENTE/ATRASADO, calcula dias desde o vencimento (marcos fixos 0/+1/+3 — MSG-R-02/R-03), dispara VENCIMENTO ou ATRASO deduplicando por `MensagemEnviadaRepository.existeParaCobrancaETipo`, marca a cobrança como ATRASADA na transição D+1, nunca dispara para `PAGO`/`CANCELADO` (MSG-R-04) e isola falha de envio por cobrança sem interromper a fila (MSG-R-06)
  - `src/infra/database/prisma-mensagem-enviada-repository.ts` — implementação Prisma da porta `MensagemEnviadaRepository`
  - `src/infra/gateways/evolution-canal-mensagem.ts` — `EvolutionCanalMensagem`, adapter HTTP direto (fetch, sem SDK) contra a Evolution API (`POST /message/sendText/:instance`), usando as env vars `EVOLUTION_API_URL`/`EVOLUTION_API_KEY`/`EVOLUTION_INSTANCE` já existentes desde o esqueleto inicial
- Testes: 22 unitários (5 de entidade + 4 de template + 4 de `DispararLembreteInicialUseCase` + 9 de `DispararReguaAtrasoUseCase`, com fakes em memória) + 3 de integração (`tests/integration/prisma-mensagem-enviada-repository.test.ts`, banco Postgres real, cobrindo `PrismaMensagemEnviadaRepository` e `PrismaCobrancaRepository.listarPendentesOuAtrasadas`) — suíte completa do projeto em 95 testes, todos verdes.
- Lint e typecheck (ambos tsconfigs) limpos; `npx prisma migrate status` sem pendências — nenhuma migration nova necessária, a tabela `mensagens_enviadas` já existia desde o esqueleto inicial (Sprint 0) com o shape correto.
- **Não feito ainda:** job BullMQ que chama `DispararReguaAtrasoUseCase.executar()` num cron diário (mesma situação do job de `GerarCobrancaUseCase`, ver seção 4.4); wiring de `DispararLembreteInicialUseCase` a partir de `GerarCobrancaUseCase`/job de geração (use case pronto e testado isoladamente); painel de erros no `dashboard` (MSG-05, módulo não iniciado); disparo real de confirmação de pagamento (`ConfirmarPagamentoUseCase` do módulo PAG ainda usa `LogNotificadorConfirmacao`, trocar por um `NotificadorConfirmacao` que use `CanalMensagem`/`montarTextoMensagem` fica para depois). Módulos `notificacoes-email` e `dashboard` seguem não iniciados; ordem da Sprint 3 (PAG → MSG → EMAIL) segue, próximo é EMAIL.

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
