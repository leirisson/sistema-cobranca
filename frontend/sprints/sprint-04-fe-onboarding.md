# Sprint 4 — FE-ONB (Frontend: Onboarding / Configurações)

> Status: não iniciada
> Depende de: [Sprint 3 — FE-DASH](sprint-03-fe-dash.md) (backend), [Sprint 6 — Onboarding](../../api/sprints/sprint-06-onboarding.md) (backend, `GET`/`PUT /configuracoes` precisam existir)
> Specs de referência: `api/specs/onboarding/spec.md` (o módulo ainda não tem `frontend/specs/<módulo>/` próprio — reaproveita a spec de backend até um `design.md` de frontend ser escrito)

## Objetivo

Tela `/configuracoes`: permitir configurar a chave do Asaas, conectar o WhatsApp (QR Code) e
ligar/desligar a confirmação de pagamento, sem depender de variável de ambiente/redeploy —
fecha o gap 🔴 mais bloqueante da Análise de Gaps do lado da interface.

## Tasks

- [ ] Camada de API: `lib/api/configuracoes.ts` (`buscarConfiguracao`, `atualizarConfiguracao`, `conectarWhatsapp`, `statusWhatsapp`)
- [ ] Formulário de chave Asaas + nome remetente + toggle de confirmação (Server Action, mesmo padrão de `lib/cliente/actions.ts`)
- [ ] Bloco de conexão WhatsApp: exibe QR Code retornado pela API, faz polling do status de conexão até `"open"`
- [ ] Link "Configurações" na sidebar (`components/sidebar.tsx`)
- [ ] Rota `app/(autenticado)/configuracoes/page.tsx`

## Critérios de conclusão da sprint

- [ ] Lint e typecheck limpos
- [ ] Validado ponta a ponta no navegador (Playwright): salvar chave Asaas não expõe o valor de volta em nenhuma resposta visível na tela; QR Code exibido e status atualiza após escanear de verdade
- [ ] Sem sessão, `/configuracoes` redireciona para `/login` (mesmo padrão das demais rotas autenticadas)

## Próxima sprint

[Sprint 5 — FE-AVULSA](sprint-05-fe-avulsa.md).
