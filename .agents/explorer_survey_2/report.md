# Comprehensive Codebase Audit & Architectural Critique Report

**Auditor**: `explorer_survey_2` (Codebase Audit Explorer)  
**Date**: 2026-09-08 / 2026-09-09 UTC  
**Target Codebase**: `/home/workspace/backend-boilerplate`  
**Reference Specification**: `/home/workspace/backend-boilerplate/GEMINI.md`  

---

## Executive Summary

A comprehensive code-level audit was conducted across all layers of the backend boilerplate (Routes, Controllers, Services, Repositories, Middlewares, Domain, Schemas, and Tests) against the engineering guidelines mandated in `GEMINI.md`.

While the project demonstrates a solid modern TypeScript foundation (Express 5, Prisma 7, Zod, Winston, Vitest), our audit uncovered **32 critical and major architectural and code quality deviations** across 9 foundational dimensions. Notably:
1. **Broken TypeScript Compilation**: Executing `npx tsc --noEmit` yields **53 compilation errors** across 13 files, caused by Zod 4 incompatibility (`err.errors`), Express 5 param typing (`string | string[]`), non-existent enum members (`OrderState.TOTAL_LOSS`), broken Prisma internal imports (`@prisma/client/runtime/library`), and improperly typed Vitest mocks.
2. **Layering & Repository Bypasses**: `GetDashboardStatsService` directly bypasses the repository layer by executing 5 Prisma queries inside the service. Furthermore, route modules instantiate database connection pools and concrete services, breaking layering isolation.
3. **Pervasive Bypass of Global Error Handler**: `ProductController` and `OrderController` manually catch errors and return custom JSON responses instead of delegating to Express `next(error)` and the centralized `errorHandler`.
4. **Input Validation Gaps**: Request parameters (`req.params.id`, `req.params.orderId`) are **never validated with Zod** across any endpoint, violating the strict Zod boundary mandate. Schemas are defined inline inside controller methods rather than isolated in the schema layer.
5. **Security & Reliability Vulnerabilities**: CORS is unconfigured (allowing any origin `*`); multiple separate PostgreSQL connection pools are instantiated across route files; mutations lack database transactions (ACID violations); and unpaginated database queries threaten memory and latency under load.

Below is the detailed evaluation per category, including file paths, line citations, guideline references, violation analyses, and concrete code diffs.

---

## Audit Findings by Category

### 1. SOLID & Clean Code

#### Finding 1.1: Multi-Role Responsibilities in Route Modules (SRP Violation)
- **File & Lines**:
  - `src/routes/order.routes.ts`: Lines 17–46
  - `src/routes/product.routes.ts`: Lines 13–32
  - `src/routes/kit.routes.ts`: Lines 11–26
  - `src/routes/dashboard.routes.ts`: Lines 8–14
- **GEMINI.md Guideline**:
  > "1. **SOLID & Clean Code:** Priorize funções pequenas, com responsabilidade única."  
  > "1. **Separação de Responsabilidades (Camadas):** Routes: Apenas mapeiam os endpoints para os controllers."
- **Violation Analysis**:
  Route files act as ad-hoc composition roots. In addition to defining routes, each route file instantiates a `pg.Pool`, a `PrismaClient`, repository instances, service instances, and controller instances. This tightly couples route definitions to database infrastructure and lifecycle management, violating Single Responsibility.
- **Actionable Recommendation**:
  Centralize infrastructure (Prisma, Pool) into a dedicated database module (`src/infra/database.ts` or `src/lib/prisma.ts`), create a dependency injection container / factory (`src/container.ts`), and keep route files strictly responsible for mapping URL endpoints to controller methods.
```diff
--- a/src/routes/order.routes.ts
+++ b/src/routes/order.routes.ts
-const connectionString = `${process.env.DATABASE_URL}`;
-const pool = new Pool({ connectionString });
-const adapter = new PrismaPg(pool);
-const prisma = new PrismaClient({ adapter });
-
-const orderRepository = new OrderRepository(prisma);
-// ...instantiations...
+import { orderController } from "../container";
 export const orderRoutes = Router();
-orderRoutes.post("/quotes", (req, res, next) => orderController.createQuote(req, res, next));
+orderRoutes.post("/quotes", orderController.createQuote);
```

#### Finding 1.2: Repository Bleed Across Aggregate Boundaries (SRP Violation)
- **File & Lines**:
  - `src/repositories/ProductRepository.ts`: Lines 99–130 (`addAssets`, `getAvailableAssets`, `removeAssets`)
  - `src/repositories/OrderRepository.ts`: Lines 83–91 (`updateAssetStates`)
- **GEMINI.md Guideline**:
  > "1. **SOLID & Clean Code:** Priorize funções pequenas, com responsabilidade única."  
  > "Repositories/DAOs: Única camada responsável por interagir com o banco de dados."
- **Violation Analysis**:
  `ProductRepository` contains methods directly creating, querying, and deleting records from the `Asset` table (`prisma.asset.createMany`, `prisma.asset.findMany`, `prisma.asset.deleteMany`). Similarly, `OrderRepository` mutates the `Asset` table directly. This blurs repository boundaries and duplicates asset query logic across multiple repositories instead of encapsulating asset operations within `AssetRepository`.
- **Actionable Recommendation**:
  Move asset manipulation methods exclusively to `AssetRepository`. When services require coordinated changes across Products/Orders and Assets, coordinate via services injecting both repositories or utilizing unit of work / transaction helpers.

