# Regras Gerais do Projeto (CobraCerta)

> Regras técnicas transversais, válidas para todos os módulos em `api/specs/`.
> Regras específicas de um módulo ficam no `rules.md` daquele módulo, não aqui.

## 1. Stack do projeto

### Linguagem e runtime
- **TypeScript** — tipagem estática em todo o backend
- **Node.js** (LTS) — runtime

### Framework HTTP
- **Fastify** — servidor HTTP, escolhido pela performance e ecossistema de plugins

### Containerização
- **Docker** / **Docker Compose** — sobe Postgres e Redis localmente em dev, com paridade próxima da produção; facilita deploy no Easypanel

### Banco de dados
- **PostgreSQL** — banco relacional principal
- **Prisma** — ORM (schema declarativo, migrations, client tipado)

### Fila e agendamento
- **BullMQ** — jobs agendados (geração de cobrança, disparo de lembretes) e filas com retry
- **Redis** — backend de fila do BullMQ

### Validação
- **Zod** — validação de variáveis de ambiente e de entrada dos use cases

### Testes (TDD)
- **Vitest** — test runner (unit e integration)
- **@vitest/coverage-v8** — cobertura, focada em `domain/` e `application/`

### Integrações externas
- **Asaas** — gateway de pagamento (boleto + PIX), via HTTP direto (fetch), sem SDK de terceiros
- **Evolution API** — envio de mensagens WhatsApp
- **Gmail API** (via `googleapis`) — envio de e-mail (módulo `notificacoes-email`), autenticado por OAuth2

### Observabilidade
- **Pino** — logger estruturado, integrado ao Fastify

### Frontend (dashboard)
- **Next.js** — interface do dashboard (módulo `dashboard`)

### Ferramentas de desenvolvimento
- **tsx** — execução do TypeScript em modo watch
- **ESLint** — padronização e lint de código

## 2. Variáveis de ambiente

- Centralizadas em um único ponto de validação (não espalhadas em `process.env.X`)
- Validação com **Zod**: variável obrigatória faltando derruba o boot com erro claro
- `.env.example` versionado, documentando toda variável esperada
- Separação por ambiente: `development`, `test`, `production`

| Variável | Propósito |
|---|---|
| `NODE_ENV` | ambiente de execução |
| `PORT` | porta do servidor Fastify |
| `DATABASE_URL` | conexão com PostgreSQL |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | conexão com Redis (BullMQ) |
| `ASAAS_API_KEY` | autenticação com o gateway |
| `ASAAS_BASE_URL` | endpoint (sandbox vs produção) |
| `ASAAS_WEBHOOK_TOKEN` | validação de autenticidade do webhook recebido |
| `EVOLUTION_API_URL` / `EVOLUTION_API_KEY` / `EVOLUTION_INSTANCE` | integração WhatsApp |
| `COBRANCA_ANTECEDENCIA_DIAS` | dias antes do vencimento pra gerar cobrança |

## 3. Banco de dados

- **PostgreSQL** via Docker Compose em dev
- **Prisma** como ORM: schema declarativo, migrations versionadas, client tipado
- Banco isolado por contexto: um para dev, outro para test suite
- Tabelas em snake_case no banco físico; models/entidades em PascalCase/camelCase (`@map`/`@@map`)
- Índices previstos desde o schema inicial: `cliente_id` e `status` na tabela de cobranças

## 4. Gateway de pagamento

- Gateway do MVP v1: **Asaas** (boleto + PIX, webhook simples)
- Sandbox obrigatório antes de qualquer teste com dinheiro real
- **Princípio de isolamento:** a aplicação nunca depende diretamente do SDK/HTTP do Asaas nas regras de negócio — existe uma porta própria ("o que um gateway de pagamento faz"); Asaas é apenas uma implementação
- Trocar de gateway no futuro = nova implementação da mesma interface, sem alterar regra de negócio
- Webhook protegido por token compartilhado (variável de ambiente)

## 5. Estrutura de pastas (DDD)

Domínio não depende de framework, ORM ou biblioteca de terceiros. Dependência sempre aponta pra dentro: infra depende de domínio, domínio não depende de nada.

```
src/
  domain/           → regras de negócio puras (entidades, value objects, portas)
    cliente/
    cobranca/
    shared/
  application/       → casos de uso (orquestram entidades + portas)
    cliente/
    cobranca/
  infra/             → detalhe técnico substituível
    database/        → repositórios (Prisma)
    gateways/         → integrações externas (Asaas)
    http/             → servidor Fastify, rotas, plugins
    queue/            → jobs agendados (BullMQ)
  shared/
    config/           → validação de variáveis de ambiente
    errors/           → erros compartilhados
tests/
  unit/               → testes de domínio e casos de uso
  integration/        → testes que tocam banco/gateway real (sandbox) ou em memória
```

## 6. TDD — como aplicar

- Teste antes da implementação sempre que a lógica envolver regra de negócio
- Testes de **domínio** e **application** não dependem de banco real — usam fakes/em memória
- Testes de **infra** ficam em `tests/integration`, rodados com menos frequência
- Cobertura focada em `domain/` e `application/`

## 7. DDD — convenções

- Entidades protegem suas próprias invariantes (ex: uma cobrança não pode ir de "paga" direto pra "pendente")
- Toda comunicação com sistema externo passa por uma porta no domínio, implementada na infra (adapter)
- Use cases fazem uma coisa só, nome de verbo + substantivo (ex: `CriarCliente`, `GerarCobranca`)

## 8. Clean code

- Nomes em português nas regras de negócio (domínio reflete linguagem do cliente), nomes técnicos genéricos em inglês (`Repository`, `UseCase`)
- Funções pequenas, uma responsabilidade por função
- Nenhuma regra de negócio dentro de rota HTTP — rota só recebe requisição, chama use case, formata resposta
- Erros de domínio são classes próprias (ex: `ClienteInvalidoError`), não `Error` genérico

## 9. Convenção de IDs de rastreabilidade

Cada requisito e user story tem um ID único no formato `<MODULO>-<TIPO>-<NUMERO>` (ex: `CAD-US-01`, `COB-R-03`), permitindo rastrear de spec → rules → tasks → commit.

## 10. Módulos e ordem de dependência

```
clientes              (CAD)   → base, sem dependência
        ↓
cobrancas              (COB)   → depende de CAD
        ↓
mensagens              (MSG)   → depende de COB
        ↓
        ├── notificacoes-email (EMAIL) → depende de COB, MSG (canal complementar/fallback)
        ↓
pagamentos             (PAG)   → depende de COB, MSG (+ EMAIL para confirmação)
        ↓
dashboard              (DASH)  → depende de CAD, COB, PAG
```

| Módulo | ID | Sprint (referência: sprints-mvp-v1.md) |
|---|---|---|
| clientes | CAD | Sprint 1 |
| cobrancas | COB | Sprint 2 |
| mensagens | MSG | Sprint 3 |
| notificacoes-email | EMAIL | Sprint 3 |
| pagamentos | PAG | Sprint 3 |
| dashboard | DASH | Sprint 4 |
