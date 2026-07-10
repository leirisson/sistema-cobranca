# Sprint 7 — FE-OBS (Frontend: Painel de Erros Operacionais)

> Status: concluída
> Depende de: [Sprint 6 — FE-CANC + FE-REENVIO](sprint-06-fe-canc-reenvio.md), [Sprint 10 — Observabilidade](../../api/sprints/sprint-10-observabilidade.md) (backend, `GET /dashboard/erros` precisa existir)
> Specs de referência: `api/specs/observabilidade/spec.md`, `api/specs/cobrancas/spec.md` (COB-05), `api/specs/mensagens/spec.md` (MSG-05)

## Objetivo

Tela `/erros`: expõe as cobranças que não puderam ser geradas por falha do gateway
(COB-05) e as mensagens que falharam ao enviar (MSG-05), últimos 20 registros de cada — o
único endpoint do backend que ainda não tinha nenhuma cobertura de frontend, confirmado por
auditoria de código em 2026-07-10.

## Tasks

- [x] Camada de API: `buscarErrosOperacionais()` em `lib/api/cobrancas.ts`, tipos `ErroGeracaoCobrancaItem`/`MensagemComFalhaItem`/`ErrosOperacionais`
- [x] `components/tabela-erros-geracao-cobranca.tsx` — cliente, mensagem de erro, data/hora; estado vazio próprio
- [x] `components/tabela-mensagens-com-falha.tsx` — cliente (linkado ao detalhe da cobrança em `/dashboard/cobrancas/:id`), tipo, canal, data/hora; estado vazio próprio
- [x] Rota `app/(autenticado)/erros/page.tsx` (Server Component, sem filtro/paginação — a API já limita a 20 mais recentes de cada lista)
- [x] Link "Erros" na sidebar (`components/sidebar.tsx`)

## Critérios de conclusão da sprint

- [x] Lint e typecheck limpos
- [x] Validado ponta a ponta no navegador (Playwright, servidor dev real + Postgres real): registro de teste em `erros_geracao_cobranca` aparece na primeira tabela; `MensagemEnviada` `FALHA` real aparece na segunda, com link clicável para `/dashboard/cobrancas/:id` que carrega o detalhe correto; estado vazio validado na tabela sem dados. Dados de teste removidos do Postgres ao final.
- [x] Sem sessão, `/erros` redireciona para `/login` (herda a proteção do layout `app/(autenticado)/layout.tsx`, mesmo padrão das demais rotas autenticadas — não precisou de checagem própria)

## Próxima sprint

Nenhuma sprint de frontend planejada além desta. Com FE-OBS fechada, todos os 19 endpoints
do backend (10 módulos) têm cobertura de frontend — MVP v1 e todos os gaps da Análise de
Gaps de 2026-07-09 estão implementados dos dois lados. Próximo passo natural: revisão de
escopo do MVP v2.