#### Finding 1.3: Concrete Class Injections Violating Dependency Inversion (DIP)
- **File & Lines**:
  - `src/services/UpdateOrderService.ts`: Line 13
  - `src/services/DeleteOrderService.ts`: Line 6
  - `src/services/CreateProductService.ts`: Line 15
  - `src/services/SearchProductsService.ts`: Line 11
  - `src/services/UpdateProductService.ts`: Line 15
  - `src/services/UpdateProductStockService.ts`: Line 10
  - `src/services/DeleteProductService.ts`: Line 6
  - `src/services/CreateKitService.ts`: Line 6
  - `src/services/ListKitsService.ts`: Line 4
  - `src/services/ToggleFavoriteKitService.ts`: Line 6
- **GEMINI.md Guideline**:
  > "1. **SOLID & Clean Code:** ... Inversão de Dependência."  
  > "1. **Cultura de Testes:** Escreva código pensando em como ele será testado. O código deve ser fácil de ser *mockado* (Inversão de Dependência)."
- **Violation Analysis**:
  Unlike `CreateQuoteService` and `ConfirmOrderService` which define and inject repository interfaces (`IOrderRepository`, `IAssetRepository`), the listed services inject concrete repository classes directly (`constructor(private readonly productRepository: ProductRepository)`). This tightly couples business logic to concrete database implementations, violating DIP and complicating testing.
- **Actionable Recommendation**:
  Extract interfaces for all repositories (e.g. `IProductRepository`, `IKitRepository`, `IOrderRepository`) in domain/service contracts and inject the interfaces into the service constructors.

#### Finding 1.4: Code Smells: Dummy DB Update Calls Used as Read Queries
- **File & Lines**:
  - `src/services/UpdateProductStockService.ts`: Lines 30 & 59
  - `src/services/DeleteProductService.ts`: Line 9
- **GEMINI.md Guideline**:
  > "1. **SOLID & Clean Code:** Priorize funções pequenas, com responsabilidade única."  
  > "O código deve ser lido como uma documentação."
- **Violation Analysis**:
  In `UpdateProductStockService.ts`:
  ```typescript
  // Actually, we can just use Prisma directly or add a findWithAssets to the repo...
  const productWithAssets = await this.productRepository.update(id, {}); // update with empty data returns include: {assets: true}
  ```
  Calling `update(id, {})` as a workaround to fetch product relationships is an egregious anti-pattern. It triggers unnecessary database writes, updates the `updatedAt` timestamp, acquires row-level write locks, and obscures code intent.
- **Actionable Recommendation**:
  Implement explicit query methods on `ProductRepository`:
```typescript
public async findByIdWithAssets(id: string): Promise<ProductWithAssets | null> {
  return this.prisma.productBase.findUnique({
    where: { id },
    include: { assets: true },
  });
}
```

---

### 2. Design Patterns

#### Finding 2.1: Complete Bypass of Repository Pattern in Dashboard
- **File & Lines**:
  - `src/routes/dashboard.routes.ts`: Line 13
  - `src/services/GetDashboardStatsService.ts`: Lines 5–67
- **GEMINI.md Guideline**:
  > "2. **Design Patterns:** Utilize padrões adequados quando resolverem problemas reais (ex: Factory, Strategy, Repository)..."  
  > "1. **Separação de Responsabilidades (Camadas):** Repositories/DAOs: Única camada responsável por interagir com o banco de dados."
- **Violation Analysis**:
  `GetDashboardStatsService` completely bypasses the Repository pattern. It injects `PrismaClient` directly and performs 5 direct ORM operations (`prisma.asset.count`, `prisma.order.groupBy`, `prisma.order.count`, `prisma.order.aggregate`, `prisma.order.findMany`) inside the service.
- **Actionable Recommendation**:
  Create `DashboardRepository` implementing `IDashboardRepository` that encapsulates these analytical queries.

#### Finding 2.2: ORM / Database Error Code Leakage into Application Services
- **File & Lines**:
  - `src/services/DeleteProductService.ts`: Lines 25–34
- **GEMINI.md Guideline**:
  > "1. **Separação de Responsabilidades (Camadas):** Services/Use Cases: Onde vive a regra de negócio da aplicação. Repositories/DAOs: Única camada responsável por interagir com o banco de dados."
- **Violation Analysis**:
  `DeleteProductService` explicitly catches `Prisma.PrismaClientKnownRequestError` and inspects proprietary Prisma error code `"P2003"`:
  ```typescript
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
    throw new AppError("Não é possível excluir este produto pois ele possui histórico de locações...", 400);
  }
  ```
  Leaking ORM-specific exception types and error codes into application services couples business logic directly to Prisma.
- **Actionable Recommendation**:
  Translate database constraint errors inside the repository into domain-specific exceptions (e.g., `ResourceInUseError` or `ConflictError`), or pre-check if the product has associated order items before issuing the delete call.

#### Finding 2.3: Procedural State Handling Lacking Encapsulation (State/Strategy Opportunity)
- **File & Lines**:
  - `src/services/ConfirmOrderService.ts`: Lines 46–51
  - `src/services/FinishOrderService.ts`: Lines 31–37
  - `src/services/UpdateOrderService.ts`: Lines 27–33
  - `src/services/DeleteOrderService.ts`: Lines 15–27
- **GEMINI.md Guideline**:
  > "2. **Design Patterns:** Utilize padrões adequados quando resolverem problemas reais (ex: Factory, Strategy, Repository)..."
- **Violation Analysis**:
  Valid order state transitions and permissions are procedurally scattered across four different services with disparate array checks and manual condition logic.
