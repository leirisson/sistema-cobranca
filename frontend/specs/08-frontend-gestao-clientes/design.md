# 08 — Frontend: Gestão de Clientes
`design.md` — fase DESIGN

**ID do módulo:** `FE-CAD`
**Depende de:** `spec.md` deste módulo, `../decisoes-tecnicas.md`, `../07-frontend-autenticacao/design.md` (sessão/middleware)

## 1. Rotas/páginas

| Rota | Tipo | Descrição |
|---|---|---|
| `/clientes` | Server Component + Client Component de busca/filtro | Listagem (FE-CAD-01) |
| `/clientes/novo` | Server Component (shell) + Client Component de formulário | Cadastro (FE-CAD-02) |
| `/clientes/[id]/editar` | Server Component (busca dados) + Client Component de formulário | Edição (FE-CAD-03) |

## 2. Tela `/clientes` (listagem)

- **Server Component** `app/clientes/page.tsx`: lê `searchParams` (`busca`, `status`), chama `listarClientes({ busca, status })` de `lib/api/clientes.ts` (fetch server-side), renderiza `<TabelaClientes />` (Server Component, apenas apresentação).
- **Busca com debounce (FE-CAD-R-07):** Client Component `<CampoBusca />` mantém o texto local, faz debounce (~300ms) e atualiza a URL via `router.push` (ou `replace`) com `?busca=...` — isso dispara novo fetch no Server Component pai, sem precisar de state client-side para os dados em si. Sem necessidade de lib de estado adicional.
- **Toggle de status (FE-CAD-R-06 — "sem exigir recarregar a página"):** botão/switch por linha, Client Component, chama a Server Action `alternarStatusCliente(id)` e usa `useOptimistic` para refletir a mudança imediatamente na UI enquanto a Server Action resolve; em caso de erro, reverte e mostra mensagem.
- **Estado vazio:** conforme `DesignSystem.md` §5.6 — "Nenhum cliente cadastrado ainda" + botão "Cadastrar primeiro cliente" quando a lista (sem filtro) estiver vazia; mensagem diferente quando o vazio é resultado de busca/filtro sem match ("Nenhum cliente encontrado para '<busca>'").
- **Colunas da tabela** (FE-CAD-R-01): nome, telefone principal, valor, vencimento, status (badge "carimbo" — `DesignSystem.md` §5.1).

## 3. Tela `/clientes/novo` e `/clientes/[id]/editar` (formulário)

Estrutura compartilhada entre as duas telas — mesmo Client Component `<FormularioCliente />`, recebendo `clienteInicial?: ClienteDTO` (undefined em `/novo`).

- **react-hook-form + Zod** (`decisoes-tecnicas.md` §1): schema Zod espelhando as invariantes reais da entidade `Cliente` do backend (`api/src/domain/cliente/cliente.ts`) — nome obrigatório, documento 11/14 dígitos, ao menos 1 telefone com exatamente 1 principal, dia de vencimento 1–28, valor positivo.
- **Seções do formulário** (FE-CAD-R-02, FE-CAD-US-06):
  - Seção "Dados obrigatórios" (sempre visível): nome, documento, telefone(s), valor de cobrança, dia de vencimento.
  - Seção "Dados adicionais" (`<details>`/componente recolhível, fechado por padrão em `/novo`, aberto em `/editar` se algum campo já estiver preenchido): endereço, inscrição estadual, nome de contato, referência de serviço.
- **Telefones (1:N, 1 principal):** sub-formulário de lista (react-hook-form `useFieldArray`) — adicionar/remover telefone, radio/checkbox exclusivo para marcar qual é o principal; validação client-side replica a invariante "exatamente 1 principal".
- **Submit:** Server Action `criarCliente(formData)` ou `editarCliente(id, formData)`.
  - Sucesso: `revalidatePath("/clientes")`, redireciona para `/clientes` com um indicador de sucesso (FE-CAD-R-03 — "confirmação visual"; sugestão: toast ou banner na listagem via `?sucesso=criado`).
  - Erro do backend (ex: telefone fora do E.164): a Server Action devolve o erro estruturado (campo + mensagem quando possível) via `useActionState`, exibido inline no campo correspondente — nunca stack trace/JSON cru (FE-CAD-R-04). Erros não mapeáveis a um campo específico aparecem como banner geral no topo do formulário, usando a mensagem que a API já devolve (ver `DesignSystem.md` §6 — mensagens específicas, ex: "Telefone inválido — use o formato +55 92 99999-9999").
- **Pré-preenchimento (FE-CAD-R-05):** `/clientes/[id]/editar/page.tsx` (Server Component) busca o cliente via `buscarCliente(id)` e passa como prop inicial para `<FormularioCliente />`; 404 do backend → página de erro simples ("Cliente não encontrado").

## 4. Gaps de API (pré-requisito de backend)

O backend hoje só tem o núcleo DDD do módulo `clientes` (use cases `CriarClienteUseCase`, `EditarClienteUseCase`, `InativarClienteUseCase`) — **nenhuma rota HTTP exposta**. Precisa existir:

| Endpoint | Método | Payload | Resposta | Use case backend já existente |
|---|---|---|---|---|
| `/clientes` | GET | query: `busca?`, `status?` | `200 [ClienteDTO]` | Falta um `ListarClientesUseCase` (ou reaproveitar `listarAtivos()` do repositório + filtro) — não existe ainda, nem com esse nome |
| `/clientes` | POST | `{ nome, documento, telefones[], valorCobranca, diaVencimento, ...opcionais }` | `201 ClienteDTO` ou `400` erro de validação | `CriarClienteUseCase` |
| `/clientes/:id` | PUT | mesmo shape do POST | `200 ClienteDTO` ou `400`/`404` | `EditarClienteUseCase` |
| `/clientes/:id/status` | PATCH | `{ status: "ATIVO" \| "INATIVO" }` | `200 ClienteDTO` | `InativarClienteUseCase` cobre inativar; **reativar não tem use case ainda** (FE-CAD-US-04 pede "inativar/reativar") |
| `/clientes/:id` | GET | — | `200 ClienteDTO` ou `404` | Existe `buscarPorId` no repositório, falta expor via use case/rota |

Todas essas rotas precisam estar atrás do middleware de autenticação (ver `07-frontend-autenticacao/design.md` §5) assim que ele existir.

**Não existe ainda no backend:** `ReativarClienteUseCase` (só inativar foi implementado) e `ListarClientesUseCase`/rota de busca por nome+status combinados (existe `buscarPorNome` isolado). Ambos são pré-requisito direto de FE-CAD-US-04 e FE-CAD-US-05/R-07.

## 5. Componentes de design system introduzidos por este módulo
- Badge de status do cliente (ATIVO/INATIVO) — variação simples do "carimbo" (`DesignSystem.md` §5.1), sem a rotação de `-4deg` (essa é exclusiva do status `PAGO` de cobrança).
- Tabela de listagem (`DesignSystem.md` §5.4).
- Input de formulário, incluindo variante de lista/repetível para telefones (`DesignSystem.md` §5.3).
- Seção recolhível ("dados adicionais").
- Estado vazio (`DesignSystem.md` §5.6).

## 6. Fora de escopo
Herdado de `spec.md` (importação em massa, audit log, RBAC/tenant) — sem mudanças.
