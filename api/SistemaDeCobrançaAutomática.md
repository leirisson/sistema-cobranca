# Spec — Sistema de Cobrança Automática (CobraCerta)
## MVP v1.3 — Lançamento de Cobrança Avulsa

> Pré-requisito: MVP v1 (módulos CAD, COB, MSG, PAG, DASH, EMAIL, FE-AUTH, FE-CAD, FE-DASH) especificado.
> Este spec é incremental — documenta uma lacuna identificada depois do MVP v1.2: o sistema
> só previa cobrança recorrente automática, sem forma de lançar uma cobrança pontual fora
> desse ciclo.

## 1. Objetivo
Permitir que o usuário lance uma cobrança pontual para um cliente — com valor e vencimento
diferentes do padrão cadastrado — sem precisar esperar ou alterar a recorrência mensal já
configurada. Cobre casos como serviço extra, ajuste avulso ou cobrança fora do ciclo normal.

## 2. Contexto e decisão
Perguntado sobre o que "lançar uma cobrança" deveria significar, ficou definido:
- **Escopo escolhido:** cobrança avulsa/pontual, com valor e vencimento informados manualmente pelo usuário no momento do lançamento (não é "antecipar" a cobrança recorrente já configurada — é uma cobrança adicional e independente)
- **Disparo de mensagem:** a cobrança avulsa segue a **mesma régua automática** de lembrete, vencimento e atraso (D-5/D0/D+1/D+3) já usada pela cobrança recorrente — não há tratamento diferenciado de comunicação por origem
- **Sem parcelamento nem juros/multa automáticos** — é uma cobrança única, valor fixo definido na hora do lançamento

## 3. Escopo do MVP v1.3

### 3.1 Lançamento de cobrança avulsa (backend)
- Usuário informa: cliente, valor, vencimento (e opcionalmente uma descrição/motivo)
- Sistema cria a cobrança no gateway de pagamento e persiste localmente com status `PENDENTE`, seguindo o mesmo fluxo técnico já usado pela cobrança recorrente
- Cobrança avulsa recebe um campo de **origem** (`recorrente` | `avulsa`), usado para diferenciação visual e de relatório, sem interferir na lógica de duplicidade da recorrente
- Cliente `INATIVO` não pode receber cobrança avulsa (mesma regra da recorrente)

### 3.2 Disparo automático de mensagem
- A cobrança avulsa entra na mesma fila/régua de disparo do módulo `03-lembretes-whatsapp` (MSG) e do módulo `06-notificacao-email` (EMAIL)
- Nenhuma lógica nova de mensageria é criada — o disparo já reage a qualquer `Cobranca` persistida, independente da origem

### 3.3 Interface (frontend)
- Ação "Lançar cobrança avulsa" disponível na tela do cliente (módulo `08-frontend-gestao-clientes`, FE-CAD)
- Formulário simples e curto: valor + vencimento (+ descrição opcional) — não reaproveita o formulário de cadastro/edição de cliente, é um fluxo separado e rápido
- No dashboard (módulo `09-frontend-dashboard-cobrancas`, FE-DASH), o detalhe de uma cobrança passa a exibir a origem (recorrente/avulsa)

## 4. Modelo de dados (incremento sobre `Cobranca` do MVP v1)
```
Cobranca (campo adicionado)
- + origem: enum ("RECORRENTE" | "AVULSA")
- + descricao: string opcional (motivo da cobrança avulsa, ex: "Serviço extra - troca de peça")
```

## 5. Requisitos (WHEN / THEN / SHALL) — visão consolidada
- **AVULSA-R-01**: WHEN o usuário lança uma cobrança avulsa informando valor e vencimento, THEN o sistema SHALL criá-la no gateway de pagamento e persisti-la com status `PENDENTE` e origem `AVULSA`.
- **AVULSA-R-02**: WHEN o cliente selecionado está `INATIVO`, THEN o sistema SHALL bloquear o lançamento da cobrança avulsa.
- **AVULSA-R-03**: WHEN uma cobrança avulsa é criada, THEN o sistema SHALL disparar a mesma régua de mensagens (lembrete, vencimento, atraso) usada pela cobrança recorrente, sem exceção.
- **AVULSA-R-04**: WHEN o usuário acessa o dashboard ou o detalhe de uma cobrança, THEN o sistema SHALL exibir visualmente a origem da cobrança (recorrente/avulsa).
- **AVULSA-R-05**: WHEN uma cobrança avulsa é criada, THEN o sistema SHALL NOT afetar a checagem de duplicidade da cobrança recorrente do ciclo vigente do cliente.

