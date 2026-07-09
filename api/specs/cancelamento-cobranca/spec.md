# Cancelamento de Cobrança
`spec.md` — fase SPECIFY

**ID do módulo:** `CANC`
**Escopo:** Small
**Depende de:** `cobrancas` (COB, `Cobranca.cancelar()` já existe no domínio desde o setup inicial), `dashboard` (DASH/FE-DASH)

## Contexto

Identificado na Análise de Gaps (`api/SistemaDeCobrançaAutomática.md`, gap 2): a entidade
`Cobranca` já tem o método `cancelar()` (regra de domínio definida desde o setup do projeto,
`claude.md` seção 8), e o módulo `pagamentos` (PAG) menciona cancelamento como conceito, mas
nenhum módulo de frontend tem uma ação de "cancelar cobrança". Hoje, se o usuário errar um
lançamento ou o cliente desistir, não há forma de cancelar pela tela — só mexendo direto no
banco, o que é inaceitável para qualquer usuário além do próprio desenvolvedor.

## Capturar o quê

### User Stories

**CANC-US-01 (P1)** — Como usuário do sistema, quero cancelar uma cobrança `PENDENTE` ou
`ATRASADO` pela tela do dashboard, para corrigir um lançamento errado ou parar de cobrar um
cliente que desistiu, sem precisar mexer no banco.

**CANC-US-02 (P2)** — Como usuário do sistema, quero que uma cobrança cancelada pare de
receber lembretes automáticos, para o cliente não continuar recebendo mensagem de uma
cobrança que não vale mais.

### Requisitos (WHEN / THEN / SHALL)

- **CANC-R-01**: WHEN o usuário solicita cancelar uma cobrança com status `PENDENTE` ou `ATRASADO`, THEN o sistema SHALL chamar `Cobranca.cancelar()` e persistir o novo status `CANCELADO`.
- **CANC-R-02**: IF a cobrança já está `PAGO` ou já `CANCELADO`, THEN o sistema SHALL bloquear o cancelamento com mensagem clara (reaproveita a invariante já existente em `Cobranca.cancelar()`, que rejeita transição inválida).
- **CANC-R-03**: WHEN uma cobrança é cancelada, THEN a régua de mensagens automáticas (`DispararReguaAtrasoUseCase`) SHALL parar de considerá-la — já coberto pela query `listarPendentesOuAtrasadas`, que naturalmente exclui `CANCELADO`; este requisito só formaliza que nenhuma alteração deve quebrar essa exclusão.
- **CANC-R-04**: WHEN o usuário cancela uma cobrança que já foi criada no gateway de pagamento (Asaas), THEN o sistema SHALL também cancelar/estornar a cobrança do lado do gateway (evita o cliente conseguir pagar um boleto/PIX que já não vale mais).
- **CANC-R-05**: WHEN uma cobrança é cancelada, THEN o dashboard SHALL refletir o novo status imediatamente na listagem e no detalhe.

### IDs de rastreabilidade

| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| CANC-01 | CANC-US-01 | CANC-R-01, CANC-R-02 | `CancelarCobrancaUseCase` (reaproveita `Cobranca.cancelar()` já existente) |
| CANC-02 | CANC-US-02 | CANC-R-03 | Nenhum componente novo — validação de regressão sobre `listarPendentesOuAtrasadas` |
| CANC-03 | CANC-US-01 | CANC-R-04 | `GatewayPagamento` ganha método `cancelarCobranca`, implementado em `AsaasGateway` (`DELETE /payments/:id` ou equivalente) |
| CANC-04 | CANC-US-01 | CANC-R-05 | Botão "Cancelar" no detalhe da cobrança (FE-DASH) |

## Fora de escopo deste módulo

- Cancelamento em lote (múltiplas cobranças de uma vez)
- Motivo obrigatório de cancelamento (campo de texto livre opcional pode ser considerado no design, mas não é requisito bloqueante)
- Reversão de cancelamento ("descancelar") — se cancelou errado, o fluxo é lançar uma nova cobrança (avulsa ou aguardar o próximo ciclo)
