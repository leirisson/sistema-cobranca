# Clientes
`spec.md` — fase SPECIFY

**ID do módulo:** `CAD`
**Escopo:** Small–Medium
**Depende de:** nada (módulo base)

## Capturar o quê

### User Stories

**CAD-US-01 (P1)** — Como usuário do sistema, quero cadastrar um cliente com nome, telefone e valor de cobrança, para não precisar controlar isso manualmente numa planilha.

**CAD-US-02 (P1)** — Como usuário do sistema, quero definir o dia de vencimento e a periodicidade da cobrança de cada cliente, para que o sistema saiba quando gerar a próxima cobrança.

**CAD-US-03 (P2)** — Como usuário do sistema, quero inativar um cliente sem excluí-lo, para parar de gerar cobrança automática sem perder o histórico.

**CAD-US-04 (P2)** — Como usuário do sistema, quero editar os dados de um cliente já cadastrado, para corrigir informações sem precisar recriar o registro.

**CAD-US-05 (P3)** — Como usuário do sistema, quero buscar um cliente pelo nome, para encontrá-lo rapidamente numa lista maior.

### Requisitos (WHEN / THEN / SHALL)

- **CAD-R-01**: WHEN o usuário cadastra um cliente com nome vazio, THEN o sistema SHALL rejeitar o cadastro com mensagem de erro clara.
- **CAD-R-02**: WHEN o usuário cadastra um cliente com telefone fora do formato E.164, THEN o sistema SHALL rejeitar o cadastro.
- **CAD-R-03**: WHEN o usuário define o dia de vencimento, THEN o sistema SHALL aceitar apenas valores entre 1 e 28 (evita inconsistência em meses curtos).
- **CAD-R-04**: WHEN um cliente é cadastrado, THEN o sistema SHALL definir seu status inicial como `ATIVO`.
- **CAD-R-05**: WHEN o usuário inativa um cliente, THEN o sistema SHALL parar de gerar novas cobranças para esse cliente a partir do próximo ciclo, mas SHALL manter o histórico de cobranças já geradas.
- **CAD-R-06**: WHEN o usuário reativa um cliente, THEN o sistema SHALL voltar a incluí-lo na geração automática de cobrança.

### IDs de rastreabilidade
| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| CAD-01 | CAD-US-01 | CAD-R-01, CAD-R-04 | `Cliente` (entidade), `CriarClienteUseCase` |
| CAD-02 | CAD-US-02 | CAD-R-02, CAD-R-03 | `Cliente` (entidade) |
| CAD-03 | CAD-US-03 | CAD-R-05 | `InativarClienteUseCase` |
| CAD-04 | CAD-US-04 | — | `EditarClienteUseCase` |
| CAD-05 | CAD-US-05 | — | `ClienteRepository.buscarPorNome` |

## Fora de escopo deste módulo
- Múltiplas cobranças por cliente (o MVP v1 assume 1 cobrança recorrente por cliente — ver módulo `cobrancas`)
- Campos fiscais (CNPJ, endereço completo, regime tributário) — isso é do spec de nota fiscal (v3)
- Multi-tenant / vínculo do cliente a uma empresa — isso é do v2