## 6. Impacto em módulos já especificados
| Módulo | Mudança |
|---|---|
| `02-geracao-cobranca` (COB) | Nova user story (COB-US-04), requisitos COB-R-06 a COB-R-08, campo `origem` na entidade `Cobranca` |
| `03-lembretes-whatsapp` (MSG) | MSG-R-01 passa a cobrir explicitamente cobrança de qualquer origem |
| `06-notificacao-email` (EMAIL) | Nenhuma mudança de requisito — já reage a qualquer `Cobranca` gerada |
| `08-frontend-gestao-clientes` (FE-CAD) | Nova user story (FE-CAD-US-07), requisitos FE-CAD-R-08/09, nova tela/modal de lançamento |
| `09-frontend-dashboard-cobrancas` (FE-DASH) | FE-DASH-R-04 passa a exibir origem no detalhe da cobrança |
| `spec-mvp-v1.md` | Nova seção 3.6, novo critério de aceite, ajuste no "fora de escopo" (parcelamento/juros continuam v2, mas valor variável da avulsa não é mais exceção) |

## 7. Fora de escopo do MVP v1.3
- Parcelamento da cobrança avulsa
- Cálculo automático de juros/multa por atraso (tanto na avulsa quanto na recorrente — continua v2)
- Régua de mensagens configurável por cobrança avulsa (usa a régua fixa padrão, igual à recorrente)
- Edição de uma cobrança avulsa já criada (se lançou errado, o fluxo é cancelar e lançar de novo — não há "editar valor" de cobrança já enviada ao gateway)

# 8. Gaps 
# Análise de Gaps — CobraCerta (MVP v1)

> Revisão de tudo que já foi especificado (spec-mvp-v1/v1.2/v1.3, config, módulos 01-09,
> design system) em busca do que falta e é essencial — não cosmético, mas algo que
> bloqueia o sistema funcionar de verdade ou expõe risco (segurança, dado pessoal, dinheiro).

## 🔴 Essencial — falta e bloqueia lançar com um cliente real

### 1. Módulo de Configurações / Onboarding da empresa
Não existe hoje nenhuma tela pra o usuário:
- Conectar o próprio WhatsApp à Evolution API (parear via QR code) — sem isso, o módulo MSG não tem como funcionar na prática, e não há spec de **como esse pareamento acontece pela interface**
- Inserir a própria chave do Asaas (hoje `ASAAS_API_KEY` é variável de ambiente, ou seja, só *você* consegue configurar, manualmente, por deploy — o que é aceitável pra um piloto com 1 cliente, mas precisa ser uma decisão consciente, não um esquecimento)
- Configurar dados que aparecem nas mensagens (nome da empresa que assina o lembrete de WhatsApp/e-mail — hoje o template usa só dados do cliente, nunca do remetente)
- Ligar/desligar o toggle de "mensagem de confirmação de pagamento" (o módulo PAG já assume que esse toggle existe — PAG-R-05 — mas nenhuma tela permite mudá-lo)

**Por que é essencial:** sem isso, cada cliente novo exige que *você* mexa manualmente em variável de ambiente e reinicie o servidor pra configurar WhatsApp/Asaas — o que inviabiliza qualquer venda além do primeiro piloto.

### 2. Cancelamento de cobrança pela interface
A entidade `Cobranca` já tem `cancelar()` (regra de domínio definida desde o setup do projeto) e o módulo PAG menciona cancelamento como conceito, mas **nenhum módulo de frontend** (FE-DASH ou FE-CAD) tem uma ação de "cancelar cobrança". Hoje, se o usuário errar um lançamento ou o cliente desistir, não há como cancelar pela tela — só mexendo direto no banco.

