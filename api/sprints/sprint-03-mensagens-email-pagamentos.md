# Sprint 3 — Mensagens (MSG) + Notificações por E-mail (EMAIL) + Pagamentos (PAG)

> Status: concluída — PAG, MSG e EMAIL implementados via TDD
> Depende de: [Sprint 2 — Cobranças](sprint-02-cobrancas.md) (`Cobranca` precisa existir para disparar mensagem/confirmar pagamento)
> Specs de referência:
> - `api/specs/mensagens/spec.md`, `rules.md`, `tasks.md`
> - `api/specs/notificacoes-email/spec.md`, `rules.md`, `tasks.md`
> - `api/specs/pagamentos/spec.md`, `rules.md`, `tasks.md`

## Objetivo

Fechar o ciclo de comunicação com o cliente: régua de lembretes via WhatsApp (Evolution API), fallback por e-mail (Gmail API) e confirmação automática de pagamento via webhook do Asaas.

Os três módulos foram agrupados na mesma sprint porque são interdependentes (EMAIL é fallback de MSG; PAG dispara confirmação via MSG) e nenhum entrega valor sozinho sem os outros dois.

## Ordem sugerida dentro da sprint

1. **PAG** primeiro — webhook de pagamento é o gatilho que os outros dois módulos consomem
2. **MSG** em seguida — régua de lembrete/atraso, mais o disparo de confirmação
3. **EMAIL** por último — fallback, depende da lógica de disparo do MSG já existir

## Tasks — Pagamentos (PAG)

- [x] PAG-01 — Implementar endpoint de webhook + `Cobranca.marcarComoPaga`
- [x] PAG-02 — Implementar validação de `ASAAS_WEBHOOK_TOKEN`
- [x] PAG-03 — Implementar máquina de estados da entidade `Cobranca`
- [x] PAG-04 — Toggle de confirmação + disparo real via `MensagemNotificadorConfirmacao` (WhatsApp com fallback e-mail)

## Tasks — Mensagens (MSG)

- [x] MSG-01 — Implementar template de lembrete + `DispararLembreteInicialUseCase`
- [x] MSG-02 — Implementar régua fixa (D0, D+1, D+3)
- [x] MSG-03 — Implementar checagem de status antes do disparo
- [x] MSG-04 — Implementar entidade/tabela `MensagemEnviada`
- [x] MSG-05 — Log estruturado via Pino (try/catch nos use cases) + painel de erros no `dashboard` (`GET /dashboard/erros`, `listarMensagensComFalha`); fechado na Sprint 10 (Observabilidade), junto de COB-05, ver `sprint-10-observabilidade.md`

## Tasks — Notificações por E-mail (EMAIL)

- [x] EMAIL-01 — Implementar porta `CanalNotificacao` e adapter `GmailNotificador`
- [x] EMAIL-02 — Configurar OAuth2 Gmail (credenciais em variável de ambiente/secret)
- [x] EMAIL-03 — Reaproveitar toggle de confirmação do módulo `pagamentos`
- [x] EMAIL-04 — Implementar lógica de fallback no disparo de mensagens (módulo `mensagens`)
- [x] EMAIL-05 — Adicionar campo `canal` em `MensagemEnviada` + log estruturado

## Critérios de conclusão da sprint

- [x] Todas as tasks PAG-01 a PAG-04, MSG-01 a MSG-05 e EMAIL-01 a EMAIL-05 concluídas
- [x] Máquina de estados de `Cobranca` impede transição inválida (ex: paga → pendente)
- [x] Webhook do Asaas validado por token antes de processar (`ASAAS_WEBHOOK_TOKEN`)
- [x] Régua fixa (lembrete, vencimento, D+1, D+3) disparando nos prazos corretos em teste de integração
- [x] Fallback de e-mail testado com toggle ligado/desligado
- [x] Checklist do `claude.md` (seção 7.2) validado
- [x] `tasks.md` de `pagamentos`, `mensagens` e `notificacoes-email` com os checkboxes marcados

## Próxima sprint

[Sprint 4 — Dashboard](sprint-04-dashboard.md), que depende de `Cliente`, `Cobranca` e `Pagamentos` já existirem.
