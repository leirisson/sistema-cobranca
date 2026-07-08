# Regras — Dashboard (DASH)

> Regras específicas deste módulo. Regras técnicas transversais (stack, DDD, pastas) estão em `api/specs/_geral/rules.md`.

## Decisões técnicas
- Frontend construído em Next.js, sem necessidade de design elaborado no MVP v1
- Filtro padrão: cobranças do mês corrente (DASH-R-01)
- Totais calculados por agregação (soma por status): a receber (pendente + atrasado), recebido (pago), em atraso (DASH-R-03)
- Busca por nome de cliente é case-insensitive (DASH-R-04)

## Fora de escopo
- Relatórios financeiros avançados / exportação CSV/PDF (v2)
- Fluxo de caixa projetado (v2)
- Painel de erros de emissão de nota fiscal (v3)