### 3. Reenvio manual de mensagem com falha
O módulo MSG promete isso explicitamente (**MSG-US-04**: "quero saber quando um envio falhou... para poder agir manualmente") e o painel de erros é citado como dependência em MSG-05 e COB-05. Mas **nenhuma tela do frontend implementa essa ação** — o FE-DASH até menciona a possibilidade e marca como "fora de escopo, fica pro v1.1/v2". Isso é uma contradição entre módulos: o backend promete visibilidade de erro, mas ninguém consegue agir sobre ela na v1.

### 4. Contrato de API (endpoints)
Em nenhum momento formalizamos um documento de API (rotas, verbos, request/response, códigos de erro). Os módulos de frontend já referenciam endpoints específicos (`POST /clientes`, `GET /clientes`, `POST /clientes/:id/cobrancas-avulsas` etc.) espalhados em tabelas de rastreabilidade, mas não há uma fonte única da verdade. Isso é o tipo de lacuna que gera retrabalho na hora de implementar (frontend e backend divergindo sobre formato de payload).

### 5. Segurança básica da API além do webhook
Definimos token de autenticidade só pro webhook do Asaas (PAG-R-01/02). Não especificamos:
- Rate limiting no login (proteção contra força bruta) — FE-AUTH-R-03 só fala em mensagem genérica de erro, nada sobre bloqueio após N tentativas
- CORS (de onde a API aceita requisição)
- Rate limiting geral da API

### 6. Dado pessoal e LGPD
O sistema armazena CPF/CNPJ, telefone, e-mail e endereço de terceiros (os clientes do seu cliente). Não há nenhuma menção a:
- Retenção/exclusão de dado quando um cliente é removido de verdade (hoje só existe "inativar", nunca apagar)
- Base legal de tratamento (execução de contrato, no caso, é a mais óbvia — mas vale documentar)
- Isso importa principalmente pro segmento jurídico/saúde que você já mira, onde o cliente final costuma perguntar sobre isso

## 🟡 Importante — não bloqueia o piloto, mas precisa existir antes de vender pra mais gente

### 7. Setup do primeiro usuário (seed)
FE-AUTH assume que login já existe, mas não há spec de como esse primeiro usuário é criado (seed manual no banco? script de CLI? Isso é rápido de resolver, mas hoje não está em lugar nenhum).

### 8. Observabilidade operacional
Se o job diário de geração de cobrança falhar silenciosamente (Redis fora do ar, erro não tratado), quem percebe? Não há spec de alerta operacional (nem que seja simples, tipo notificação no seu próprio WhatsApp quando um job crítico falha).

### 9. `design.md` dos módulos (fase 02 do pipeline SDD)
Você validou o pipeline Specify → Design → Tasks → Execute na imagem que trouxe. Fizemos o `spec.md` (fase 1) de 9 módulos, mas nenhum `design.md` (arquitetura interna, diagrama, modelo de dados por módulo) ainda foi escrito — só existe o desenho geral no `spec-config-projeto-v1.md`. Não é bloqueante, mas é o próximo degrau natural do seu próprio processo.

## Recomendação de ordem de ataque
1. **Configurações/Onboarding** (gap 1) — sem isso o produto não escala nem pro segundo cliente
2. **Cancelamento de cobrança** (gap 2) + **reenvio manual de mensagem** (gap 3) — ambos pequenos, mas fecham promessas que os próprios specs já fizeram
3. **Contrato de API** (gap 4) — vale a pena antes de começar a codar de verdade, evita retrabalho
4. Segurança básica (gap 5) e LGPD (gap 6) — podem entrar como um adendo de segurança, não precisam de módulo dedicado
5. Seed de usuário (gap 7) e observabilidade (gap 8) — resolvidos rápido, podem ficar pro `design.md`/`tasks.md` de cada módulo em vez de spec própria