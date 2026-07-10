# Regras — Observabilidade Operacional (OBS)

> Regras específicas deste módulo. Regras técnicas transversais (stack, DDD, pastas) estão em `api/specs/_geral/rules.md`.

## Decisão técnica: reaproveitar canais de mensagem já existentes

- `AlertaOperacionalService` não é um canal novo — usa `CanalMensagem`/`CanalNotificacao` (WhatsApp/e-mail) já implementados pelo módulo `mensagens`, endereçando ao próprio usuário do sistema (via `ALERTA_OPERACIONAL_DESTINO`), não a um cliente
- Sem novo SDK, sem novo adapter de infra

## Decisão técnica: canal escolhido por formato do destino

- `ALERTA_OPERACIONAL_DESTINO` é um único campo (não dois): se contém `@`, o serviço usa `CanalNotificacao` (e-mail); senão, assume telefone E.164 e usa `CanalMensagem` (WhatsApp) — decisão explícita do usuário (opção escolhida entre "detectar pelo formato" vs. "sempre e-mail" vs. "sempre WhatsApp"), evita configuração extra (ex: uma segunda env var `ALERTA_OPERACIONAL_CANAL`)

## Decisão técnica: remetente Gmail dedicado ao alerta, separado do Gmail de cobrança

- E-mail de alerta operacional (para o dono do sistema) e e-mail de cobrança (para o cliente) são conceitualmente 2 tipos de e-mail diferentes — decisão explícita do usuário: não devem sair do mesmo remetente Gmail
- Novas env vars opcionais `ALERTA_GMAIL_USUARIO`/`ALERTA_GMAIL_SENHA_APP`/`ALERTA_GMAIL_REMETENTE`; `criarAlertaOperacionalService()` (`use-cases-factory.ts`) monta um `NodemailerGmailNotificador` próprio com esses valores, caindo para `GMAIL_USUARIO`/`GMAIL_SENHA_APP`/`GMAIL_REMETENTE` (o Gmail de cobrança) se qualquer um dos três estiver ausente — evita obrigar uma segunda conta Gmail configurada só para quem usa WhatsApp como canal de alerta
- Nenhuma mudança em `AlertaOperacionalService`/`NodemailerGmailNotificador`: a separação de remetente é inteiramente uma decisão de composição na factory, mesmo padrão já usado nas outras factories de `use-cases-factory.ts`
- **Pendência real:** segunda conta Gmail com senha de app ainda não configurada em `.env` — `ALERTA_GMAIL_*` vazias por padrão, o alerta usa o Gmail de cobrança como remetente até essa credencial existir

## Decisão técnica: alerta é best-effort, nunca bloqueante

- O listener `"failed"` do BullMQ já loga (implementado, `claude.md` seção 5); o alerta é uma ação adicional, com seu próprio `try/catch` isolado — uma falha ao notificar nunca deve mascarar ou interromper o tratamento da falha original do job

## Invariantes

- Ausência de `ALERTA_OPERACIONAL_DESTINO` nunca quebra o boot nem o worker — só desativa o alerta, mantendo só o log
- Alerta nunca lança exceção não tratada

## Fora de escopo

- Dashboard de métricas
- Sentry/Datadog
- Alerta por mensagem individual (isso é `reenvio-mensagem`)
