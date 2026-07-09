# Sprint 2 — Frontend: Gestão de Clientes (FE-CAD)

> Status: concluída (2026-07-09)
> Depende de: [Sprint 0 — Backend: gaps de API](sprint-00-backend-gaps-api.md), [Sprint 1 — FE-AUTH](sprint-01-fe-auth.md) (sessão/middleware)
> Specs de referência: `frontend/specs/08-frontend-gestao-clientes/spec.md`, `design.md`, `frontend/specs/decisoes-tecnicas.md`

## Objetivo

Entregar listagem, cadastro e edição de clientes — a primeira tela "de
verdade" do painel pós-login. Fecha FE-CAD-01 a FE-CAD-05 (listagem, busca,
toggle de status, cadastro, edição).

## Tasks

- [x] FE-CAD-01 — Camada `lib/api/clientes.ts`: `listarClientes()`, `criarCliente()`, `editarCliente()`, `alternarStatusCliente()`, `buscarCliente()` — tipadas conforme os DTOs reais do backend
- [x] FE-CAD-02 — Tela `/clientes` (Server Component): lê `searchParams` (`busca`, `status`), renderiza `<TabelaClientes />` (nome, telefone principal, valor, vencimento, badge de status)
- [x] FE-CAD-03 — `<CampoBusca />` (Client Component, debounce ~300ms, atualiza `?busca=` na URL)
- [x] FE-CAD-04 — Toggle de status por linha (Client Component + Server Action `alternarStatusClienteAction(id)` + `useOptimistic`, sem recarregar a página)
- [x] FE-CAD-05 — Estados vazios: "nenhum cliente cadastrado" (com CTA) vs. "nenhum cliente encontrado para busca" (sem CTA)
- [x] FE-CAD-06 — `<FormularioCliente />` (Client Component compartilhado entre `/clientes/novo` e `/clientes/[id]/editar`) — **sem react-hook-form** (ver decisão abaixo), Zod chamado manualmente na Server Action espelhando as invariantes do backend
- [x] FE-CAD-07 — Sub-formulário de telefones (lista via `useState`, 1:N, exatamente 1 principal) + seção recolhível `<details>` "dados adicionais" (endereço, inscrição estadual, nome de contato, referência de serviço)
- [x] FE-CAD-08 — Tela `/clientes/novo`: submit via Server Action `criarClienteAction`, sucesso → `revalidatePath("/clientes")` + redirect `?sucesso=criado`; erro → mensagem inline por campo (via `useActionState`), nunca stack trace cru
- [x] FE-CAD-09 — Tela `/clientes/[id]/editar`: busca cliente via `buscarCliente(id)` (404 → página "Cliente não encontrado"), pré-preenche `<FormularioCliente />`, submit via Server Action inline com `id` já vinculado

## Critérios de conclusão da sprint

- [x] CRUD completo de cliente funcionando ponta a ponta contra o backend (não só mock)
- [x] Busca e filtro de status refletidos na URL (`?busca=&status=`) e no fetch server-side
- [x] Toggle de status não recarrega a página (otimista + reversão em erro)
- [x] Erros de validação do backend aparecem inline no campo certo, nunca como JSON/stack trace
- [x] Estados vazios cobertos (lista geral vazia vs. busca sem resultado)
- [x] Lint e typecheck do frontend limpos
- [x] Checklist do `claude.md` (raiz do repo, seção 7.2) validado

## Decisão: sem react-hook-form (diferente do design.md original)

A Sprint 1 já havia removido react-hook-form/Zod do projeto por um bug não resolvido
(submit disparava GET nativo em vez do POST da Server Action, com `useActionState` +
Turbopack/React 19 — ver `claude.md` raiz, linha do tempo 2026-07-09). Como esta sprint
também usa `useActionState`, decisão explícita do usuário (opção escolhida entre as duas
apresentadas) foi não reintroduzir react-hook-form: `<form action={formAction}>` nativo +
HTML5 (`required`, `type=email`) para validação client-side básica, e o schema Zod
(`lib/cliente/schema.ts`) chamado manualmente dentro da Server Action
(`lib/cliente/actions.ts`) sobre o `FormData` recebido. A lista de telefones (1:N) e o
objeto de endereço são geridos por `useState` no Client Component e serializados como
JSON em `<input type="hidden">` antes do submit, no lugar de `useFieldArray`.

## Após esta sprint

Gestão de clientes completa — Sprint 3 (FE-DASH) fecha o MVP v1 do frontend.
