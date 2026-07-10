# Sprint 6 — FE-CANC + FE-REENVIO (Frontend: Cancelamento e Reenvio Manual)

> Status: concluída (implementada fora de ordem, junto do backend CANC/REENVIO na Sprint 8 — ver nota abaixo)
> Depende de: [Sprint 5 — FE-AVULSA](sprint-05-fe-avulsa.md), [Sprint 8 — Cancelamento e Reenvio](../../api/sprints/sprint-08-cancelamento-reenvio.md) (backend)
> Specs de referência: `api/specs/cancelamento-cobranca/spec.md`, `api/specs/reenvio-mensagem/spec.md`

## Objetivo

Adicionar ao detalhe da cobrança (FE-DASH) as duas ações que os specs de backend já
prometiam: cancelar a cobrança e reenviar uma mensagem que falhou.

## Nota de auditoria (2026-07-10)

Uma auditoria do estado real do frontend (não do status desta sprint) encontrou que todas as
tasks abaixo já estavam implementadas — junto com o backend do módulo CANC/REENVIO, na mesma
etapa em que a Sprint 8 de backend foi fechada (`claude.md`, linha do tempo, entrada "Sprint 8:
Cancelamento de Cobrança + Reenvio Manual de Mensagem"). O status desta sprint nunca foi
atualizado quando o trabalho foi feito — mesmo padrão de desalinhamento já visto antes na
Sprint 5/FE-AVULSA e na Sprint 4/FE-ONB. Corrigido nesta data, sem nenhuma mudança de código.

## Tasks

- [x] Camada de API: `cancelarCobranca(id)`, `reenviarMensagem(cobrancaId, mensagemId)` em `lib/api/cobrancas.ts`
- [x] Botão "Cancelar cobrança" no detalhe — `components/detalhe-cobranca.tsx` (extraído do que antes era código inline em `app/(autenticado)/dashboard/cobrancas/[id]/page.tsx`, que virou Server Component puro + wrapper): confirmação inline antes de executar (sem `window.confirm`), some quando a cobrança não está `PENDENTE`/`ATRASADO`
- [x] Botão "Reenviar" ao lado de cada item `FALHA` no histórico de mensagens — mesmo componente `detalhe-cobranca.tsx`, estado "Reenviando…", some quando a cobrança está `PAGO`/`CANCELADO`

## Critérios de conclusão da sprint

- [x] Lint e typecheck limpos
- [x] Validado ponta a ponta no navegador (Playwright, servidor dev real + Postgres real + Evolution API local real + sandbox Asaas real + Gmail real): cancelamento mudou o badge para `CANCELADO` e confirmado via `GET` direto na sandbox do Asaas que o payment ficou `"deleted": true` de verdade; reenvio de mensagem `FALHA` real (cliente sem e-mail cadastrado) gerou novo registro `ENVIADO` após corrigir o cliente, mantendo o `FALHA` original intacto no histórico

## Próxima sprint

Nenhuma sprint de frontend planejada além desta nesta rodada. Com FE-ONB, FE-AVULSA e
FE-CANC/FE-REENVIO fechados, o frontend cobre os gaps 🔴 identificados na Análise de Gaps que
tinham componente de interface. Próximo passo natural: tela para `GET /dashboard/erros`
(COB-05/MSG-05, fechados no backend na Sprint 10 de Observabilidade — ver `api/claude.md`),
ainda sem nenhuma cobertura de frontend; revisão de escopo do MVP v2.
