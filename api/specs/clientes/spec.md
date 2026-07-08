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

## MVP v1.2 — Enriquecimento do Cadastro (incremento)

> Origem: `api/mvp-v1/mvp v1.2.md`, evidência de 6 orçamentos reais de um prestador de manutenção veicular.
> Incremental — não substitui os requisitos acima, adiciona campos e regras de opcionalidade.

### Requisitos adicionais (WHEN / THEN / SHALL)

- **CAD-EXT-R-01**: WHEN o usuário cadastra um documento com 11 dígitos, THEN o sistema SHALL tratá-lo como CPF; WHEN tem 14 dígitos, THEN SHALL tratá-lo como CNPJ.
- **CAD-EXT-R-02**: WHEN o cliente cadastrado é pessoa jurídica (documento com 14 dígitos) E o usuário preenche nome de contato, THEN o sistema SHALL exibir esse nome nas mensagens de cobrança (personalização do lembrete), mantendo a razão social como identificação principal do registro.
- **CAD-EXT-R-03**: WHEN o usuário não preenche endereço, inscrição estadual, nome de contato ou referência de serviço, THEN o sistema SHALL aceitar o cadastro normalmente, sem erro.
- **CAD-EXT-R-04**: WHEN o usuário cadastra mais de um telefone, THEN o sistema SHALL permitir marcar um deles como principal (usado por padrão no disparo de WhatsApp do módulo MSG).

### IDs de rastreabilidade (v1.2)
| ID | Requisito | Componente técnico previsto |
|---|---|---|
| CAD-06 | CAD-EXT-R-01 | `Cliente` (entidade) — validação de `documento` (CPF 11 dígitos / CNPJ 14 dígitos) |
| CAD-07 | CAD-EXT-R-04 | `TelefoneCliente` (entidade/tabela 1:N), `Cliente.telefones` |
| CAD-08 | CAD-EXT-R-03 | `Cliente` (entidade) — `enderecoRua/Numero/Bairro/Cidade/Uf/Cep`, `inscricaoEstadual`, `nomeContato`, `referenciaServico` opcionais |

## Fora de escopo deste módulo
- Múltiplas cobranças por cliente (o MVP v1 assume 1 cobrança recorrente por cliente — ver módulo `cobrancas`)
- Multi-tenant / vínculo do cliente a uma empresa — isso é do v2
- Validação de dígito verificador de CPF/CNPJ (só formato/tamanho no v1.2)
- Cobrança parcial/adiantamento, emissão de NF-e de peça (fora de escopo, ver `mvp v1.2.md` seção 7)
