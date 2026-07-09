# Decisões Técnicas Transversais — Frontend CobraCerta
`decisoes-tecnicas.md` — base compartilhada pelos módulos `07-frontend-autenticacao`,
`08-frontend-gestao-clientes`, `09-frontend-dashboard-cobrancas`.

> Define uma vez as decisões que se repetiriam nos três módulos, para evitar
> inconsistência entre eles. Cada `design.md` de módulo referencia este documento
> em vez de redecidir o mesmo problema.

## 1. Stack confirmada

| Camada | Escolha | Observação |
|---|---|---|
| Framework | Next.js (App Router) | Já iniciado via `create-next-app` em `frontend/` (commit `5b686c2`) |
| Linguagem | TypeScript | Consistente com `api/` |
| Data fetching (leitura) | **Server Components + `fetch` nativo** | Sem lib de client-state (React Query, SWR). Páginas de listagem buscam dados no servidor |
| Mutações (escrita) | **Server Actions** | Criar/editar/inativar cliente, login/logout — sem route handlers intermediários quando o Server Action for suficiente |
| Revalidação | `revalidatePath` (Server Actions) / `router.refresh()` quando necessário no client | Sem cache de client-state para invalidar |
| Formulários | **react-hook-form + Zod** | Mesmo racional de validação já usado no backend (`api/src/domain/*`), reaproveitando os mesmos formatos de regra (ex: E.164, CPF/CNPJ 11/14 dígitos) |
| Autenticação | **Cookie httpOnly + `middleware.ts`** | Ver seção 4 |
| Estilo | CSS conforme `DesignSystem.md` | A decidir na fase de execução se via CSS Modules, Tailwind ou CSS puro com variáveis — não bloqueia o design técnico dos módulos, registrar aqui quando decidido |

## 2. Justificativa: Server Components em vez de React Query

Decisão do usuário. Motivos que sustentam a escolha para o contexto do MVP v1:
- Volume de dados baixo (single-tenant, um prestador de serviço, dezenas/poucas centenas de clientes e cobranças) — não há pressão de performance que justifique cache client-side sofisticado.
- Reduz superfície: sem lib de estado de servidor adicional para o time manter, sem duplicar a responsabilidade de "fonte da verdade" entre client cache e servidor.
- Interações que pareceriam pedir client-state (busca com debounce em FE-CAD-R-07, toggle de status em FE-CAD-R-06) são tratáveis com Server Actions + `useTransition`/`useOptimistic` nativos do React, sem dependência extra.

**Implicação para os módulos:** cada `design.md` deve especificar, por tela, se o dado é Server Component (leitura) ou Server Action (escrita), e como o componente client-side (quando existir, ex: input de busca) dispara a Server Action/re-render.

## 3. Camada de acesso à API

Não existe ainda um cliente HTTP centralizado no frontend. Proposta:

```
frontend/lib/api/
├── client.ts        # wrapper fino sobre fetch: base URL (env), tratamento de erro padrão, cookie de sessão repassado
├── clientes.ts       # funções tipadas: listarClientes(), criarCliente(), editarCliente(), alternarStatusCliente()
├── cobrancas.ts       # listarCobrancasDashboard(filtro)
└── auth.ts           # login(), logout()
```

- Tipos de request/response devem espelhar os DTOs reais do backend (`CobrancaDashboardItem`, `TotaisDashboard`, etc. — ver `api/src/domain/cobranca/dashboard-cobranca-query.ts` como referência de shape).
- Erros da API (`DomainError` subclasses, retornadas como JSON pelo Fastify) devem ser mapeados para mensagens legíveis na camada `lib/api/*`, não deixados para cada componente tratar o `Response` cru (requisito FE-CAD-R-04).
- Variável de ambiente nova para o frontend: `NEXT_PUBLIC_API_URL` (ou uso server-only `API_URL` já que a leitura é toda em Server Components — decidir na execução se algum client component precisa chamar a API diretamente; hoje nenhum requisito exige isso).

## 4. Autenticação — mecânica

1. `POST /login` (Server Action) chama um endpoint do backend a ser criado (ver gap de API em `07-frontend-autenticacao/design.md`), que devolve um JWT.
2. O Server Action grava o JWT em cookie **httpOnly, secure, sameSite=lax** via `cookies().set(...)`.
3. `middleware.ts` na raiz do projeto Next.js intercepta todas as rotas exceto `/login` e assets estáticos; se o cookie de sessão não existir, redireciona para `/login` (FE-AUTH-R-01).
4. Toda chamada Server Component/Server Action à API do backend repassa o JWT do cookie no header `Authorization: Bearer <token>`.
5. Logout (Server Action): remove o cookie e redireciona para `/login` (FE-AUTH-R-05).
6. Expiração: se o backend devolver 401, a camada `lib/api/client.ts` deve tratar isso removendo o cookie e forçando redirect para `/login` (sessão expirada) — comportamento a detalhar no `design.md` de FE-AUTH.

**Não incluído nesta decisão:** refresh token automático, RBAC, multi-tenant — fora de escopo do MVP v1 (ver `spec.md` de cada módulo).

## 5. Convenções de estrutura de pastas (App Router)

```
frontend/
├── app/
│   ├── login/
│   │   └── page.tsx
│   ├── clientes/
│   │   ├── page.tsx              # listagem (FE-CAD-01)
│   │   ├── novo/page.tsx          # cadastro (FE-CAD-02)
│   │   └── [id]/editar/page.tsx    # edição (FE-CAD-03)
│   ├── dashboard/
│   │   ├── page.tsx              # visão principal (FE-DASH-01/02/03/06)
│   │   └── cobrancas/[id]/page.tsx # detalhe (FE-DASH-04)
│   ├── layout.tsx                # já existe, vira o shell autenticado (nav, etc.)
│   └── globals.css
├── middleware.ts
├── lib/
│   ├── api/                       # ver seção 3
│   └── auth/                      # helpers de sessão (ler/gravar cookie)
├── components/                    # componentes compartilhados (Badge de status, Input, Botão — ver DesignSystem.md §5)
└── specs/                          # specs já existentes
```

## 6. O que cada `design.md` de módulo deve conter (checklist)

- [ ] Árvore de rotas/páginas do módulo (Server vs. Client Components)
- [ ] Para cada tela: dados consumidos, Server Action(s) de mutação, estados de UI (loading/erro/vazio — conforme `DesignSystem.md` §5.6)
- [ ] Componentes novos do design system que a tela introduz (badge, card, tabela, formulário)
- [ ] **Gaps de API**: endpoints que o backend ainda não expõe, com contrato esperado (rota, método, payload, resposta) — necessários antes da fase de execução do módulo
- [ ] Fora de escopo (herdado do `spec.md`, sem repetir)

## 7. Ordem sugerida de escrita dos `design.md`

Segue a ordem de dependência já registrada em `specs/README.md`:
`07-frontend-autenticacao` → `08-frontend-gestao-clientes` → `09-frontend-dashboard-cobrancas`
