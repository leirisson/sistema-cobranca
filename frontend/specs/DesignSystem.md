# 🎨 Design System — Minimal Medical SaaS

> Versão: 1.0.0
> Baseado no Style Guide fornecido
> Framework: Tailwind CSS v4 + React + shadcn/ui
> Fonte: Poppins

---

# 1. Filosofia

O design segue uma abordagem minimalista focada em produtos SaaS modernos.

Características:

- Muito espaço em branco
- Cantos arredondados
- Componentes suaves
- Hierarquia visual forte
- Pouco ruído visual
- Azul como cor principal
- Interface limpa
- Mobile First
- Alta legibilidade

---

# 2. Design Principles

## Simplicidade

Cada tela deve conter apenas os elementos necessários.

## Clareza

O usuário deve entender a interface em poucos segundos.

## Consistência

Todos os componentes seguem os mesmos padrões visuais.

## Hierarquia

Sempre utilizar:

Espaço → Tipografia → Cor

---

# 3. Tipografia

## Fonte

Poppins

Pesos utilizados

300
400
500
600
700

---

## Escala

| Nome | Peso | Tamanho | Altura |
|--------|------|----------|------------|
| Display | 700 | 64px | 72px |
| H1 | 700 | 48px | 56px |
| H2 | 600 | 40px | 48px |
| H3 | 600 | 32px | 40px |
| H4 | 600 | 24px | 32px |
| H5 | 500 | 20px | 28px |
| H6 | 500 | 18px | 26px |
| Body Large | 400 | 18px | 28px |
| Body | 400 | 16px | 24px |
| Small | 400 | 14px | 22px |
| Caption | 400 | 12px | 18px |

---

## Tailwind

Display

```
text-6xl
font-bold
```

H1

```
text-5xl
font-bold
```

H2

```
text-4xl
font-semibold
```

H3

```
text-3xl
font-semibold
```

Body

```
text-base
font-normal
```

Small

```
text-sm
```

Caption

```
text-xs
```

---

# 4. Cores

## Primary

50
#F4F7FF

100
#E8EEFF

200
#CDDDFF

300
#A8B1CE

400
#7B93FB

500
#5A81FA

600
#4970F4

700
#3659D7

800
#2846AE

900
#1E347F

---

## Secondary

50
#EEF1FF

100
#D9E0FF

200
#B8C6FF

300
#93A7FF

400
#667EFF

500
#2C3DBE

600
#24329E

700
#1E287D

800
#17205F

900
#111844

---

## Neutral

50
#FFFFFF

100
#F8F9FD

200
#F2F5FF

300
#E8ECF5

400
#D7DCE8

500
#A8B1CE

600
#6A6E83

700
#55586B

800
#3F4252

900
#1F1F1F

---

## Feedback

Success

#22C55E

Warning

#F59E0B

Danger

#EF4444

Info

#0EA5E9

---

# 5. Espaçamento

Sistema baseado em múltiplos de 8.

```
2
4
8
12
16
24
32
40
48
64
80
96
128
```

Tailwind

```
p-1
p-2
p-3
p-4
p-6
p-8
p-10
p-12
p-16
```

---

# 6. Radius

```
XS 6px

SM 8px

MD 12px

LG 16px

XL 20px

2XL 24px

FULL 9999px
```

Tailwind

```
rounded-md

rounded-lg

rounded-xl

rounded-2xl

rounded-full
```

---

# 7. Sombras

Card

```
0 10px 30px rgba(38,51,77,.08)
```

Button

```
0 8px 20px rgba(90,129,250,.25)
```

Modal

```
0 20px 50px rgba(38,51,77,.12)
```

Dropdown

```
0 12px 30px rgba(38,51,77,.08)
```

---

# 8. Bordas

Cor

```
#E8ECF5
```

Espessura

```
1px
```

---

# 9. Layout

Container

```
1280px
```

Content

```
1100px
```

Sidebar

```
280px
```

Header

```
72px
```

Footer

```
80px
```

Grid

```
12 colunas

Gap 24px
```

---

# 10. Botões

## Primary

Background

```
#5A81FA
```

Texto

```
White
```

Radius

```
16px
```

Height

```
48px
```

Padding

```
16px 24px
```

Hover

```
#4970F4
```

Disabled

```
#CDDDFF
```

---

## Secondary

Background

```
#2C3DBE
```

Texto

White

---

## Outline

Background

White

Border

```
#CDDDFF
```

Texto

```
#5A81FA
```

Hover

```
#F4F7FF
```

---

## Ghost

Background

Transparent

Hover

```
#F4F7FF
```

---

# 11. Inputs

Altura

48px

Radius

16px

Padding

16px

Background

White

Border

```
#E8ECF5
```

Focus

```
2px #5A81FA
```

Placeholder

```
#A8B1CE
```

