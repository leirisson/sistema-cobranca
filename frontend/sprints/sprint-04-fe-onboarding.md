# Sprint 4 — FE-ONB (Frontend: Onboarding / Configurações)

> Status: concluída (implementada fora de ordem, junto do backend ONB na Sprint 6 — ver nota abaixo)
> Depende de: [Sprint 3 — FE-DASH](sprint-03-fe-dash.md) (backend), [Sprint 6 — Onboarding](../../api/sprints/sprint-06-onboarding.md) (backend, `GET`/`PUT /configuracoes` precisam existir)
> Specs de referência: `api/specs/onboarding/spec.md` (o módulo ainda não tem `frontend/specs/<módulo>/` próprio — reaproveita a spec de backend até um `design.md` de frontend ser escrito)

## Objetivo

Tela `/configuracoes`: permitir configurar a chave do Asaas, conectar o WhatsApp (QR Code) e
ligar/desligar a confirmação de pagamento, sem depender de variável de ambiente/redeploy —
fecha o gap 🔴 mais bloqueante da Análise de Gaps do lado da interface.

## Nota de auditoria (2026-07-10)

Uma auditoria do estado real do frontend (não do status desta sprint) encontrou que todas as
tasks abaixo já estavam implementadas — junto com o backend do módulo ONB, na mesma etapa em
que a Sprint 6 de backend foi fechada (`claude.md`, linha do tempo, entrada "Sprint 6:
Onboarding / Configurações"). O status desta sprint nunca foi atualizado quando o trabalho foi
feito — mesmo padrão de desalinhamento já visto antes na Sprint 5/FE-AVULSA. Corrigido nesta
data, sem nenhuma mudança de código.

## Tasks

- [x] Camada de API: `lib/api/configuracoes.ts` — `obterConfiguracao`, `atualizarConfiguracao`, `conectarWhatsapp`, `obterStatusWhatsapp` (nomes finais divergem levemente do rascunho original `buscarConfiguracao`/`statusWhatsapp`)
- [x] Formulário de chave Asaas + nome remetente + toggle de confirmação — `components/formulario-configuracao.tsx` (Server Action via `lib/configuracao/actions.ts`, mesmo padrão de `lib/cliente/actions.ts`)
- [x] Bloco de conexão WhatsApp — `components/status-whatsapp.tsx`: exibe QR Code retornado pela API, faz polling do status de conexão (Server Action chamada via `useEffect`+`startTransition`, não Route Handler — decisão documentada em `claude.md`)
- [x] Link "Configurações" na sidebar — `components/sidebar.tsx:12`
- [x] Rota `app/(autenticado)/configuracoes/page.tsx`

## Critérios de conclusão da sprint

- [x] Lint e typecheck limpos
- [x] Validado ponta a ponta no navegador (Playwright): salvar chave Asaas não expõe o valor de volta em nenhuma resposta visível na tela (só "Configurada, terminada em ****XXXX"); QR Code exibido e status consultado ao vivo contra a Evolution API real
- [x] Sem sessão, `/configuracoes` redireciona para `/login` (mesmo padrão das demais rotas autenticadas, via `app/(autenticado)/layout.tsx`)

## Próxima sprint

[Sprint 5 — FE-AVULSA](sprint-05-fe-avulsa.md).
