# Regras — Onboarding / Configurações (ONB)

> Regras específicas deste módulo. Regras técnicas transversais (stack, DDD, pastas) estão em `api/specs/_geral/rules.md`.

## Entidades principais

- `Configuracao` — registro único (single-tenant, mesma premissa de `Usuario`, ver `claude.md` seção 9): `asaasApiKey` (opcional, cifrado), `nomeRemetente` (opcional), `confirmacaoPagamentoHabilitada` (boolean, default `false`), `evolutionInstanceStatus` (derivado, não persistido — sempre consultado ao vivo na Evolution API)

## Decisão técnica: segredo em banco

- `asaasApiKey` salva no banco precisa de cifragem em repouso (não texto plano) — usar `crypto` nativo do Node (AES-256-GCM) com uma chave de aplicação própria (`CONFIG_ENCRYPTION_KEY`, nova env var, nunca a mesma coisa que o segredo que ela protege)
- Nunca expor `asaasApiKey` decifrada em nenhuma resposta HTTP — a tela de configuração mostra só um indicador "configurado" (ex: `***último 4 dígitos`), nunca o valor completo de volta

## Decisão técnica: fallback de credencial

- `AsaasGateway` passa a receber a chave via uma porta de configuração (`ConfiguracaoRepository` ou similar), não direto de `env.ASAAS_API_KEY`
- Ordem de resolução: 1) valor salvo em `Configuracao`: 2) `env.ASAAS_API_KEY` como fallback — nunca o inverso, para a tela sempre poder sobrescrever o ambiente
- Mesma lógica se aplica a `confirmacaoPagamentoHabilitada`

## Decisão técnica: instância WhatsApp

- O status de conexão do WhatsApp NUNCA é persistido localmente como fonte de verdade — sempre consultado ao vivo via `GET /instance/connectionState/:instance` da Evolution API, para nunca divergir do estado real
- QR Code é sempre gerado sob demanda (expira em segundos, conforme já registrado em `claude.md` seção 10 — obstáculo de timing já resolvido para o setup manual, mesma lógica se aplica aqui)

## Invariantes do domínio

- Nunca persistir `asaasApiKey` em texto plano
- Nunca expor `asaasApiKey` decifrada em resposta HTTP
- Configuração é sempre um registro único (sem lista, sem `id` externo necessário — mesmo padrão de single-tenant de `Usuario`)

## Fora de escopo

- Multi-tenant
- Wizard de primeiro acesso
- Troca de gateway de pagamento
