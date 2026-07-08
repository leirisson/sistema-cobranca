# Spec — Sistema de Cobrança Automática (CobraCerta)
## MVP v1.2 — Enriquecimento do Cadastro de Cliente

> Pré-requisito: MVP v1 (módulos CAD, COB, MSG, PAG, DASH) especificado.
> Este spec é incremental — não substitui o `01-cadastro-clientes`, complementa com campos
> identificados a partir de orçamentos reais de um prestador de manutenção veicular (Norte Freios, Manaus/AM).

## 1. Objetivo
Os orçamentos reais analisados mostram que o cadastro de cliente do CAD (módulo 01) está mais simples do que a realidade de um prestador de serviço exige. Este spec enriquece o cadastro sem mudar a arquitetura do MVP v1 — só adiciona campos e regras de opcionalidade.

## 2. Evidência (fonte)
Análise de 6 orçamentos de ordem de serviço de uma oficina de manutenção veicular, emitidos entre junho e julho de 2026. Padrões observados:

| Campo observado | Presente em todos? | Observação |
|---|---|---|
| Nome / Razão Social do cliente | Sim | Pode ser pessoa física ou jurídica |
| CNPJ ou CPF | Sim | Sempre presente, formato varia (CNPJ com 14 dígitos, CPF com 11) |
| Endereço | Não | Ausente em cadastro de pessoa física simples (ex: cliente "Fabrício Rodrigues") |
| Inscrição Estadual | Não | Presente só em clientes PJ que também compram peça (relevante pra NF-e futura, não NFS-e) |
| Telefone(s) | Sim | Alguns clientes têm mais de um número cadastrado |
| E-mail | Não | Presente na maioria, mas não obrigatório |
| Nome de contato | Não | Em um caso, a empresa cliente tem um "contato" que é uma pessoa física diferente da razão social (ex: "Contato: GEL") |
| Referência do serviço/item | Não | No caso da oficina, é a placa/veículo; genericamente, é "a que se refere essa cobrança" |
| Adiantamento/pagamento parcial | Não | Um orçamento mostra adiantamento de R$1.000 com restante a cobrar — já estava fora de escopo do v1, mantido fora aqui também |

## 3. Escopo do MVP v1.2

### 3.1 Campos adicionais no cadastro de cliente
- `documento`: aceitar CPF (11 dígitos) ou CNPJ (14 dígitos), com validação de formato correspondente (sem exigir um ou outro fixo)
- `inscricaoEstadual`: campo opcional, string livre (sem validação de dígito verificador no v1.2 — isso fica pra quando a nota fiscal de peça/NF-e entrar em escopo, se entrar)
- `endereco`: campo opcional (rua, número/complemento, bairro, cidade, UF, CEP) — hoje o cadastro do CAD não previa isso
- `nomeContato`: campo opcional, texto livre — nome de uma pessoa física de contato dentro da empresa cliente, quando o cliente cadastrado é pessoa jurídica
- `telefones`: mudar de campo único para lista de telefones (mantendo pelo menos 1 obrigatório, os demais opcionais)
- `referenciaServico`: campo opcional, texto livre — identificador do que a cobrança se refere (no caso da oficina, seria placa/veículo; em outro segmento, pode ser "processo nº X" ou "contrato nº Y")

### 3.2 Regras de opcionalidade
- Apenas **nome** (ou razão social), **documento** (CPF/CNPJ) e **pelo menos 1 telefone** são obrigatórios — mantém o cadastro rápido pro caso simples
- Endereço, inscrição estadual, nome de contato, telefones adicionais e referência de serviço são todos opcionais

## 4. Modelo de dados (incremento sobre `Cliente` do MVP v1)
```
Cliente (campos adicionados)
- + inscricao_estadual (nullable)
- + endereco_rua, endereco_numero, endereco_bairro, endereco_cidade,
    endereco_uf, endereco_cep (todos nullable)
- + nome_contato (nullable)
- + referencia_servico (nullable)

TelefoneCliente (nova tabela, 1:N com Cliente)
- id, cliente_id, numero, principal (bool)
```

## 5. Requisitos (WHEN / THEN / SHALL)
- **CAD-EXT-R-01**: WHEN o usuário cadastra um documento com 11 dígitos, THEN o sistema SHALL tratá-lo como CPF; WHEN tem 14 dígitos, THEN SHALL tratá-lo como CNPJ.
- **CAD-EXT-R-02**: WHEN o cliente cadastrado é pessoa jurídica (documento com 14 dígitos) E o usuário preenche nome de contato, THEN o sistema SHALL exibir esse nome nas mensagens de cobrança (personalização do lembrete), mantendo a razão social como identificação principal do registro.
- **CAD-EXT-R-03**: WHEN o usuário não preenche endereço, inscrição estadual, nome de contato ou referência de serviço, THEN o sistema SHALL aceitar o cadastro normalmente, sem erro.
- **CAD-EXT-R-04**: WHEN o usuário cadastra mais de um telefone, THEN o sistema SHALL permitir marcar um deles como principal (usado por padrão no disparo de WhatsApp do módulo MSG).

## 6. Impacto em módulos já especificados
- **CAD (01)**: schema de cliente estendido conforme seção 4 — requisitos `CAD-R-01` a `CAD-R-06` continuam válidos, os novos requisitos são aditivos (`CAD-EXT-R-*`)
- **MSG (03)** e **EMAIL (06)**: passam a usar o telefone marcado como principal e podem incluir o nome de contato no template da mensagem, quando presente
- **DASH (05)**: pode futuramente permitir busca por referência de serviço além de nome — não obrigatório no v1.2

## 7. Fora de escopo do MVP v1.2
- Validação de dígito verificador de CPF/CNPJ (só validação de formato/tamanho no v1.2)
- Cobrança parcial/adiantamento (mantido fora de escopo, já previsto para v2)
- Emissão de NF-e de peça (mantido fora de escopo, já previsto para v3 como não coberto)
- Campos específicos de segmento (ex: placa de veículo como campo estruturado) — o v1.2 generaliza como `referenciaServico` (texto livre) em vez de criar um campo por segmento