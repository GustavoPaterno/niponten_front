# Padrão de criação de páginas — Next.js

A arquitetura das páginas será dividida em quatro níveis principais:

```text
Route → Page → Build → Components
```

Cada nível possui uma responsabilidade diferente:

- **Route:** define a URL da página.
- **Page:** ponto de entrada da rota e conexão com o Build.
- **Build:** responsável por montar a tela.
- **Components:** componentes utilizados pelo Build, podendo ser locais ou globais.

---

## 1. Route

As rotas são definidas através da estrutura de pastas do **Next.js App Router**.

Para criar uma página `/menu`:

```text
src/
└── app/
    └── menu/
        └── page.tsx
```

A pasta `menu` representa a rota:

```text
/menu
```

O arquivo `page.tsx` é reconhecido automaticamente pelo Next.js como a página daquela rota.

Não é necessário registrar manualmente a rota.

### Exemplos

```text
src/app/menu/page.tsx
```

gera:

```text
/menu
```

E:

```text
src/app/users/page.tsx
```

gera:

```text
/users
```

Para uma rota aninhada:

```text
src/app/users/create/page.tsx
```

gera:

```text
/users/create
```

---

# 2. Page

O `page.tsx` deve ser o mais simples possível.

Ele funciona como o **ponto de entrada da rota** e deve chamar o `Build` responsável pela tela.

Exemplo:

```tsx
import { MenuBuild } from "@/features/menu/MenuBuild";

export default function MenuPage() {
  return <MenuBuild />;
}
```

A `page.tsx` não deve concentrar a implementação da interface.

Evite colocar toda a implementação da tela diretamente dentro da Page.

A responsabilidade da Page é basicamente:

```text
Route
  ↓
Page
  ↓
Build
```

Isso mantém as páginas organizadas e facilita a manutenção.

---

# 3. Build

O `Build` é responsável por **construir a tela**, organizando os componentes que fazem parte dela.

A estrutura recomendada é:

```text
src/
└── features/
    └── menu/
        ├── MenuBuild.tsx
        └── components/
```

O `MenuBuild` pode ser:

```tsx
import { MenuHeader } from "./components/MenuHeader";
import { MenuGrid } from "./components/MenuGrid";

export function MenuBuild() {
  return (
    <main>
      <MenuHeader />
      <MenuGrid />
    </main>
  );
}
```

O Build conhece a estrutura da página:

```text
MenuBuild
│
├── MenuHeader
│
└── MenuGrid
    ├── MenuCard
    ├── MenuCard
    └── MenuCard
```

Ou seja, o Build **orquestra os componentes**.

---

# 4. Components locais

Componentes locais são componentes utilizados especificamente por uma determinada feature ou página.

Eles devem ficar dentro da própria feature:

```text
src/
└── features/
    └── menu/
        ├── MenuBuild.tsx
        │
        └── components/
            ├── MenuHeader.tsx
            ├── MenuGrid.tsx
            └── MenuCard.tsx
```

Exemplo:

```tsx
export function MenuCard() {
  return (
    <div>
      <h2>Usuários</h2>
      <p>Gerenciar usuários</p>
    </div>
  );
}
```

Se `MenuCard` só faz sentido dentro do Menu, ele deve permanecer em:

```text
features/menu/components/
```

### Regra

> **Componente específico de uma feature → componente local.**

Exemplos:

```text
MenuCard
UserTable
ProjectFilters
MenuHeader
```

podem ser componentes locais quando utilizados exclusivamente naquela feature.

---

# 5. Components globais

Componentes globais são aqueles que podem ser utilizados por várias partes da aplicação.

Eles ficam fora das features:

```text
src/
└── components/
    ├── ui/
    │   ├── AppButton.tsx
    │   ├── AppDialog.tsx
    │   └── AppInput.tsx
    │
    └── layout/
        ├── Header.tsx
        └── Sidebar.tsx
```

Por exemplo, se temos um botão padronizado utilizado em:

```text
/menu
/users
/projects
/settings
```

não devemos criar quatro botões diferentes.

Criamos:

```text
components/ui/AppButton.tsx
```

e reutilizamos.

### Regra

> **Componente utilizado por várias features → componente global.**

---

# 6. Estrutura final

Uma estrutura completa pode ficar assim:

```text
src/
│
├── app/
│   ├── layout.tsx
│   │
│   ├── menu/
│   │   └── page.tsx
│   │
│   ├── users/
│   │   └── page.tsx
│   │
│   └── projects/
│       └── page.tsx
│
├── features/
│   ├── menu/
│   │   ├── MenuBuild.tsx
│   │   └── components/
│   │       ├── MenuHeader.tsx
│   │       ├── MenuGrid.tsx
│   │       └── MenuCard.tsx
│   │
│   ├── users/
│   │   ├── UsersBuild.tsx
│   │   └── components/
│   │       ├── UsersTable.tsx
│   │       └── UserFilters.tsx
│   │
│   └── projects/
│       ├── ProjectsBuild.tsx
│       └── components/
│           └── ProjectCard.tsx
│
└── components/
    ├── ui/
    │   ├── AppButton.tsx
    │   └── AppDialog.tsx
    │
    └── layout/
        ├── Header.tsx
        └── Sidebar.tsx
```

---

# 7. Fluxo completo

Quando o usuário acessa:

```text
/menu
```

o fluxo será:

```text
                    /menu
                      │
                      ▼
             app/menu/page.tsx
                      │
                      ▼
              MenuBuild.tsx
                      │
              ┌───────┴────────┐
              ▼                ▼
        MenuHeader         MenuGrid
                                │
                       ┌────────┼────────┐
                       ▼        ▼        ▼
                    Card      Card      Card
```

Caso algum componente precise de algo global:

```text
MenuBuild
   │
   ├── MenuHeader
   │
   ├── MenuGrid
   │
   └── AppButton ← components/ui
```

---

# 8. Regra geral para criação de uma nova página

Ao criar uma nova página, seguir esta sequência:

### 1. Criar a Route

```text
src/app/<rota>/page.tsx
```

### 2. Criar a Feature

```text
src/features/<feature>/
```

### 3. Criar o Build

```text
src/features/<feature>/<Feature>Build.tsx
```

### 4. Criar os componentes locais

```text
src/features/<feature>/components/
```

### 5. Utilizar componentes globais quando necessário

```text
src/components/
```

### 6. Fazer a Page apontar para o Build

```tsx
import { FeatureBuild } from "@/features/feature/FeatureBuild";

export default function FeaturePage() {
  return <FeatureBuild />;
}
```

---

# 9. Resumo

A regra que será seguida é:

```text
app/
  → define ONDE a página está

page.tsx
  → define QUAL Build será executado

Build
  → define COMO a página é montada

components locais
  → peças específicas daquela página/feature

components globais
  → peças reutilizáveis pela aplicação
```

A ideia principal é manter `app/` focado em **roteamento** e deixar a implementação das funcionalidades dentro de `features/`.

Isso evita que as páginas do Next.js fiquem cheias de código e mantém cada funcionalidade isolada, organizada e reutilizável.
