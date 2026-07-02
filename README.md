# Backend CRM Pegue-e-Monte

Este é o backend do sistema CRM de Locação de Equipamentos "Pegue-e-Monte", construído com **Node.js**, **Express**, **TypeScript** e **Prisma ORM**.

## 🚀 Tecnologias

- **Runtime:** Node.js
- **Framework HTTP:** Express
- **Linguagem:** TypeScript
- **Banco de Dados:** SQLite (via Prisma ORM)
- **Validação:** Zod
- **Build/Dev:** `tsx` & `tsup`
- **Qualidade:** ESLint, Prettier & Vitest

## 📦 Passos para Rodar Localmente

### 1. Clonar o projeto (caso ainda não tenha feito)
```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd backend-boilerplate
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto (se não existir):
```env
PORT=3333
DATABASE_URL="file:./dev.db"
```

### 4. Preparar o Banco de Dados (Prisma)
Gere o Client do Prisma e rode as migrations para criar as tabelas no SQLite:
```bash
npx prisma generate
npx prisma db push
```

*(Opcional)* Você pode rodar o seed do banco para testar com dados falsos se houver seeders configurados:
```bash
npx prisma db seed
```

### 5. Iniciar o Servidor

Para rodar em ambiente de desenvolvimento (com hot reload ativo):
```bash
npm run dev
```
O servidor estará disponível em: `http://localhost:3333`

Para compilar para produção e rodar a versão final:
```bash
npm run build
npm run start
```

## 🧪 Como Testar e Validar

Você pode validar a saúde do servidor acessando o endpoint:
```
GET http://localhost:3333/health
```

Para rodar a suíte de testes unitários local:
```bash
npm run test
```

## 📐 Estrutura do Projeto (Clean Architecture)

- **Routes:** Localizadas em `src/routes`, definem os endpoints (ex: `/api/orders`, `/api/products`).
- **Controllers:** Localizados em `src/controllers`, interceptam req/res e repassam para os Services.
- **Services:** Localizados em `src/services`, abrigam a lógica de negócio (Locação, Finalização de Pedido, Atualização de Estoque).
- **Repositories:** Localizados em `src/repositories`, conversam exclusivamente com o Prisma DB.
- **Middlewares:** Tratamento de erros e logging global em `src/middlewares`.
