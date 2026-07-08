# Regras — Clientes (CAD)

> Regras específicas deste módulo. Regras técnicas transversais (stack, DDD, pastas) estão em `api/specs/_geral/rules.md`.

## Entidades principais
- `Cliente` — id, nome, documento (CPF/CNPJ), email, valorCobranca, diaVencimento, status,
  inscricaoEstadual?, endereco? (rua/numero/bairro/cidade/uf/cep), nomeContato?, referenciaServico?, created_at
- `TelefoneCliente` — id, clienteId, numero (E.164), principal (bool) — 1:N com `Cliente`

## Invariantes do domínio
- Nome não pode ser vazio (CAD-R-01)
- Pelo menos 1 telefone é obrigatório, em formato E.164; múltiplos telefones permitidos, exatamente 1 marcado `principal` (CAD-R-02, CAD-EXT-R-04)
- Dia de vencimento aceito apenas entre 1 e 28 (CAD-R-03)
- Status inicial sempre `ATIVO` (CAD-R-04)
- Cliente inativado mantém histórico de cobranças já geradas (CAD-R-05)
- Documento é obrigatório: 11 dígitos numéricos = CPF, 14 dígitos numéricos = CNPJ; nenhum outro tamanho é aceito (CAD-EXT-R-01). Sem validação de dígito verificador no v1.2.
- Endereço, inscrição estadual, nome de contato e referência de serviço são todos opcionais — ausência não bloqueia o cadastro (CAD-EXT-R-03)

## Fora de escopo
- Múltiplas cobranças por cliente (1 cobrança recorrente por cliente no MVP v1)
- Multi-tenant / vínculo do cliente a uma empresa
- Validação de dígito verificador de CPF/CNPJ
- Emissão de NF-e / campos fiscais além de documento e inscrição estadual
