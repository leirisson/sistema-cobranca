# Cobranças
`spec.md` — fase SPECIFY

**ID do módulo:** `COB`
**Escopo:** Medium
**Depende de:** `clientes` (CAD)

## Capturar o quê

### User Stories

**COB-US-01 (P1)** — Como usuário do sistema, quero que a cobrança do mês seja gerada automaticamente para cada cliente ativo, para não precisar criar manualmente boleto/PIX todo mês.

**COB-US-02 (P1)** — Como usuário do sistema, quero que a cobrança seja gerada com antecedência configurável ao vencimento, para dar tempo do cliente pagar em dia.

**COB-US-03 (P2)** — Como usuário do sistema, quero que uma cobrança não gerada por falha do gateway seja identificável, para eu poder corrigir manualmente sem depender só do log.

### Requisitos (WHEN / THEN / SHALL)

- **COB-R-01**: WHEN o job diário roda, THEN o sistema SHALL verificar todos os clientes com status `ATIVO` e cujo vencimento está dentro da janela de antecedência configurada.
- **COB-R-02**: WHEN uma cobrança precisa ser gerada, THEN o sistema SHALL criá-la no gateway de pagamento antes de persistir localmente com status `PENDENTE`.
- **COB-R-03**: IF a chamada ao gateway falhar, THEN o sistema SHALL NOT persistir uma cobrança sem `gatewayChargeId`/link de pagamento válido — a falha deve subir e ser logada, não deixar registro inconsistente.
- **COB-R-04**: WHEN uma cobrança já foi gerada para o ciclo vigente de um cliente, THEN o sistema SHALL NOT gerar uma segunda cobrança duplicada para o mesmo ciclo.
- **COB-R-05**: WHEN um cliente está `INATIVO`, THEN o sistema SHALL NOT gerar cobrança para ele.

### IDs de rastreabilidade
| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| COB-01 | COB-US-01 | COB-R-01, COB-R-05 | Job agendado (BullMQ), `GerarCobrancaUseCase` |
| COB-02 | COB-US-02 | COB-R-01 | `COBRANCA_ANTECEDENCIA_DIAS` (config) |
| COB-03 | COB-US-01 | COB-R-02, COB-R-03 | `GatewayPagamento` (porta), `AsaasGateway` (adapter) |
| COB-04 | — | COB-R-04 | `CobrancaRepository` (checagem de duplicidade) |
| COB-05 | COB-US-03 | COB-R-03 | Log estruturado + painel de erros (ligação com módulo `dashboard`) |

## Fora de escopo deste módulo
- Múltiplos gateways de pagamento (v2)
- Valores variáveis, parcelamento, juros/multa automáticos (v2)
- Cobrança avulsa fora da recorrência (v2)
- Retry automático sofisticado com fila de dead-letter — MVP v1 loga erro e permite reprocessamento manual
