# Dado Pessoal e LGPD
`spec.md` — fase SPECIFY

**ID do módulo:** `LGPD`
**Escopo:** Small
**Depende de:** `clientes` (CAD)

## Contexto

Identificado na Análise de Gaps (`api/SistemaDeCobrançaAutomática.md`, gap 6): o sistema
armazena CPF/CNPJ, telefone, e-mail e endereço de terceiros (os clientes do usuário do
sistema). Hoje não há: retenção/exclusão de dado quando um cliente é removido de verdade (só
existe "inativar", nunca apagar), base legal de tratamento documentada, nem qualquer menção
formal a isso. Relevante especialmente para o segmento jurídico/saúde já mirado pelo produto
(ver `claude.md` seção 1), onde o cliente final tende a perguntar sobre isso.

## Capturar o quê

### User Stories

**LGPD-US-01 (P2)** — Como usuário do sistema, quero poder excluir definitivamente os dados
de um cliente (não só inativar), para atender uma solicitação de exclusão (direito do
titular, LGPD art. 18) quando ela chegar.

**LGPD-US-02 (P3)** — Como usuário do sistema, quero que o produto documente formalmente a
base legal de tratamento dos dados que armazena, para eu poder responder perguntas de
compliance dos meus próprios clientes (segmento jurídico/saúde).

### Requisitos (WHEN / THEN / SHALL)

- **LGPD-R-01**: WHEN o usuário solicita exclusão definitiva de um cliente (distinta de inativar), THEN o sistema SHALL remover ou anonimizar os dados pessoais (CPF/CNPJ, telefone, e-mail, endereço, nome de contato) associados, preservando apenas o necessário para integridade referencial de registros financeiros já emitidos (ex: manter `Cobranca` histórica sem re-identificar a pessoa, se exigido por obrigação fiscal).
- **LGPD-R-02**: IF um cliente tem cobranças com obrigação de guarda fiscal ainda vigente (ex: nota fiscal emitida), THEN o sistema SHALL bloquear ou avisar antes da exclusão definitiva, oferecendo inativação como alternativa até o prazo de guarda expirar.
- **LGPD-R-03**: WHEN a exclusão definitiva é executada, THEN o sistema SHALL registrar um log de auditoria (quem, quando, qual cliente) — sem guardar o dado pessoal em si nesse log, só a referência ao evento.
- **LGPD-R-04**: A documentação do produto (não código) SHALL declarar a base legal de tratamento (execução de contrato, conforme já identificado como a mais óbvia) e o propósito da coleta de cada campo pessoal armazenado.

### IDs de rastreabilidade

| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| LGPD-01 | LGPD-US-01 | LGPD-R-01, LGPD-R-02 | `ExcluirClienteDefinitivamenteUseCase`, distinto de `InativarClienteUseCase` já existente |
| LGPD-02 | LGPD-US-01 | LGPD-R-03 | Log de auditoria estruturado (Pino), sem PII no corpo do log |
| LGPD-03 | LGPD-US-02 | LGPD-R-04 | Documento `api/specs/lgpd/base-legal.md` (não código) |

## Fora de escopo deste módulo

- Portal de autoatendimento para o titular do dado solicitar exclusão diretamente (o cliente final não tem login no sistema — quem executa é sempre o usuário do CobraCerta)
- Anonimização automática por prazo (job agendado de expurgo) — v2, MVP v1 é sob demanda
- DPO (Data Protection Officer) formal ou processo jurídico externo ao produto
