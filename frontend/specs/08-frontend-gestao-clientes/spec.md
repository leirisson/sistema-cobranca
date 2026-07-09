# 08 — Frontend: Gestão de Clientes
`spec.md` — fase SPECIFY

**ID do módulo:** `FE-CAD`
**Escopo:** Medium
**Depende de:** `07-frontend-autenticacao` (FE-AUTH), `01-cadastro-clientes` (CAD), `spec-mvp-v1.2` (campos estendidos)

## Capturar o quê

### User Stories

**FE-CAD-US-01 (P1)** — Como usuário do sistema, quero ver a lista de todos os clientes cadastrados, para ter uma visão geral de quem está na base.

**FE-CAD-US-02 (P1)** — Como usuário do sistema, quero cadastrar um novo cliente preenchendo um formulário, para não precisar usar API diretamente.

**FE-CAD-US-03 (P1)** — Como usuário do sistema, quero editar os dados de um cliente existente, para corrigir informações sem recriar o registro.

**FE-CAD-US-04 (P2)** — Como usuário do sistema, quero inativar/reativar um cliente pela interface, para controlar quem recebe cobrança automática sem mexer no banco.

**FE-CAD-US-05 (P2)** — Como usuário do sistema, quero buscar um cliente pelo nome na lista, para encontrá-lo rapidamente.

**FE-CAD-US-06 (P3)** — Como usuário do sistema, quero que campos opcionais (endereço, inscrição estadual, nome de contato, referência de serviço) fiquem visualmente separados dos obrigatórios, para não me confundir no preenchimento.

### Requisitos (WHEN / THEN / SHALL)

- **FE-CAD-R-01**: WHEN o usuário acessa a tela de clientes, THEN o sistema SHALL listar todos os clientes com nome, telefone principal, valor, vencimento e status.
- **FE-CAD-R-02**: WHEN o usuário preenche o formulário de novo cliente sem nome, documento ou telefone, THEN o sistema SHALL bloquear o envio e destacar os campos obrigatórios ausentes.
- **FE-CAD-R-03**: WHEN o usuário salva um cliente com sucesso, THEN o sistema SHALL exibir confirmação visual e retornar à lista atualizada.
- **FE-CAD-R-04**: WHEN o backend rejeita o cadastro (ex: telefone fora do formato E.164), THEN o sistema SHALL exibir a mensagem de erro devolvida pela API de forma legível, sem expor stack trace/JSON cru.
- **FE-CAD-R-05**: WHEN o usuário clica em editar um cliente, THEN o sistema SHALL abrir o formulário pré-preenchido com os dados atuais.
- **FE-CAD-R-06**: WHEN o usuário alterna o status de um cliente (ativar/inativar), THEN o sistema SHALL refletir a mudança imediatamente na lista, sem exigir recarregar a página.
- **FE-CAD-R-07**: WHEN o usuário digita na busca, THEN o sistema SHALL filtrar a lista por nome em tempo real (debounce, sem precisar apertar Enter).

### Telas previstas
- `/clientes` — listagem com busca e filtro de status
- `/clientes/novo` — formulário de cadastro (campos obrigatórios em destaque, opcionais em seção recolhível/secundária, conforme `spec-mvp-v1.2`)
- `/clientes/[id]/editar` — formulário de edição, mesma estrutura do cadastro

### IDs de rastreabilidade
| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| FE-CAD-01 | FE-CAD-US-01 | FE-CAD-R-01 | Página `/clientes`, consumo de `GET /clientes` |
| FE-CAD-02 | FE-CAD-US-02 | FE-CAD-R-02, FE-CAD-R-03, FE-CAD-R-04 | Formulário `/clientes/novo`, `POST /clientes` |
| FE-CAD-03 | FE-CAD-US-03 | FE-CAD-R-05 | Formulário `/clientes/[id]/editar`, `PUT /clientes/:id` |
| FE-CAD-04 | FE-CAD-US-04 | FE-CAD-R-06 | Toggle de status, `PATCH /clientes/:id/status` |
| FE-CAD-05 | FE-CAD-US-05 | FE-CAD-R-07 | Campo de busca com debounce |
| FE-CAD-06 | FE-CAD-US-06 | — | Layout do formulário (seção "dados adicionais" recolhível) |

## Fora de escopo deste módulo
- Importação em massa de clientes (ex: upload de planilha)
- Histórico de alterações do cadastro (audit log é do v2)
- Campos de RBAC/vínculo a tenant (v2)
