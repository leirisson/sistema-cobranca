# Sprint 5 — FE-AVULSA (Frontend: Cobrança Avulsa)

> Status: concluída (2026-07-09) — implementada fora de ordem, sem depender da Sprint 4
> (FE-ONB), que segue não iniciada; nenhum acoplamento real existia entre os dois módulos.
> Specs de referência: `api/specs/cobranca-avulsa/spec.md`

## Objetivo

Adicionar a ação "Lançar cobrança avulsa" na tela do cliente (FE-CAD) e exibir a origem
(recorrente/avulsa) no dashboard (FE-DASH), fechando o MVP v1.3 do lado da interface.

## Tasks

- [x] Camada de API: `lib/api/cobrancas.ts` ganha `criarCobrancaManual(input)` (nome final; `clienteId` já vai dentro do `input`, não como parâmetro separado)
- [x] Rota dedicada `app/(autenticado)/clientes/[id]/nova-cobranca/page.tsx` + `components/formulario-cobranca-manual.tsx` (valor + vencimento + descrição opcional) — fluxo separado do formulário de cadastro/edição (`FormularioCliente`), acessado via link "Nova cobrança" em `components/tabela-clientes.tsx`
- [x] Origem exibida: badge "AVULSA" ao lado do nome do cliente em `components/tabela-cobrancas.tsx` (listagem do dashboard) + rótulo "Cobrança avulsa" e descrição em `app/(autenticado)/dashboard/cobrancas/[id]/page.tsx` (detalhe)

## Critérios de conclusão da sprint

- [x] Lint e typecheck limpos
- [x] Validado ponta a ponta no navegador (Playwright): lançada cobrança avulsa via API para um cliente de teste, confirmado badge "AVULSA" na listagem do dashboard e "Cobrança avulsa" + descrição no detalhe; bloqueio de cliente inativo já coberto por teste de integração do backend (`AVULSA-R-02`); cliente de teste removido do banco depois

## Próxima sprint

[Sprint 6 — FE-CANC + FE-REENVIO](sprint-06-fe-canc-reenvio.md) — depende do backend
correspondente (Sprint 8) ainda não implementado. Alternativa: Sprint 4 (FE-ONB), também
ainda não iniciada nem no backend nem no frontend.
