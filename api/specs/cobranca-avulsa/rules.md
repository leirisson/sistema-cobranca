# Regras — Cobrança Avulsa (AVULSA)

> Regras específicas deste módulo. Regras técnicas transversais (stack, DDD, pastas) estão em `api/specs/_geral/rules.md`. Regras da entidade `Cobranca` em si (transições de status, invariantes de gateway) continuam em `api/specs/cobrancas/rules.md` — este arquivo só cobre o incremento de `origem`/`descricao`.

## Entidades principais (incremento sobre `Cobranca`)

- `Cobranca.origem` — enum `"RECORRENTE" | "AVULSA"`, obrigatório, default `"RECORRENTE"` para não quebrar cobranças já existentes
- `Cobranca.descricao` — string opcional, motivo da cobrança avulsa

## Decisão técnica: reaproveitamento total do pipeline de COB

- `CriarCobrancaAvulsaUseCase` reaproveita a mesma porta `GatewayPagamento` e o mesmo `CobrancaRepository` do módulo `cobrancas` — não é uma cópia paralela do fluxo, é o mesmo `Cobranca.criar()` com `origem: "AVULSA"` explícito
- Nenhum novo adapter de gateway, nenhum novo canal de mensagem — MSG e EMAIL continuam reagindo a qualquer `Cobranca` persistida, independente da origem

## Invariantes do domínio

- Cobrança avulsa nunca é criada para cliente `INATIVO` (mesma invariante de COB-R-05)
- Cobrança avulsa nunca conta na checagem de duplicidade do ciclo recorrente (`existeParaCicloVigente` filtra `origem = RECORRENTE`)
- Cobrança avulsa não tem parcelamento nem cálculo automático de juros/multa

## Fora de escopo

- Parcelamento
- Juros/multa automáticos
- Régua de mensagens configurável por cobrança avulsa
- Edição de cobrança avulsa já criada (fluxo é cancelar + relançar — ver `cancelamento-cobranca`)
