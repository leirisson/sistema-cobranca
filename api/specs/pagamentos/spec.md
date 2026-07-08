# Pagamentos (Confirmação)
`spec.md` — fase SPECIFY

**ID do módulo:** `PAG`
**Escopo:** Small
**Depende de:** `cobrancas` (COB), `mensagens` (MSG)

## Capturar o quê

### User Stories

**PAG-US-01 (P1)** — Como usuário do sistema, quero que o status da cobrança seja atualizado automaticamente quando o cliente pagar, para não precisar checar manualmente no gateway.

**PAG-US-02 (P2)** — Como usuário do sistema, quero que o cliente receba uma confirmação de pagamento por WhatsApp, para reforçar profissionalismo sem eu precisar mandar manualmente.

**PAG-US-03 (P1)** — Como usuário do sistema, quero ter certeza que ninguém de fora consiga forjar uma confirmação de pagamento, para não ter meu controle financeiro corrompido.

### Requisitos (WHEN / THEN / SHALL)

- **PAG-R-01**: WHEN o gateway envia um webhook de pagamento confirmado, THEN o sistema SHALL validar um token de autenticidade antes de processar qualquer dado do payload.
- **PAG-R-02**: IF o token do webhook for inválido, THEN o sistema SHALL rejeitar a requisição com status 401 e SHALL NOT alterar nenhuma cobrança.
- **PAG-R-03**: WHEN o webhook é válido e corresponde a uma cobrança existente, THEN o sistema SHALL atualizar o status da cobrança para `PAGO` e registrar a data de pagamento.
- **PAG-R-04**: WHEN o webhook corresponde a uma cobrança já paga ou cancelada, THEN o sistema SHALL ignorar o evento sem erro (idempotência).
- **PAG-R-05**: WHEN a cobrança é marcada como paga, THEN o sistema SHALL, se a opção estiver ativada, disparar mensagem de confirmação ao cliente.

### IDs de rastreabilidade
| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| PAG-01 | PAG-US-01 | PAG-R-03 | Endpoint de webhook, `Cobranca.marcarComoPaga` |
| PAG-02 | PAG-US-03 | PAG-R-01, PAG-R-02 | Validação de `ASAAS_WEBHOOK_TOKEN` |
| PAG-03 | — | PAG-R-04 | Máquina de estados da entidade `Cobranca` (transições permitidas) |
| PAG-04 | PAG-US-02 | PAG-R-05 | Toggle de configuração + disparo via módulo `mensagens` |

## Fora de escopo deste módulo
- Conciliação automática entre cobranças geradas e recebidas no gateway (v2)
- Suporte a múltiplos gateways enviando webhook (v2 — v1 assume só Asaas)
- Estorno/reembolso automático
