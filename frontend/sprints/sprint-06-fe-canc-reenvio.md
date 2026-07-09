# Sprint 6 — FE-CANC + FE-REENVIO (Frontend: Cancelamento e Reenvio Manual)

> Status: não iniciada
> Depende de: [Sprint 5 — FE-AVULSA](sprint-05-fe-avulsa.md), [Sprint 8 — Cancelamento e Reenvio](../../api/sprints/sprint-08-cancelamento-reenvio.md) (backend)
> Specs de referência: `api/specs/cancelamento-cobranca/spec.md`, `api/specs/reenvio-mensagem/spec.md`

## Objetivo

Adicionar ao detalhe da cobrança (FE-DASH) as duas ações que os specs de backend já
prometiam: cancelar a cobrança e reenviar uma mensagem que falhou.

## Tasks

- [ ] Camada de API: `cancelarCobranca(id)`, `reenviarMensagem(cobrancaId, mensagemId)` em `lib/api/cobrancas.ts`
- [ ] Botão "Cancelar cobrança" no detalhe (`app/(autenticado)/dashboard/cobrancas/[id]/page.tsx`), com confirmação antes de executar, desabilitado se já `PAGO`/`CANCELADO`
- [ ] Botão "Reenviar" ao lado de cada item `FALHA` no histórico de mensagens do mesmo detalhe

## Critérios de conclusão da sprint

- [ ] Lint e typecheck limpos
- [ ] Validado ponta a ponta no navegador (Playwright): cancelar uma cobrança `PENDENTE` e ver o status mudar; reenviar uma mensagem `FALHA` e ver o novo registro `ENVIADO` aparecer sem perder o histórico anterior

## Próxima sprint

Nenhuma sprint de frontend planejada além desta nesta rodada. Com FE-ONB, FE-AVULSA e
FE-CANC/FE-REENVIO fechados, o frontend cobre os gaps 🔴 identificados na Análise de Gaps que
tinham componente de interface. Próximo passo natural: revisão de escopo do MVP v2.
