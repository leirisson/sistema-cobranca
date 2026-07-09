# Regras — Dado Pessoal e LGPD (LGPD)

> Regras específicas deste módulo. Regras técnicas transversais (stack, DDD, pastas) estão em `api/specs/_geral/rules.md`.

## Decisão técnica: exclusão vs. inativação são operações distintas

- `InativarClienteUseCase` (já existente) continua sendo o fluxo padrão do dia a dia (cliente para de ser cobrado, mas dado é mantido)
- `ExcluirClienteDefinitivamenteUseCase` é uma operação nova, mais rara e mais destrutiva — exige confirmação explícita na UI (não é a mesma ação com um parâmetro a mais)

## Decisão técnica: anonimização em vez de DELETE físico quando há vínculo financeiro

- Se o cliente tem `Cobranca` associada, a exclusão SHALL substituir os campos de PII (nome, documento, telefone, e-mail, endereço) por valores anonimizados (ex: `"Cliente removido"`, documento `"00000000000"`), preservando o registro de `Cobranca`/`MensagemEnviada` para integridade contábil
- Se o cliente não tem nenhuma `Cobranca` associada, o `DELETE` pode ser físico de verdade (sem motivo para reter nada)

## Invariantes

- Log de auditoria de exclusão nunca contém o dado pessoal em si — só id do cliente (já anonimizado no momento em que o log é lido depois) e timestamp
- Exclusão nunca remove `Cobranca`/`MensagemEnviada` histórica, só desvincula/anonimiza o dado pessoal do `Cliente`

## Fora de escopo

- Portal de autoatendimento do titular
- Expurgo automático por prazo
- Processo de DPO formal