- **Actionable Recommendation**:
  Model order states using a lightweight State Machine or domain entity method (e.g. `order.canTransitionTo(nextState)`) in `src/domain/OrderState.ts`.

---

### 3. Naming

#### Finding 3.1: Inconsistent File Naming Conventions Across Layers
- **File & Lines**:
  - `src/controllers/order.controller.ts` vs `src/controllers/ProductController.ts`, `src/controllers/KitController.ts`, `src/controllers/DashboardController.ts`
  - `src/routes/order.routes.ts`, `src/routes/product.routes.ts` (kebab/dot notation) vs `src/services/CreateQuoteService.ts` (PascalCase)
- **GEMINI.md Guideline**:
  > "3. **Nomenclatura:** Use nomes descritivos em inglês para variáveis, funções e classes. O código deve ser lido como uma documentação."
- **Violation Analysis**:
  The codebase mixes kebab-case dot-separated file naming (`order.controller.ts`, `errorHandler.middleware.ts`) with PascalCase class-file naming (`ProductController.ts`, `CreateProductService.ts`).
- **Actionable Recommendation**:
  Standardize file naming across the entire project. For TypeScript backend classes, standardize either on PascalCase (`OrderController.ts`, `ProductController.ts`) or kebab-case with suffix (`order.controller.ts`, `product.controller.ts`).

#### Finding 3.2: Hardcoded Portuguese in Error Messages and Responses
- **File & Lines**:
  - `src/controllers/order.controller.ts`: Lines 102, 117 (`"Erro interno ao atualizar pedido"`, `"Erro interno ao excluir pedido"`)
  - `src/controllers/ProductController.ts`: Lines 35, 36, 62, 87, 112, 127 (`"Erro interno ao criar produto"`, etc.)
  - `src/services/CreateQuoteService.ts`: Line 98 (`"Estoque insuficiente para o produto..."`)
  - `src/services/ConfirmOrderService.ts`: Line 78 (`"Conflito de reserva detectado..."`)
  - `src/services/UpdateOrderService.ts`: Lines 24, 32, 43, 61 (`"Pedido não encontrado."`, etc.)
  - `src/services/DeleteOrderService.ts`: Lines 12, 24 (`"Pedido não encontrado."`, etc.)
  - `src/services/CreateProductService.ts`: Lines 19, 22, 25 (`"O preço por dia deve ser maior que zero."`, etc.)
  - `src/services/UpdateProductService.ts`: Lines 20, 24
  - `src/services/UpdateProductStockService.ts`: Lines 14, 19, 48
  - `src/services/DeleteProductService.ts`: Lines 11, 17, 30
  - `src/app.ts`: Line 20 (`"Muitas requisições deste IP, tente novamente mais tarde."`)
  - `prisma/schema.prisma`: Line 31 (`enum ProductCategory { LOUÇAS }`)
- **GEMINI.md Guideline**:
  > "3. **Nomenclatura:** Use nomes descritivos em inglês para variáveis, funções e classes. O código deve ser lido como uma documentação."
- **Violation Analysis**:
  The codebase contains extensive hardcoded Portuguese strings in user-facing API error payloads, logger messages, rate limiter messages, and even database enums (`LOUÇAS` with non-ASCII special character `Ç`). This directly violates the English naming standard.
- **Actionable Recommendation**:
  Convert all error messages, enum values (`TABLEWARE` instead of `LOUÇAS`), log statements, and rate-limiting responses to English.

#### Finding 3.3: Misleading Method Semantics in CustomerRepository
- **File & Lines**:
  - `src/repositories/CustomerRepository.ts`: Lines 6–31 (`upsertCustomer`)
- **GEMINI.md Guideline**:
  > "3. **Nomenclatura:** Use nomes descritivos em inglês para variáveis, funções e classes. O código deve ser lido como uma documentação."
- **Violation Analysis**:
  The method is named `upsertCustomer`, but if the customer is found, it does **not** update their fields (name, phone) with the newly provided data; it simply returns the existing record. The name is misleading.
- **Actionable Recommendation**:
  Either perform a genuine update on match (`findOrCreateOrUpdate`) or rename the method to `findOrCreateCustomer`.

---

### 4. Rigorous Typing

#### Finding 4.1: Broken Strict TypeScript Compilation (53 Errors)
- **File & Lines**: 13 files across `src/controllers`, `src/middlewares`, `src/repositories`, `src/routes`, `src/services`, and `src/tests`.
- **GEMINI.md Guideline**:
  > "4. **Tipagem Rigorosa:** O TypeScript deve ser configurado em modo `strict`. Nunca utilize o tipo `any`. Se o tipo for desconhecido, use `unknown` e faça asserções seguras."
- **Violation Analysis**:
  Running `npx tsc --noEmit` fails with **53 errors**:
  1. `src/controllers/ProductController.ts` & `src/controllers/order.controller.ts`: In Express 5, `req.params` returns `string | string[]`. Passing `req.params.id` without Zod validation or narrowing causes `Type 'string | string[]' is not assignable to type 'string'`.
  2. `src/controllers/ProductController.ts:33, 56, 82, 107`, `order.controller.ts:96`, `errorHandler.middleware.ts:31`: `Property 'errors' does not exist on type 'ZodError'` (Zod 4 replaces `.errors` with `.issues`).
  3. `src/routes/order.routes.ts:33, 34`: Incompatible return types between `OrderRepository` and `IOrderRepository` (Prisma `Decimal` vs `number | string`, and missing `assets` property in `updateState`).
  4. `src/routes/order.routes.ts:63, 66`: Passing 3 arguments `(req, res, next)` to `OrderController.update` and `delete` which only accept 2 arguments.
  5. `src/repositories/AssetRepository.ts:22` & `src/services/CreateQuoteService.ts:45`: Module `@prisma/client/runtime/library` cannot be found.
  6. `src/services/DeleteOrderService.ts:19`, `FinishOrderService.ts:34`, `UpdateOrderService.ts:30`: Property `'TOTAL_LOSS'` does not exist on `OrderState`.
  7. `src/tests/services/*.spec.ts`: Mock typing errors (`Property 'findById' does not exist on type 'Mock<Procedure>'`).
