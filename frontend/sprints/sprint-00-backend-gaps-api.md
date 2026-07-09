# Sprint 0 — Backend: fecha gaps de API para o frontend

> Status: concluída (2026-07-09)
> Depende de: nenhuma (backend já tem os módulos `clientes`, `cobrancas`, `dashboard` implementados — falta só expor/criar o que o frontend precisa)
> Specs de referência: `frontend/specs/07-frontend-autenticacao/design.md` §5, `frontend/specs/08-frontend-gestao-clientes/design.md` §4

## Objetivo

Fechar, no backend (`api/`), os dois gaps de API bloqueantes identificados na fase
DESIGN do frontend — sem eles, `FE-AUTH` e `FE-CAD` não têm o que consumir.
`FE-DASH` não depende desta sprint (`GET /dashboard/cobrancas` já existe), mas
a rota final protegida por auth só fecha depois que a Task AUTH-04 desta sprint
existir.

## Tasks

### Autenticação (bloqueia Sprint 1 — FE-AUTH)

- [x] AUTH-01 — Model `Usuario` no Prisma (`id`, `email` único, `senhaHash`), migration. Single-tenant: usuário único, criado via seed manual (sem tela de cadastro).
- [x] AUTH-02 — Hash de senha (bcrypt ou argon2) + seed script para criar o usuário inicial a partir de env vars ou argumento de CLI.
- [x] AUTH-03 — `POST /auth/login`: recebe `{ email, senha }`, valida contra `Usuario`, devolve `200 { token }` (JWT, expiração sugerida 7 dias) ou `401` com mensagem genérica (nunca diferenciar "e-mail não existe" de "senha errada").
- [x] AUTH-04 — Middleware/plugin Fastify que valida `Authorization: Bearer <token>` e protege as rotas que hoje estão abertas (`/dashboard/cobrancas`) e as que serão criadas nesta sprint (`/clientes*`). `/health` e `/auth/login` continuam públicas.

### Clientes — rotas HTTP (bloqueia Sprint 2 — FE-CAD)

- [x] CAD-HTTP-01 — `ListarClientesUseCase` (filtro combinado `busca` + `status`, reaproveitando `listarAtivos`/`buscarPorNome` do repositório) + rota `GET /clientes`.
- [x] CAD-HTTP-02 — Rota `POST /clientes` expondo `CriarClienteUseCase` (`201 ClienteDTO` ou `400` com erro de validação estruturado — campo + mensagem, não stack trace).
- [x] CAD-HTTP-03 — Rota `PUT /clientes/:id` expondo `EditarClienteUseCase` (mesmo tratamento de erro de CAD-HTTP-02, mais `404` se o cliente não existir).
- [x] CAD-HTTP-04 — `ReativarClienteUseCase` (não existe ainda — só inativar foi implementado) + rota `PATCH /clientes/:id/status` cobrindo os dois sentidos (`ATIVO`/`INATIVO`).
- [x] CAD-HTTP-05 — Rota `GET /clientes/:id` expondo `buscarPorId` do repositório (`200 ClienteDTO` ou `404`), usada pelo pré-preenchimento do formulário de edição.

## Critérios de conclusão da sprint

- [x] Todas as tasks AUTH-01 a AUTH-04 e CAD-HTTP-01 a CAD-HTTP-05 concluídas
- [x] `/dashboard/cobrancas` e todas as rotas `/clientes*` exigem `Authorization: Bearer <token>` válido (401 sem ele)
- [x] `POST /auth/login` validado com usuário seed real (não só mock em teste)
- [x] Testes de integração cobrindo as novas rotas (padrão `fastify.inject`, mesmo estilo do resto do projeto)
- [x] Checklist do `claude.md` (raiz do repo, seção 7.2) validado
- [x] `claude.md` atualizado: novo model `Usuario`, novas rotas na seção 4.3, decisão de JWT/expiração na seção 8 (ADR)

## Após esta sprint

Gaps de API resolvidos — Sprint 1 (FE-AUTH) pode começar sem bloqueio.
