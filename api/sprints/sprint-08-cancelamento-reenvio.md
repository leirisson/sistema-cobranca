# Sprint 8 — Cancelamento de Cobrança (CANC) + Reenvio Manual de Mensagem (REENVIO)

> Status: não iniciada
> Depende de: [Sprint 7 — Cobrança Avulsa](sprint-07-cobranca-avulsa.md)
> Specs de referência: `api/specs/cancelamento-cobranca/{spec,rules,tasks}.md`, `api/specs/reenvio-mensagem/{spec,rules,tasks}.md`

## Objetivo

Fechar duas promessas pequenas que os próprios specs já tinham feito e nunca foram
implementadas na interface: cancelar uma cobrança pela tela (`Cobranca.cancelar()` já existe
no domínio desde o setup inicial) e reenviar manualmente uma mensagem que falhou (MSG-US-04
já promete isso). Agrupados numa sprint só por serem pequenos e os dois tocarem o mesmo
módulo de tela (FE-DASH) — cada um mantém seu próprio módulo de spec.

## Tasks

### Cancelamento (CANC)
- [ ] CANC-01 — `GatewayPagamento.cancelarCobranca`, implementado em `AsaasGateway`
- [ ] CANC-02 — `CancelarCobrancaUseCase`
- [ ] CANC-03 — Endpoint de cancelamento
- [ ] CANC-04 — Teste de regressão de `listarPendentesOuAtrasadas`
- [ ] CANC-05 (frontend) — Botão "Cancelar cobrança" no FE-DASH

### Reenvio manual (REENVIO)
- [ ] REENVIO-01 — `ReenviarMensagemUseCase`
- [ ] REENVIO-02 — Endpoint de reenvio
- [ ] REENVIO-03 (frontend) — Botão "Reenviar" no histórico de mensagens do FE-DASH

## Critérios de conclusão da sprint

- [ ] Todas as tasks CANC-01 a CANC-05 e REENVIO-01 a REENVIO-03 concluídas
- [ ] Teste confirmando que cobrança `PAGO` não pode ser cancelada nem ter mensagem reenviada
- [ ] Teste confirmando que falha ao cancelar no gateway não bloqueia o cancelamento local (CANC-R-04)
- [ ] `contrato-api/endpoints.md` atualizado com as duas rotas novas
- [ ] Checklist do `claude.md` (seção 7.2) validado
- [ ] `api/specs/cancelamento-cobranca/tasks.md` e `api/specs/reenvio-mensagem/tasks.md` com os checkboxes marcados

## Próxima sprint

[Sprint 9 — Segurança da API e LGPD](sprint-09-seguranca-lgpd.md).