- **Actionable Recommendation**:
  Resolve all compilation errors by aligning types, validating `req.params` with Zod (which narrows to `string`), updating Zod error references to `.issues`, aligning repository interfaces, and fixing mock typings.

#### Finding 4.2: Unsafe Type Assertions on Caught Unknown Errors
- **File & Lines**:
  - `src/controllers/ProductController.ts`: Lines 58, 84, 109, 124
  - `src/controllers/order.controller.ts`: Lines 98, 113
- **GEMINI.md Guideline**:
  > "4. **Tipagem Rigorosa:** Nunca utilize o tipo `any`. Se o tipo for desconhecido, use `unknown` e faça asserções seguras."
- **Violation Analysis**:
  Controllers catch `error: unknown` and immediately cast it without runtime validation:
  ```typescript
  const err = error as { statusCode?: number; message?: string };
  const statusCode = err.statusCode || 500;
  ```
  If `error` is not an object (or `null`), this assertion is unsafe and can lead to unhandled runtime exceptions.
- **Actionable Recommendation**:
  Remove local catch blocks and let the global `errorHandler` process errors, or implement a type guard:
```typescript
function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
```

#### Finding 4.3: Missing Explicit Return Types on Public Methods
- **File & Lines**:
  - `src/services/GetDashboardStatsService.ts`: Line 7 (`public async execute()`)
  - `src/services/CreateQuoteService.ts`: Line 62 (`public async execute(...)`)
  - `src/services/ListOrdersService.ts`: Line 10
  - `src/services/CreateProductService.ts`: Line 17
  - `src/services/SearchProductsService.ts`: Line 13
  - `src/services/UpdateProductService.ts`: Line 17
  - `src/services/UpdateProductStockService.ts`: Line 12
  - `src/services/DeleteProductService.ts`: Line 8
  - `src/repositories/ProductRepository.ts`: Lines 6, 44, 50, 80, 99, 113, 124, 132
- **GEMINI.md Guideline**:
  > "4. **Tipagem Rigorosa:** O TypeScript deve ser configurado em modo `strict`."
- **Violation Analysis**:
  Relying on implicit type inference for public API service and repository boundaries weakens contract clarity and increases the risk of inadvertent contract breaks.
- **Actionable Recommendation**:
  Explicitly declare return type interfaces for all public service and repository methods.

---

### 5. Separation of Responsibilities / Layering

#### Finding 5.1: Database Query Logic in Service Layer (Repository Bypass)
- **File & Lines**:
  - `src/services/GetDashboardStatsService.ts`: Lines 5–67
- **GEMINI.md Guideline**:
  > "1. **Separação de Responsabilidades (Camadas):**
  >    - Services/Use Cases: Onde vive a regra de negócio da aplicação.
  >    - Repositories/DAOs: Única camada responsável por interagir com o banco de dados."
- **Violation Analysis**:
  `GetDashboardStatsService` contains 5 Prisma database queries directly embedded within the service class. The repository layer is completely absent for dashboard metrics.
- **Actionable Recommendation**:
  Introduce `DashboardRepository` and define `IDashboardRepository` with method `getStats(): Promise<DashboardStatsData>`.

#### Finding 5.2: Business Logic & Domain Rule Leaks in Repositories
- **File & Lines**:
  - `src/repositories/ProductRepository.ts`: Lines 68–71, 107–108
- **GEMINI.md Guideline**:
  > "1. **Separação de Responsabilidades (Camadas):** Repositories/DAOs: Única camada responsável por interagir com o banco de dados."
- **Violation Analysis**:
  Asset serial number generation formatting (`${namePrefix.substring(0, 3).toUpperCase()}-${Date.now()}-${index}`) is a domain business rule, yet it is hardcoded inside `ProductRepository`. Repositories should persist entities, not compute business identifiers.
- **Actionable Recommendation**:
  Move serial number generation into a domain factory or service (e.g. `SerialNumberGenerator` or `AssetFactory.create(...)`).

#### Finding 5.3: Inline Route Handlers in `src/app.ts`
- **File & Lines**:
  - `src/app.ts`: Lines 31–33
- **GEMINI.md Guideline**:
  > "1. **Separação de Responsabilidades (Camadas):** Routes: Apenas mapeiam os endpoints para os controllers."
- **Violation Analysis**:
  The healthcheck route is implemented inline directly inside `src/app.ts`:
  ```typescript
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime() });
  });
  ```
- **Actionable Recommendation**:
  Extract healthcheck to `src/routes/health.routes.ts` and `src/controllers/HealthController.ts`.

---

### 6. Input Validation

#### Finding 6.1: Complete Lack of Validation on Request Parameters (Params)
- **File & Lines**:
  - `src/controllers/order.controller.ts`:
    - Line 42: `const { orderId } = req.params;` in `confirmOrder`
    - Line 61: `const { id } = req.params;` in `finishOrder`
    - Line 83: `const { id } = req.params;` in `update`
    - Line 107: `const { id } = req.params;` in `delete`
  - `src/controllers/ProductController.ts`:
    - Line 67: `const { id } = req.params;` in `update`
    - Line 93: `const { id } = req.params;` in `updateStock`
    - Line 118: `const { id } = req.params;` in `delete`
  - `src/controllers/KitController.ts`:
    - Line 53: `const { id } = req.params;` in `toggleFavorite`
