# Observabilidade Operacional
`spec.md` — fase SPECIFY

**ID do módulo:** `OBS`
**Escopo:** Small
**Depende de:** `cobrancas` (COB, job diário), `mensagens` (MSG, régua diária)

## Contexto

Identificado na Análise de Gaps (`api/SistemaDeCobrançaAutomática.md`, gap 8): se o job
diário de geração de cobrança falhar silenciosamente (Redis fora do ar, erro não tratado),
hoje ninguém percebe. Não existe alerta operacional, nem que seja simples (ex: notificação
no próprio WhatsApp do usuário quando um job crítico falha).

## Capturar o quê

### User Stories

**OBS-US-01 (P2)** — Como usuário do sistema, quero ser avisado quando o job diário de
geração de cobrança ou a régua de mensagens falhar completamente, para poder agir antes que
isso afete meus clientes (cobrança não gerada, lembrete não enviado).

### Requisitos (WHEN / THEN / SHALL)

- **OBS-R-01**: WHEN o worker do job de geração de cobrança (`gerar-cobranca-job.ts`) ou da régua de atraso (`disparar-regua-atraso-job.ts`) emite o evento `"failed"` do BullMQ, THEN o sistema SHALL, além de logar (já implementado, ver `claude.md` seção 5, padrão 6), disparar uma notificação para um canal de alerta configurado.
- **OBS-R-02**: WHEN não há canal de alerta configurado (env var ausente), THEN o sistema SHALL apenas logar (comportamento atual), nunca quebrar o worker por falta de configuração de alerta.
- **OBS-R-03**: WHEN um alerta é disparado, THEN a mensagem SHALL identificar qual job falhou e o horário, sem precisar que o usuário abra o log do servidor para saber o que aconteceu.
- **OBS-R-04**: IF o próprio envio do alerta falhar (ex: WhatsApp indisponível), THEN o sistema SHALL NOT lançar exceção que interrompa o processamento do worker — o alerta é best-effort, a falha do job original já foi logada de qualquer forma.

### IDs de rastreabilidade

| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| OBS-01 | OBS-US-01 | OBS-R-01, OBS-R-03 | `AlertaOperacionalService` (ou similar), reaproveita `CanalMensagem`/`CanalNotificacao` já existentes para enviar ao número/e-mail do próprio usuário |
| OBS-02 | OBS-US-01 | OBS-R-02, OBS-R-04 | Nova env var opcional `ALERTA_OPERACIONAL_DESTINO` (telefone ou e-mail do usuário), fallback silencioso se ausente |

## Fora de escopo deste módulo

- Dashboard de observabilidade (métricas, uptime) — v2, monitoramento simples via alerta pontual é suficiente para o MVP v1 single-tenant
- Integração com ferramenta de terceiros (Sentry, Datadog) — avaliar quando o volume justificar
- Alerta para falha de mensagem individual (isso já é coberto por `reenvio-mensagem`, que é por cobrança) — este módulo é só sobre falha do job/worker inteiro