Erro

```
#EF4444
```

Sucesso

```
#22C55E
```

---

# 12. Cards

Background

White

Padding

24px

Radius

20px

Shadow

Card

Border

Opcional

---

# 13. Avatar

Small

32px

Medium

40px

Large

56px

Radius

999px

Border

2px White

---

# 14. Badges

Radius

999px

Padding

```
4px 12px
```

Primary

Azul

Success

Verde

Danger

Vermelho

Warning

Amarelo

Neutral

Cinza

---

# 15. Alertas

Info

Azul

Success

Verde

Warning

Amarelo

Danger

Vermelho

Radius

16px

Padding

20px

---

# 16. Modal

Radius

24px

Padding

32px

Width

560px

Shadow

Floating

---

# 17. Sidebar

Background

White

Largura

280px

Border Right

```
#E8ECF5
```

---

# 18. Navbar

Altura

72px

Background

White

Shadow

Muito leve

---

# 19. Calendário

Radius

20px

Background

White

Botão ativo

Primary

Dias

Neutral

Hoje

Primary 100

---

# 20. Tabelas

Header

Bold

16px

Row Height

56px

Border Bottom

```
#F2F5FF
```

Hover

```
#F8F9FD
```

---

# 21. Data Visualization

Primary

```
#5A81FA
```

Secondary

```
#2C3DBE
```

Support

```
#A8B1CE
```

Grid

```
#F2F5FF
```

---

# 22. Ícones

Biblioteca

Lucide

Tamanhos

16

20

24

28

32

Cor

Gray600

Primary500

---

# 23. Animações

Duração

150ms

200ms

300ms

Easing

```
ease-out
```

Hover

```
scale-105
```

Press

```
scale-95
```

Fade

```
opacity
```

Slide

```
translateY
```

---

# 24. Componentes

## Atômicos

- Button
- IconButton
- Input
- Textarea
- Checkbox
- Radio
- Switch
- Badge
- Avatar
- Tooltip
- Spinner
- Divider

---

## Molecules

- Search Input
- User Card
- Product Card
- Calendar Card
- KPI Card
- Appointment Card
- Notification Card
- Chat Bubble

---

## Organismos

- Sidebar
- Header
- Navbar
- Dashboard
- Data Table
- Calendar
- Chat
- Kanban
- Form Builder

---

# 25. Tokens CSS (Tailwind v4)

```css
@import "tailwindcss";

@theme {

  /* Fonts */

  --font-sans: "Poppins", sans-serif;

  /* Primary */

  --color-primary-50:#F4F7FF;
  --color-primary-100:#E8EEFF;
  --color-primary-200:#CDDDFF;
  --color-primary-300:#A8B1CE;
  --color-primary-400:#7B93FB;
  --color-primary-500:#5A81FA;
  --color-primary-600:#4970F4;
  --color-primary-700:#3659D7;
  --color-primary-800:#2846AE;
  --color-primary-900:#1E347F;

  /* Secondary */

  --color-secondary-50:#EEF1FF;
  --color-secondary-100:#D9E0FF;
  --color-secondary-200:#B8C6FF;
  --color-secondary-300:#93A7FF;
  --color-secondary-400:#667EFF;
  --color-secondary-500:#2C3DBE;
  --color-secondary-600:#24329E;
  --color-secondary-700:#1E287D;
  --color-secondary-800:#17205F;
  --color-secondary-900:#111844;

  /* Neutral */

  --color-background:#F8F9FD;
  --color-surface:#FFFFFF;
  --color-border:#E8ECF5;
  --color-text:#1F1F1F;
  --color-muted:#6A6E83;

  /* Feedback */

  --color-success:#22C55E;
  --color-warning:#F59E0B;
  --color-danger:#EF4444;
  --color-info:#0EA5E9;

  /* Radius */

  --radius-sm:8px;
  --radius-md:12px;
  --radius-lg:16px;
  --radius-xl:20px;
  --radius-2xl:24px;

  /* Shadows */

  --shadow-card:0 10px 30px rgb(38 51 77 / 8%);
  --shadow-floating:0 20px 50px rgb(38 51 77 / 12%);
  --shadow-button:0 8px 20px rgb(90 129 250 / 25%);
}
```

---

# 26. Linguagem Visual

- Interface clara com predominância de branco.
- Azul como cor de destaque para ações primárias.
- Componentes com cantos arredondados entre **16px e 24px**.
- Sombras suaves para criar profundidade sem excesso.
- Ícones lineares (Lucide/Heroicons).
- Tipografia Poppins com pesos 400–700.
- Layout baseado em grid de 12 colunas e espaçamento de 8px.
- Animações discretas (150–300ms) com foco em fluidez.
- Ideal para aplicações SaaS, dashboards, sistemas médicos, financeiros e administrativos.