- **GEMINI.md Guideline**:
  > "2. **Validação:** Toda entrada de dados (Body, Params, Query) deve ser estritamente validada usando **Zod** antes de chegar aos Services."
- **Violation Analysis**:
  `req.params` is passed directly into services without any Zod validation across every single parameterized route in the application. Invalid strings or malformed UUIDs pass straight to the database layer.
- **Actionable Recommendation**:
  Create a common parameter schema and validate via middleware or controller:
```typescript
export const idParamSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
});
```

#### Finding 6.2: Missing Query String Validation in Order and Kit Endpoints
- **File & Lines**:
  - `src/controllers/order.controller.ts`: Line 69 (`listOrders`)
  - `src/controllers/KitController.ts`: Line 38 (`list`)
- **GEMINI.md Guideline**:
  > "2. **Validação:** Toda entrada de dados (Body, Params, Query) deve ser estritamente validada usando **Zod** antes de chegar aos Services."
- **Violation Analysis**:
  `listOrders` and `list` accept incoming queries without any Zod schema definition or validation, preventing pagination or filtering parameters from being verified.
- **Actionable Recommendation**:
  Define query schemas (`paginationQuerySchema`) for all list endpoints.

#### Finding 6.3: Inline Schema Definitions Bypassing Centralized Schemas
- **File & Lines**:
  - `src/controllers/ProductController.ts`: Lines 20–25, 41–48, 68–74, 94–96
  - `src/controllers/KitController.ts`: Lines 16–27, 49–51
  - `src/controllers/order.controller.ts`: Lines 84–88
- **GEMINI.md Guideline**:
  > "2. **Validação:** Toda entrada de dados (Body, Params, Query) deve ser estritamente validada usando **Zod** antes de chegar aos Services."
- **Violation Analysis**:
  Schemas are defined inline inside controller methods instead of being colocated in `src/schemas/`. Only `src/schemas/order.schema.ts` exists in the schema directory.
- **Actionable Recommendation**:
  Create `src/schemas/product.schema.ts`, `src/schemas/kit.schema.ts`, and `src/schemas/common.schema.ts`.

---

### 7. Error Handling

#### Finding 7.1: Bypass of Global Error Middleware in Controllers
- **File & Lines**:
  - `src/controllers/ProductController.ts`: Lines 31–37, 54–63, 80–89, 105–114, 123–129
  - `src/controllers/order.controller.ts`: Lines 94–103, 112–118
- **GEMINI.md Guideline**:
  > "3. **Tratamento de Erros:** Crie um middleware de erro global. Nunca exponha *stack traces* sensíveis em produção. Utilize classes de erro customizadas (ex: `AppError`)."
- **Violation Analysis**:
  Rather than calling `next(error)` to hand errors to `errorHandler.middleware.ts`, `ProductController` and `OrderController.update/delete` catch errors locally and generate ad-hoc HTTP responses. In `product.routes.ts`, `next` is not even passed to the controller methods (`(req, res) => productController.index(req, res)`).
- **Actionable Recommendation**:
  Delegate all error handling to the global error middleware via `next(error)`.

#### Finding 7.2: Inconsistent Error Response Contract Across Application
- **File & Lines**:
  - `src/middlewares/errorHandler.middleware.ts`: Line 20 (`{ error: err.message }`), Line 31 (`{ error: "Validation failed", details: ... }`), Line 35 (`{ error: "Internal server error" }`)
  - `src/controllers/order.controller.ts`: Line 102 (`{ message: ... }`), Line 96 (`{ error: ... }`)
  - `src/controllers/ProductController.ts`: Line 36 (`{ error: ... }`), Line 62 (`{ message: ... }`)
- **GEMINI.md Guideline**:
  > "3. **Tratamento de Erros:** Crie um middleware de erro global... Utilize classes de erro customizadas (ex: `AppError`)."
- **Violation Analysis**:
  The API responds with `{ error: string }` in some endpoints and `{ message: string }` in others. For validation errors, some return `{ details: ... }` and others return `{ error: ZodIssue[] }`.
- **Actionable Recommendation**:
  Establish a uniform error response envelope:
```json
{
  "status": "error",
  "message": "Human readable error description",
  "code": "ERROR_CODE",
  "details": []
}
```

#### Finding 7.3: Security Hazard: Unsanitized Request Headers in Logger
- **File & Lines**:
  - `src/middlewares/logging.middleware.ts`: Line 44
- **GEMINI.md Guideline**:
  > "2. **Dados Sensíveis:** Nunca hardcode credenciais. Sempre utilize variáveis de ambiente (`process.env`)."  
  > "1. **Proteção:** ... headers HTTP de segurança..."
- **Violation Analysis**:
  Line 44 logs `headers: req.headers` verbatim. This prints sensitive headers (`authorization`, `cookie`, `x-api-key`) directly into log outputs, representing a critical credential leakage vulnerability.
- **Actionable Recommendation**:
  Sanitize headers before logging by stripping or redacting sensitive keys:
