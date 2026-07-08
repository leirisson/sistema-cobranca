# Regras — Clientes (CAD)

> Regras específicas deste módulo. Regras técnicas transversais (stack, DDD, pastas) estão em `api/specs/_geral/rules.md`.

## Entidades principais
- `Cliente` — id, nome, telefone, email, documento, status, created_at

## Invariantes do domínio
- Nome não pode ser vazio (CAD-R-01)
- Telefone deve seguir formato E.164 (CAD-R-02)
- Dia de vencimento aceito apenas entre 1 e 28 (CAD-R-03)
- Status inicial sempre `ATIVO` (CAD-R-04)
- Cliente inativado mantém histórico de cobranças já geradas (CAD-R-05)

## Fora de escopo
- Múltiplas cobranças por cliente (1 cobrança recorrente por cliente no MVP v1)
- Campos fiscais (CNPJ, endereço completo, regime tributário)
- Multi-tenant / vínculo do cliente a uma empresa
