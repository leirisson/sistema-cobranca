# Reenvio Manual de Mensagem
`spec.md` — fase SPECIFY

**ID do módulo:** `REENVIO`
**Escopo:** Small
**Depende de:** `mensagens` (MSG), `dashboard` (DASH/FE-DASH)

## Contexto

Identificado na Análise de Gaps (`api/SistemaDeCobrançaAutomática.md`, gap 3): o módulo MSG
promete essa capacidade explicitamente (MSG-US-04: "quero saber quando um envio falhou...
para poder agir manualmente") e o painel de erros é citado como dependência em MSG-05 e
COB-05. Mas nenhuma tela do frontend implementa a ação de reenviar — o FE-DASH até menciona
a possibilidade e marca como fora de escopo. Isso é uma contradição entre módulos: o backend
promete visibilidade de erro (`MensagemEnviada.statusEnvio = "FALHA"` já é persistido e
exibido no histórico da cobrança, ver `claude.md` seção 4.2), mas ninguém consegue agir sobre
ela na v1.

## Capturar o quê

### User Stories

**REENVIO-US-01 (P1)** — Como usuário do sistema, quero reenviar manualmente uma mensagem
que falhou (WhatsApp ou e-mail), a partir do histórico de mensagens de uma cobrança, para
não depender só do próximo ciclo da régua automática.

### Requisitos (WHEN / THEN / SHALL)

- **REENVIO-R-01**: WHEN o usuário solicita reenvio de uma `MensagemEnviada` com `statusEnvio = "FALHA"`, THEN o sistema SHALL tentar reenviar pelo mesmo canal (`whatsapp` ou `email`) e registrar um novo registro de `MensagemEnviada` com o resultado (não sobrescreve o registro da falha original — preserva histórico).
- **REENVIO-R-02**: WHEN o reenvio é bem-sucedido, THEN o histórico de mensagens da cobrança (FE-DASH) SHALL exibir o novo registro `ENVIADO`, mantendo o registro anterior `FALHA` visível.
- **REENVIO-R-03**: IF o reenvio falhar novamente, THEN o sistema SHALL permitir uma nova tentativa (sem limite artificial de tentativas no MVP v1 — decisão consciente, não esquecimento; rate limiting genérico de abuso fica com o módulo `seguranca-api`).
- **REENVIO-R-04**: WHEN o usuário reenvia uma mensagem de uma cobrança já `PAGO` ou `CANCELADO`, THEN o sistema SHALL bloquear o reenvio (não faz sentido lembrar de pagar algo já resolvido).

### IDs de rastreabilidade

| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| REENVIO-01 | REENVIO-US-01 | REENVIO-R-01, REENVIO-R-04 | `ReenviarMensagemUseCase`, reaproveita `CanalMensagem`/`CanalNotificacao` já existentes |
| REENVIO-02 | REENVIO-US-01 | REENVIO-R-02 | `DashboardCobrancaQuery.buscarDetalhe` já retorna histórico completo — nenhuma mudança necessária além de incluir o novo registro |
| REENVIO-03 | REENVIO-US-01 | REENVIO-R-03 | Nenhum componente novo — apenas ausência de trava artificial |

## Fora de escopo deste módulo

- Painel de erros consolidado (visão geral de todas as falhas do sistema, não só por cobrança) — citado como MSG-05/COB-05, fica para v2 se o volume justificar
- Reenvio em lote (múltiplas mensagens de uma vez)
- Alteração do texto da mensagem antes de reenviar (reenvia o mesmo template, mesmos dados)