```diff
--- a/src/middlewares/logging.middleware.ts
+++ b/src/middlewares/logging.middleware.ts
+  const sanitizedHeaders = { ...req.headers };
+  delete sanitizedHeaders.authorization;
+  delete sanitizedHeaders.cookie;
   logger.info("Request started", {
     method: req.method,
     url: req.url,
     ip: req.ip,
     userAgent: req.get("User-Agent"),
-    headers: req.headers,
+    headers: sanitizedHeaders,
   });
```

---

### 8. Security & Performance

#### Finding 8.1: Insecure Default CORS Policy
- **File & Lines**:
  - `src/app.ts`: Line 25
- **GEMINI.md Guideline**:
  > "1. **Proteção:** Sempre implemente CORS configurado corretamente, `helmet` para headers HTTP de segurança, e *Rate Limiting* para prevenir força bruta."
- **Violation Analysis**:
  `app.use(cors())` is invoked without configuration options. By default, `cors()` sets `Access-Control-Allow-Origin: *`, allowing arbitrary external domains to issue authenticated or credentialed requests against the API.
- **Actionable Recommendation**:
  Configure CORS with an origin whitelist sourced from environment variables:
```typescript
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new AppError('Blocked by CORS policy', 403));
    }
  },
  credentials: true,
}));
```

#### Finding 8.2: Connection Pool Exhaustion Risk from Multiple Prisma Clients
- **File & Lines**:
  - `src/routes/order.routes.ts`: Lines 17–20
  - `src/routes/product.routes.ts`: Lines 13–16
  - `src/routes/kit.routes.ts`: Lines 11–14
  - `src/routes/dashboard.routes.ts`: Lines 8–11
- **GEMINI.md Guideline**:
  > "3. **Performance:** Sugira paginação para listas longas, queries otimizadas no banco, e índices adequados para buscas frequentes."
- **Violation Analysis**:
  Four separate `pg.Pool` instances and four separate `PrismaClient` instances are created at runtime. Under concurrency, this consumes 4x the configured database connections, rapidly exhausting PostgreSQL's `max_connections`.
- **Actionable Recommendation**:
  Instantiate a single shared `PrismaClient` singleton in `src/infra/database.ts` and import it across repositories.

#### Finding 8.3: Unpaginated Database Queries on Large Collections
- **File & Lines**:
  - `src/repositories/OrderRepository.ts`: Lines 55–71 (`findAll`)
  - `src/repositories/KitRepository.ts`: Lines 43–54 (`findAll`)
  - `src/services/ListOrdersService.ts`: Line 11
  - `src/services/ListKitsService.ts`: Line 7
- **GEMINI.md Guideline**:
  > "3. **Performance:** Sugira paginação para listas longas, queries otimizadas no banco, e índices adequados para buscas frequentes."
- **Violation Analysis**:
  `OrderRepository.findAll()` performs a findMany query loading **all** orders in the database, including nested customer relations, nested assets, and nested products. As order history grows, this causes memory exhaustion (OOM) and massive latency spikes. `KitRepository.findAll()` suffers from the exact same issue.
- **Actionable Recommendation**:
  Enforce pagination (`page`, `limit`) with default limits (e.g. max 50) on `findAll` in `OrderRepository` and `KitRepository`.

#### Finding 8.4: Missing Database Indexes on High-Frequency Query Fields
- **File & Lines**:
  - `prisma/schema.prisma`: Models `Order`, `Asset`, `KitItem`, `OrderAsset`
- **GEMINI.md Guideline**:
  > "3. **Performance:** Sugira paginação para listas longas, queries otimizadas no banco, e índices adequados para buscas frequentes."
- **Violation Analysis**:
  High-frequency query fields completely lack indexes:
  - `Order`: `state`, `pickUpDate`, `returnDate`, and `customerId` are queried on every quote check and dashboard metric without index support.
  - `Asset`: `productBaseId` and `state` are queried together on every availability check (`findAvailableAssetsForProduct`), resulting in full table scans.
  - `KitItem`: Foreign keys `kitId` and `productBaseId` lack indexes.
- **Actionable Recommendation**:
  Add composite indexes in `prisma/schema.prisma`:
```prisma
model Order {
  // ...
  @@index([customerId])
  @@index([state])
  @@index([pickUpDate, returnDate])
}

model Asset {
  // ...
  @@index([productBaseId, state])
}

model KitItem {
  // ...
  @@index([kitId])
  @@index([productBaseId])
}
```

#### Finding 8.5: Missing Database Transactions in Multi-Step Mutations
- **File & Lines**:
  - `src/services/ConfirmOrderService.ts`: Lines 84–94 (`updateState` and `updateAssetStates`)
  - `src/repositories/OrderRepository.ts`: Lines 142–148 (`orderAsset.deleteMany` and `order.delete`)
  - `src/repositories/ProductRepository.ts`: Lines 134–140 (`asset.deleteMany` and `productBase.delete`)
  - `src/repositories/CustomerRepository.ts`: Lines 13–28 (`findFirst` followed by `create`)
- **GEMINI.md Guideline**:
  > "1. **SOLID & Clean Code** ... escaláveis, seguros e fáceis de manter."
- **Violation Analysis**:
  In `ConfirmOrderService`, the order state is updated to `RESERVED` first, and subsequently `updateAssetStates` marks assets as `RENTED`. If the process crashes or network fails between these calls, the database enters an inconsistent, corrupted state. In `CustomerRepository.upsertCustomer`, concurrent requests cause race conditions and unique constraint violations.
- **Actionable Recommendation**:
  Wrap multi-step database mutations within `prisma.$transaction([ ... ])` or interactive transactions (`prisma.$transaction(async (tx) => { ... })`).

---

### 9. Testing & Quality

