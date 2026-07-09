# Design System — CobraCerta
`design-system.md`

> Referência visual e de conteúdo pros módulos de frontend (`07-frontend-autenticacao`,
> `08-frontend-gestao-clientes`, `09-frontend-dashboard-cobrancas`). Define paleta,
> tipografia, espaçamento, componentes base e tom de voz — antes de qualquer tela ser
> construída.

## 1. Princípio norteador

O usuário do CobraCerta é um prestador de serviço (oficina, clínica, escritório) que hoje
resolve cobrança no papel — os próprios orçamentos que analisamos (Norte Freios) mostram
isso: um carimbo de tinta física escrito **"PAGO"** sobre o valor total, como prova
definitiva de que aquela pendência acabou.

Esse é o ponto de partida do sistema visual: o status de uma cobrança não é só uma cor de
badge, é uma **decisão registrada** — como um carimbo. O produto é a versão digital
confiável desse gesto que o dono do negócio já faz manualmente.

**A única tarefa da tela principal é responder, em menos de 2 segundos: quem me deve
dinheiro agora?**

## 2. Paleta de cores

| Nome | Hex | Uso |
|---|---|---|
| `tinta` (primária) | `#12433D` | Cor de marca, cabeçalhos, botão primário, texto de destaque |
| `papel` (fundo) | `#F1F2ED` | Fundo geral da aplicação — neutro, levemente esverdeado, não é o creme genérico de IA |
| `grafite` (texto) | `#1C2321` | Texto principal |
| `grafite-suave` | `#5C645F` | Texto secundário, legendas, placeholders |
| `carimbo-pago` | `#2F6F4E` | Status `PAGO` |
| `carimbo-pendente` | `#C68A2E` | Status `PENDENTE` |
| `carimbo-atrasado` | `#B23A2E` | Status `ATRASADO` — mesmo tom de vermelho de carimbo/tinta |
| `carimbo-cancelado` | `#8A8F89` | Status `CANCELADO` — neutro, "desligado" |
| `linha` (bordas/divisores) | `#DAD9D0` | Bordas de tabela, divisores, inputs em repouso |

Evitamos deliberadamente o creme + terracota (`#D97757`) que hoje é o padrão visual mais
associado a interface gerada por IA, e evitamos também o fintech-verde-neon genérico. O
verde-petróleo escuro (`tinta`) foi escolhido por remeter a dinheiro/confiança sem cair no
clichê do "verde de app de banco".

## 3. Tipografia

| Papel | Fonte | Uso |
|---|---|---|
| Display (títulos) | **Fraunces** (serifada, com caráter) | Nomes de tela, valores de destaque nos cards de resumo — remete a documento/ofício, reforça o princípio do "carimbo" |
| Corpo | **Inter** | Texto de interface, labels, formulários — legibilidade em telas pequenas |
| Numérico/dado | **IBM Plex Mono** | Valores monetários, datas de vencimento, tabelas — números tabulares alinham melhor em colunas de dinheiro (evita "serrilhado" visual comum em tabela financeira com fonte proporcional) |

Escala tipográfica (base 16px):
`12 / 14 / 16 / 20 / 26 / 34 / 44px` — usar sempre um degrau da escala, nunca valores
arbitrários entre eles.

## 4. Grid e espaçamento

- Unidade base: **8px** (todo espaçamento é múltiplo de 8: 8, 16, 24, 32, 48, 64)
- Largura máxima de conteúdo: 1200px, centralizado, com padding lateral de 24px em mobile
- Cards e tabelas usam `border-radius: 6px` — cantos discretamente arredondados (não 0, que remete ao estilo jornal; não muito arredondado, que foge do tom "documento sério")

## 5. Componentes base

### 5.1 Badge de status ("carimbo")
Elemento assinatura do sistema — é o que diferencia visualmente o CobraCerta de um
dashboard financeiro genérico.
- Texto em maiúsculas, `IBM Plex Mono`, letter-spacing aumentado
- Borda dupla (2px externa + 1px interna, com espaço entre elas) na cor do status — simula o traço de um carimbo de borracha
- Leve rotação de `-4deg` **apenas** no status `PAGO` (o momento de "resolvido", o único que merece esse destaque de gesto); os demais status ficam retos, sem rotação, pra não poluir a tabela
- Fundo transparente, nunca preenchido — reforça a metáfora de tinta sobre papel, não de "etiqueta colorida"

### 5.2 Botão primário
- Fundo `tinta`, texto `papel`, `border-radius: 6px`
- Hover: leve escurecimento (não sombra/elevação — o sistema não usa sombra decorativa em nenhum componente, mantém a estética "plana feito papel")

### 5.3 Input de formulário
- Borda `linha` em repouso, borda `tinta` em foco (2px, visível — acessibilidade de foco de teclado é obrigatória, nunca `outline: none` sem substituto)
- Label sempre visível acima do campo (nunca só placeholder — placeholder some quando o usuário digita e a pessoa perde a referência do que estava preenchendo)

### 5.4 Tabela de cobranças
- Linhas com divisor `linha` fino (1px), sem zebra striping (o contraste vem do badge de status, não de fundo alternado)
- Coluna de valor sempre alinhada à direita, fonte `IBM Plex Mono`, números tabulares

### 5.5 Card de resumo (dashboard)
- Número grande em `Fraunces`, label pequeno em `Inter` maiúsculo acima do número
- Um card por métrica (a receber / recebido / em atraso), cor de destaque do número seguindo a paleta de carimbo correspondente

### 5.6 Estado vazio
- Nunca uma tabela em branco sem explicação (ver seção 6 de conteúdo) — sempre um ícone simples + frase de orientação + ação sugerida quando aplicável (ex: "Nenhum cliente cadastrado ainda" + botão "Cadastrar primeiro cliente")

## 6. Conteúdo e tom de voz

- Voz ativa, direta, sem jargão técnico: a pessoa usuária não sabe o que é "webhook" ou "gateway" — a interface fala de "cobrança", "pagamento", "cliente"
- Nomenclatura consistente ponta a ponta: se o botão diz "Cadastrar cliente", a confirmação diz "Cliente cadastrado", nunca "Registro criado com sucesso"
- Erros não se desculpam e são específicos: "Telefone inválido — use o formato +55 92 99999-9999", nunca "Ocorreu um erro"
- Nenhuma exclamação forçada de entusiasmo ("Ótimo!", "Uhul!") — o tom é o de um sistema sério de controle financeiro, não de um app de consumo

## 7. Acessibilidade (piso de qualidade, não opcional)
- Contraste mínimo AA (4.5:1) entre texto e fundo em todos os componentes, incluindo os badges de status
- Foco de teclado sempre visível (ver 5.3)
- Responsivo até a largura de um smartphone comum (360px), já que o usuário-alvo frequentemente vai checar o painel pelo celular entre atendimentos

## 8. Fora de escopo deste documento
- Identidade de marca completa (logo, naming final — "CobraCerta" segue como placeholder até definição)
- Dark mode
- Ilustrações customizadas (o sistema usa apenas ícones de linha simples, sem ilustração narrativa)