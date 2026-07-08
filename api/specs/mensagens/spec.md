# Mensagens (Lembretes via WhatsApp)
`spec.md` — fase SPECIFY

**ID do módulo:** `MSG`
**Escopo:** Medium
**Depende de:** `cobrancas` (COB)

## Capturar o quê

### User Stories

**MSG-US-01 (P1)** — Como usuário do sistema, quero que o cliente receba um lembrete no WhatsApp antes do vencimento, para aumentar a chance de pagamento em dia.

**MSG-US-02 (P1)** — Como usuário do sistema, quero que o cliente receba uma mensagem de cobrança quando atrasar, para não precisar cobrar manualmente por atraso.

**MSG-US-03 (P2)** — Como usuário do sistema, quero registrar todo envio de mensagem, para ter histórico de comunicação com o cliente.

**MSG-US-04 (P3)** — Como usuário do sistema, quero saber quando um envio falhou (ex: WhatsApp desconectado), para poder agir manualmente.

### Requisitos (WHEN / THEN / SHALL)

- **MSG-R-01**: WHEN uma cobrança é gerada, THEN o sistema SHALL disparar uma mensagem de lembrete com nome, valor, vencimento e link de pagamento.
- **MSG-R-02**: WHEN a cobrança chega no dia do vencimento sem pagamento, THEN o sistema SHALL disparar mensagem de vencimento.
- **MSG-R-03**: WHEN a cobrança está atrasada em D+1, THEN o sistema SHALL disparar mensagem de atraso; WHEN chega em D+3 ainda sem pagamento, THEN o sistema SHALL disparar novo lembrete de atraso.
- **MSG-R-04**: WHEN uma cobrança muda para status `PAGO`, THEN o sistema SHALL NOT disparar nenhuma mensagem de lembrete/atraso pendente para essa cobrança.
- **MSG-R-05**: WHEN uma mensagem é enviada (com sucesso ou falha), THEN o sistema SHALL registrar o evento com tipo, status de envio e timestamp.
- **MSG-R-06**: IF o envio via Evolution API falhar, THEN o sistema SHALL registrar a falha sem interromper o processamento das demais mensagens da fila.

### IDs de rastreabilidade
| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| MSG-01 | MSG-US-01 | MSG-R-01 | Job de disparo, template de lembrete |
| MSG-02 | MSG-US-02 | MSG-R-02, MSG-R-03 | Régua fixa (D0, D+1, D+3) |
| MSG-03 | — | MSG-R-04 | Checagem de status antes do disparo |
| MSG-04 | MSG-US-03 | MSG-R-05 | `MensagemEnviada` (entidade/tabela) |
| MSG-05 | MSG-US-04 | MSG-R-06 | Log estruturado + painel de erros (módulo `dashboard`) |

## Fora de escopo deste módulo
- Régua de cobrança configurável pelo usuário (v2 — no v1 os prazos D-5/D0/D+1/D+3 são fixos)
- Envio por e-mail como canal — ver módulo `notificacoes-email` (EMAIL)
- Confirmação de pagamento via WhatsApp (isso é do módulo `pagamentos`)