#### Finding 9.1: Type-Broken Test Suite Under Strict TypeScript Checks
- **File & Lines**:
  - `src/tests/services/ConfirmOrderService.spec.ts`: Lines 8, 17, 34, 42, 53, 62, 76, 79
  - `src/tests/services/CreateQuoteService.spec.ts`: Lines 17–31, 49, 57, 66, 73
  - `src/tests/services/FinishOrderService.spec.ts`: Lines 30, 38, 49, 52, 71, 74
- **GEMINI.md Guideline**:
  > "1. **Cultura de Testes:** Escreva código pensando em como ele será testado. O código deve ser fácil de ser *mockado* (Inversão de Dependência)."  
  > "4. **Tipagem Rigorosa:** O TypeScript deve ser configurado em modo `strict`."
- **Violation Analysis**:
  Mocks are instantiated using `orderRepositoryMock = { ... } as unknown as ReturnType<typeof vi.fn>;` and properties are cast via `(orderRepositoryMock.findById as Mock)`. Because `Mock<Procedure>` does not have the mock methods as properties, `tsc --noEmit` fails on over 30 lines across test files.
- **Actionable Recommendation**:
  Type repository mocks using Vitest's `Mocked<T>` utility or typed helper:
```typescript
type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? ReturnType<typeof vi.fn<(...args: A) => R>> : T[K];
};
```

#### Finding 9.2: 40% of Application Services Have Zero Unit Test Coverage
- **File & Lines**:
  - `src/services/CreateKitService.ts`: **0 tests**
  - `src/services/GetDashboardStatsService.ts`: **0 tests**
  - `src/services/ListKitsService.ts`: **0 tests**
  - `src/services/ListOrdersService.ts`: **0 tests**
  - `src/services/SearchProductsService.ts`: **0 tests**
  - `src/services/ToggleFavoriteKitService.ts`: **0 tests**
- **GEMINI.md Guideline**:
  > "2. **Cobertura:** Sempre que criar uma nova *feature* complexa no Service, sugira os cenários de testes unitários cruciais para ela."
- **Violation Analysis**:
  Out of 15 services in the codebase, 6 services have no test files. Neither `SearchProductsService` (which contains pagination and availability filtering logic) nor `GetDashboardStatsService` (which computes monthly financial revenue and active equipment counts) has any test coverage.
- **Actionable Recommendation**:
  Implement test suites for all 6 untested services, prioritizing `SearchProductsService` and `GetDashboardStatsService`.

#### Finding 9.3: Total Absence of Integration / Route Tests
- **File & Lines**:
  - `src/routes/*`
  - `src/controllers/*`
- **GEMINI.md Guideline**:
  > "1. **Cultura de Testes:** Escreva código pensando em como ele será testado."
- **Violation Analysis**:
  There are zero HTTP integration tests (e.g. Supertest with Express `app`). As a result, critical defects—such as Express 5 parameter type mismatches, missing `next(error)` error forwarding, and invalid route parameter handling—went undetected.
- **Actionable Recommendation**:
  Add API integration tests using `supertest` testing the request-response lifecycle, parameter validation, and global error handling middleware.

---

## Summary Matrix of Deviations

