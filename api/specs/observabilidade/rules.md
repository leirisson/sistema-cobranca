# Regras — Observabilidade Operacional (OBS)

> Regras específicas deste módulo. Regras técnicas transversais (stack, DDD, pastas) estão em `api/specs/_geral/rules.md`.

## Decisão técnica: reaproveitar canais de mensagem já existentes

- `AlertaOperacionalService` não é um canal novo — usa `CanalMensagem`/`CanalNotificacao` (WhatsApp/e-mail) já implementados pelo módulo `mensagens`, endereçando ao próprio usuário do sistema (via `ALERTA_OPERACIONAL_DESTINO`), não a um cliente
- Sem novo SDK, sem novo adapter de infra

## Decisão técnica: alerta é best-effort, nunca bloqueante

- O listener `"failed"` do BullMQ já loga (implementado, `claude.md` seção 5); o alerta é uma ação adicional, com seu próprio `try/catch` isolado — uma falha ao notificar nunca deve mascarar ou interromper o tratamento da falha original do job

## Invariantes

- Ausência de `ALERTA_OPERACIONAL_DESTINO` nunca quebra o boot nem o worker — só desativa o alerta, mantendo só o log
- Alerta nunca lança exceção não tratada

## Fora de escopo

- Dashboard de métricas
- Sentry/Datadog
- Alerta por mensagem individual (isso é `reenvio-mensagem`)
