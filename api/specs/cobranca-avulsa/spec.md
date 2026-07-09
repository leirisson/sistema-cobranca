# Cobrança Avulsa (MVP v1.3)
`spec.md` — fase SPECIFY

**ID do módulo:** `AVULSA`
**Escopo:** Medium
**Depende de:** `cobrancas` (COB), `mensagens` (MSG), `notificacoes-email` (EMAIL)

## Contexto

Lacuna identificada depois do MVP v1.2 (`api/SistemaDeCobrançaAutomática.md`, seção MVP v1.3):
o sistema só previa cobrança recorrente automática (módulo COB), sem forma de lançar uma
cobrança pontual fora desse ciclo — caso comum para serviço extra, ajuste avulso ou cobrança
fora do ciclo normal (evidência: prestador de manutenção veicular, mesmo perfil de cliente
que gerou o MVP v1.2).

## Decisão de escopo

- Cobrança avulsa tem valor e vencimento informados manualmente pelo usuário — **não** é
  "antecipar" a cobrança recorrente já configurada, é uma cobrança adicional e independente
- Segue a **mesma régua automática** de lembrete/vencimento/atraso (D-5/D0/D+1/D+3) já usada
  pela recorrente — sem tratamento diferenciado de comunicação por origem
- Sem parcelamento nem juros/multa automáticos — cobrança única, valor fixo definido no lançamento

## Capturar o quê

### User Stories

**AVULSA-US-01 (P1)** — Como usuário do sistema, quero lançar uma cobrança pontual para um
cliente com valor e vencimento diferentes do padrão cadastrado, para cobrar serviços extras
sem mexer na recorrência mensal já configurada.

**AVULSA-US-02 (P2)** — Como usuário do sistema, quero ver no dashboard se uma cobrança é
recorrente ou avulsa, para diferenciar visualmente na hora de conferir o extrato do cliente.

### Requisitos (WHEN / THEN / SHALL)

- **AVULSA-R-01**: WHEN o usuário lança uma cobrança avulsa informando cliente, valor e vencimento, THEN o sistema SHALL criá-la no gateway de pagamento e persisti-la com status `PENDENTE` e origem `AVULSA`, seguindo o mesmo fluxo técnico já usado pela cobrança recorrente (COB-R-02, COB-R-03).
- **AVULSA-R-02**: WHEN o cliente selecionado está `INATIVO`, THEN o sistema SHALL bloquear o lançamento da cobrança avulsa (mesma regra de COB-R-05).
- **AVULSA-R-03**: WHEN uma cobrança avulsa é criada, THEN o sistema SHALL disparar a mesma régua de mensagens (lembrete, vencimento, atraso) usada pela cobrança recorrente, sem exceção — nenhuma lógica nova de mensageria, o disparo já reage a qualquer `Cobranca` persistida.
- **AVULSA-R-04**: WHEN o usuário acessa o dashboard ou o detalhe de uma cobrança, THEN o sistema SHALL exibir visualmente a origem da cobrança (recorrente/avulsa).
- **AVULSA-R-05**: WHEN uma cobrança avulsa é criada, THEN o sistema SHALL NOT afetar a checagem de duplicidade da cobrança recorrente do ciclo vigente do cliente (COB-R-04 continua olhando só origem `RECORRENTE`).

### IDs de rastreabilidade

| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| AVULSA-01 | AVULSA-US-01 | AVULSA-R-01, AVULSA-R-02 | `CriarCobrancaAvulsaUseCase`, campo `origem`/`descricao` em `Cobranca` |
| AVULSA-02 | AVULSA-US-01 | AVULSA-R-03 | Nenhum componente novo — reaproveita `DispararLembreteInicialUseCase`/régua já existentes |
| AVULSA-03 | AVULSA-US-02 | AVULSA-R-04 | `DashboardCobrancaQuery` retorna `origem`; UI exibe badge |
| AVULSA-04 | — | AVULSA-R-05 | `CobrancaRepository.existeParaCicloVigente` filtra por `origem = RECORRENTE` |

## Modelo de dados (incremento sobre `Cobranca`)

```
Cobranca (campos adicionados)
- + origem: enum ("RECORRENTE" | "AVULSA")
- + descricao: string opcional (motivo da cobrança avulsa, ex: "Serviço extra - troca de peça")
```

## Impacto em módulos já especificados

| Módulo | Mudança |
|---|---|
| `cobrancas` (COB) | Nova user story (COB-US-04 equivalente aqui como AVULSA-US-01), campo `origem` na entidade `Cobranca`, `existeParaCicloVigente` passa a filtrar por origem |
| `mensagens` (MSG) | Nenhuma mudança de requisito — já reage a qualquer `Cobranca` gerada |
| `notificacoes-email` (EMAIL) | Nenhuma mudança de requisito |
| Frontend FE-CAD | Nova ação "Lançar cobrança avulsa" na tela do cliente |
| Frontend FE-DASH | Detalhe da cobrança passa a exibir origem |

## Fora de escopo deste módulo

- Parcelamento da cobrança avulsa
- Cálculo automático de juros/multa por atraso (v2, tanto avulsa quanto recorrente)
- Régua de mensagens configurável por cobrança avulsa (usa a régua fixa padrão)
- Edição de uma cobrança avulsa já criada — fluxo é cancelar (ver módulo `cancelamento-cobranca`) e lançar de novo