| # | File Path | Line(s) | Category | Severity | GEMINI.md Rule | Core Issue |
|---|---|---|---|---|---|---|
| 1 | `src/routes/*.routes.ts` | Multiple | Layering / SOLID | High | Routes responsibility | Routes create DB pools, Prisma clients, and services |
| 2 | `src/services/GetDashboardStatsService.ts` | 5–67 | Layering / Patterns | High | Repositories/DAOs only | Direct Prisma calls in service, bypassing repositories |
| 3 | `src/controllers/ProductController.ts` | 19–131 | Error Handling | High | Global error middleware | Bypasses `next(error)`, local catch blocks |
| 4 | `src/controllers/order.controller.ts` | 82–119 | Error Handling | High | Global error middleware | `update`/`delete` bypass `next(error)` |
| 5 | `src/controllers/*.ts` (all) | Multiple | Validation | High | Validate Body/Params/Query | Zero Zod validation on `req.params.id` |
| 6 | Entire project (`tsc --noEmit`) | 13 files | Rigorous Typing | High | TypeScript strict mode | 53 compilation errors across codebase |
| 7 | `src/services/UpdateProductStockService.ts` | 30, 59 | Clean Code / Performance | High | SOLID & Clean Code | Abusing `update(id, {})` as dummy read query |
| 8 | `src/services/DeleteProductService.ts` | 9 | Clean Code / Performance | High | SOLID & Clean Code | Abusing `update(id, {})` as dummy read query |
| 9 | `src/services/DeleteProductService.ts` | 25–34 | Layering / Patterns | Medium | Services vs Repositories | Direct Prisma `P2003` error code coupling in service |
| 10 | `src/repositories/OrderRepository.ts` | 55–71 | Performance | High | Suggest pagination | Unpaginated `findAll` fetching all records with relations |
| 11 | `src/repositories/KitRepository.ts` | 43–54 | Performance | Medium | Suggest pagination | Unpaginated `findAll` |
| 12 | `prisma/schema.prisma` | Multiple | Performance | High | Proper DB indexes | Missing indexes on `Order`, `Asset`, `KitItem` |
| 13 | `src/app.ts` | 25 | Security | High | CORS properly configured | Insecure default `cors()` allowing wildcard `*` |
| 14 | `src/routes/*.routes.ts` | Multiple | Performance / Reliability | High | Performance & connection pooling | 4 independent DB pools and Prisma clients created |
| 15 | `src/services/ConfirmOrderService.ts` | 84–94 | Reliability / Architecture | High | Clean Code & Safety | Non-transactional multi-table state updates |
| 16 | `src/middlewares/logging.middleware.ts` | 44 | Security | High | Sensitive credentials & data | Cleartext logging of raw request headers |
| 17 | `src/services/*.ts` (10 files) | Constructors | SOLID (DIP) | Medium | Dependency Inversion | Services inject concrete repository classes |
| 18 | `src/repositories/ProductRepository.ts` | 99–130 | SOLID (SRP) | Medium | Single Responsibility | `ProductRepository` directly manages `Asset` table |
| 19 | `src/repositories/OrderRepository.ts` | 83–91 | SOLID (SRP) | Medium | Single Responsibility | `OrderRepository` directly updates `Asset` table |
| 20 | `src/services/FinishOrderService.ts` | 34 | Typing / Domain | High | Rigorous Typing | Invalid reference to `OrderState.TOTAL_LOSS` |
| 21 | `src/services/DeleteOrderService.ts` | 19 | Typing / Domain | High | Rigorous Typing | Invalid reference to `OrderState.TOTAL_LOSS` |
| 22 | `src/services/UpdateOrderService.ts` | 30 | Typing / Domain | High | Rigorous Typing | Invalid reference to `OrderState.TOTAL_LOSS` |
| 23 | `src/controllers/order.controller.ts` vs others | Filesystem | Naming | Low | Descriptive English names | Inconsistent filename casing (`order.controller.ts`) |
| 24 | Multiple services and controllers | Multiple | Naming | Medium | English naming convention | Extensive hardcoded Portuguese strings |
| 25 | `prisma/schema.prisma` | 31 | Naming | Low | Descriptive English names | Non-ASCII enum value `LOUÇAS` |
| 26 | `src/controllers/*.ts` (all) | Multiple | Clean Code / Validation | Medium | Layering & Zod | Inline Zod schemas inside controller methods |
| 27 | `src/middlewares/errorHandler.middleware.ts` | 31 | Typing / Compatibility | High | Rigorous Typing | Incompatible Zod 4 `err.errors` reference |
| 28 | `src/repositories/AssetRepository.ts` | 22 | Typing / Compatibility | High | Rigorous Typing | Broken import `@prisma/client/runtime/library` |
| 29 | `src/services/CreateQuoteService.ts` | 45 | Typing / Compatibility | High | Rigorous Typing | Broken import `@prisma/client/runtime/library` |
| 30 | `src/services/*` (6 files) | - | Testing & Quality | High | Unit test coverage | 6 out of 15 services have zero unit tests |
| 31 | `src/tests/services/*.spec.ts` | Multiple | Testing & Quality | High | Easy to mock (DIP) | Sloppy mock typings fail `tsc` checking |
| 32 | `src/controllers/ProductController.ts` | 35 | Error Handling | Low | Global logger | `console.error` used instead of Winston logger |

---

## Strategic Refactoring Roadmap

To bring the codebase into full compliance with `GEMINI.md`, refactoring should proceed in three prioritized phases:

### Phase 1: Compilation, Typing & Security Integrity (Immediate)
1. **Fix TypeScript Compilation**:
   - Replace `err.errors` with `err.issues` or `(err as z.ZodError).issues` across `errorHandler.middleware.ts` and controllers.
   - Remove invalid `OrderState.TOTAL_LOSS` references.
   - Fix broken `@prisma/client/runtime/library` imports to standard `@prisma/client` types.
   - Properly type Vitest mock objects in `src/tests/services/*.spec.ts`.
2. **Harden Security & Infrastructure**:
   - Configure CORS in `src/app.ts` with an explicit origin whitelist from `process.env.CORS_ORIGIN`.
   - Sanitize `req.headers` in `src/middlewares/logging.middleware.ts` before logging.
   - Unify database connections into a singleton `PrismaClient` in `src/infra/database.ts`.

### Phase 2: Architectural Layering & Input Validation (Structural)
1. **Input Validation Isolation**:
   - Create parameter schemas (`src/schemas/common.schema.ts`) and validate `req.params.id` across all routes.
   - Extract inline schemas from `ProductController` and `KitController` into `src/schemas/product.schema.ts` and `src/schemas/kit.schema.ts`.
2. **Error Handling Unification**:
   - Refactor `ProductController` and `OrderController` to remove local catch-blocks and pass errors directly to `next(error)`.
   - Standardize error responses to a consistent JSON format.
3. **Repository Layer Realignment**:
   - Create `DashboardRepository` for `GetDashboardStatsService`.
   - Add proper `findByIdWithAssets` method to `ProductRepository` and eliminate dummy `update(id, {})` calls.
   - Move all asset operations into `AssetRepository`.
   - Wrap multi-table updates (`ConfirmOrderService`, `OrderRepository.delete`) in transactions.

### Phase 3: Performance, Testing & Cleanliness (Refinement)
1. **Performance Enhancements**:
   - Implement pagination on `OrderRepository.findAll()` and `KitRepository.findAll()`.
   - Add database indexes on `Order` (`customerId`, `state`, `pickUpDate`, `returnDate`) and `Asset` (`productBaseId`, `state`).
2. **Testing Coverage & Clean Naming**:
   - Implement unit test suites for the 6 uncovered services (`SearchProductsService`, `GetDashboardStatsService`, etc.).
   - Standardize all error messages, comments, and enums (`TABLEWARE` instead of `LOUÇAS`) into English.
   - Standardize file naming conventions across controllers and routes.
