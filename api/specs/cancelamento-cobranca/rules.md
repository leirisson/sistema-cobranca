# Regras — Cancelamento de Cobrança (CANC)

> Regras específicas deste módulo. Regras técnicas transversais (stack, DDD, pastas) estão em `api/specs/_geral/rules.md`.

## Decisão técnica: reaproveitar `Cobranca.cancelar()`

- A entidade `Cobranca` já protege a invariante de transição de status (não cancela `PAGO`) desde o setup inicial do projeto — este módulo não reabre essa regra, só expõe uma forma de chamá-la pela API/UI
- `CancelarCobrancaUseCase` é uma orquestração fina: busca a cobrança, chama `cobranca.cancelar()`, tenta cancelar no gateway, persiste

## Decisão técnica: cancelamento no gateway pode falhar sem bloquear o cancelamento local

- Se o cancelamento no Asaas falhar (ex: API fora do ar), o sistema ainda deve marcar a cobrança como `CANCELADO` localmente e logar o erro — não deixar o usuário travado por uma falha externa temporária
- Mesma filosofia já usada para a busca do PIX na criação da cobrança (`claude.md` seção 8, decisão de 2026-07-09: falha em chamada secundária ao gateway não bloqueia a operação principal)

## Invariantes do domínio

- Nunca cancelar cobrança já `PAGO` (herdado de `Cobranca.cancelar()`)
- Cobrança `CANCELADO` nunca aparece em `listarPendentesOuAtrasadas` (já garantido pela query existente)

## Fora de escopo

- Cancelamento em lote
- "Descancelar"
