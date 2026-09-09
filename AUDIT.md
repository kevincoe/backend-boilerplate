# Codebase Technical Audit & GEMINI.md Compliance Report

**Target Project:** Audiovisual Equipment Rental Management System ("Pegue-e-Monte")  
**Target Directory:** `/home/workspace/backend-boilerplate`  
**Reference Specification:** `/home/workspace/backend-boilerplate/GEMINI.md`  
**Audit Date:** 2026-09-09  
**Audit Scope:** Full codebase inspection across Routes, Controllers, Services, Repositories, Middlewares, Domain, Schemas, Configurations, and Tests.  

---

## 1. Executive Summary & Audit Metrics

This document provides a comprehensive, rigorous technical audit of the `backend-boilerplate` codebase against the software engineering principles, architecture standards, security rules, and code quality mandates set forth in `GEMINI.md`.

While the project demonstrates a modern technology stack (Express 5, TypeScript, Prisma 7, PostgreSQL, Winston, Zod, Vitest) and implements crucial rental business rules (such as the +1 day turnaround buffer and pre-confirmation availability checks), our audit identified **18 significant architectural deviations** and **53 silent TypeScript compilation errors** that threaten system stability, security, maintainability, and scalability.

### 1.1 Summary Audit Metrics

| Metric | Measured Value | Target Standard | Status |
| :--- | :---: | :---: | :---: |
| **`tsc --noEmit` Compilation Errors** | **53 errors across 13 files** | 0 errors (`strict: true`) | ❌ CRITICAL |
| **Zod Route Parameter Validations** | **0% (0 of 8 endpoints)** | 100% of Params validated | ❌ CRITICAL |
| **Database Connection Pools** | **4 separate active pools** | 1 shared connection pool | ❌ HIGH |
| **Direct ORM Injection in Services** | **1 service (`GetDashboardStatsService`)** | 0 services (Repositories only) | ❌ HIGH |
| **Controller Error Handler Bypasses** | **7 controller methods** | 0 (all delegate via `next`) | ❌ HIGH |
| **Non-Transactional Multi-Table Writes** | **3 critical operations** | All wrapped in transactions | ❌ HIGH |
| **Sensitive Headers Logged in Cleartext** | **1 instance (`req.headers`)** | Zero credential logging | ❌ HIGH |
| **CORS Access Policy** | **Unrestricted wildcard (`*`)** | Explicit origin whitelist | ⚠️ MEDIUM |
| **Services with Zero Unit Test Coverage** | **6 of 15 services (40%)** | 100% test coverage | ❌ HIGH |
| **Concrete Repository Injections** | **10 of 15 services (67%)** | Interface-based injection (DIP) | ⚠️ MEDIUM |
| **Dummy Mutative Read Calls (`update`)** | **3 instances in 2 services** | Explicit read queries | ❌ HIGH |
| **Unpaginated Collection Queries** | **2 repositories (`Order`, `Kit`)** | Paginated with `limit`/`skip` | ❌ HIGH |

---

## 2. Full GEMINI.md Compliance Matrix

Below is the exhaustive evaluation of the codebase against all 9 sections and 18 core guidelines declared in `GEMINI.md`:

```
========================================================================================================
GEMINI.md RULE EVALUATION MATRIX
========================================================================================================
RULE ID       | GUIDELINE DESCRIPTION                                | STATUS     | SUMMARY FINDING
--------------+------------------------------------------------------+------------+---------------------
G-ROLE        | Senior Fullstack Architect Persona                   | COMPLIANT  | Audit conducted with
              | (Clean, scalable, secure, easy-to-maintain code)     |            | rigorous standards.
G-STACK-BE    | Backend Stack: Node.js, Express, TypeScript          | COMPLIANT  | Node 20+, Express 5,
              |                                                      |            | TypeScript 6 utilized.
G-STACK-VAL   | Validation: Zod                                      | PARTIAL    | Zod used for bodies;
              |                                                      |            | params completely skipped.
G-STACK-TOOL  | Tooling: Docker, tsx, tsup, ESLint, Prettier         | COMPLIANT  | Configs present;
              |                                                      |            | missing tsc in CI.
G-ARCH-1      | SOLID & Clean Code (Small functions, SRP,            | VIOLATION  | Empty update hacks;
              | guard clauses, no deep nesting)                      |            | route composition roots.
G-ARCH-2      | Design Patterns (Repository, Factory, Strategy;      | VIOLATION  | 4 separate DB pools;
              | avoid overengineering)                               |            | Repository bypass.
G-ARCH-3      | Nomenclatura (Descriptive English names;             | CONCERN    | Hardcoded Portuguese
              | self-documenting code)                               |            | errors & enum LOUÇAS.
G-ARCH-4      | Tipagem Rigorosa (Strict TS, no any,                 | VIOLATION  | 53 tsc errors; invalid
              | safe unknown assertions)                             |            | OrderState.TOTAL_LOSS.
G-BACK-1.1    | Routes Layer: Map endpoints to controllers ONLY      | VIOLATION  | Routes instantiate
              |                                                      |            | pools, Prisma, services.
G-BACK-1.2    | Controllers Layer: HTTP req/res only; no biz logic   | VIOLATION  | Controllers catch errors
              |                                                      |            | & format ad-hoc JSON.
G-BACK-1.3    | Services Layer: House business rules exclusively     | COMPLIANT  | Clean use cases for
              |                                                      |            | buffer & deposit logic.
G-BACK-1.4    | Repositories Layer: Sole layer interacting with DB   | VIOLATION  | Direct Prisma injection
              |                                                      |            | in DashboardService.
G-BACK-2      | Validação: All input (Body, Params, Query) strictly  | VIOLATION  | Zero Zod validation
              | validated with Zod before reaching Services          |            | on req.params (:id).
G-BACK-3      | Tratamento de Erros: Global error middleware,        | VIOLATION  | Controllers bypass
              | custom AppError, no sensitive stack traces           |            | global errorHandler.
G-SEC-1       | Proteção: CORS configured, Helmet, Rate Limiting     | CONCERN    | Wildcard CORS; limiter
              |                                                      |            | blocks /health probe.
G-SEC-2       | Dados Sensíveis: Never hardcode credentials;         | VIOLATION  | Cleartext logging of
              | use process.env                                      |            | req.headers (auth/cookie).
G-SEC-3       | Performance: Pagination, query optimization,         | VIOLATION  | Unpaginated findAll;
              | proper database indexes                              |            | missing schema indexes.
G-TEST-1      | Cultura de Testes: Easily mockable (DIP)             | CONCERN    | Concrete repo injection
              |                                                      |            | in 10 services; broken mocks.
G-TEST-2      | Cobertura de Testes: Unit test complex scenarios     | VIOLATION  | 6 of 15 services (40%)
              |                                                      |            | have zero unit tests.
========================================================================================================
```

---

## 3. Comprehensive Deviation Catalog with File Citations & Code Diffs

---

### Finding 1: 53 Silent TypeScript Compilation Errors under `tsc --noEmit`
- **Severity:** `CRITICAL`
- **File Paths & Line Citations:**
  - `src/services/DeleteOrderService.ts`: Line 19
  - `src/services/FinishOrderService.ts`: Line 34
  - `src/services/UpdateOrderService.ts`: Line 30
  - `src/middlewares/errorHandler.middleware.ts`: Line 31
  - `src/controllers/ProductController.ts`: Lines 33, 56, 67, 82, 93, 107, 118
  - `src/controllers/order.controller.ts`: Lines 46, 83, 96, 107
  - `src/controllers/KitController.ts`: Line 56
  - `src/repositories/AssetRepository.ts`: Line 22
  - `src/services/CreateQuoteService.ts`: Line 45
  - `src/routes/order.routes.ts`: Lines 33, 34, 63, 66
  - `src/tests/services/*.spec.ts`: 30+ mock typings
- **GEMINI.md Rule:**
  > `G-ARCH-4`: "O TypeScript deve ser configurado em modo `strict`. Nunca utilize o tipo `any`. Se o tipo for desconhecido, use `unknown` e faça asserções seguras."
- **Analysis:**
  Because the project build script (`tsup src --out-dir=dist`) relies on esbuild, it strips TypeScript types without performing type verification. Furthermore, `.github/workflows/ci.yml` runs `npm run lint`, `npm run build`, and `npm test` without invoking `tsc --noEmit`. Consequently, **53 compilation errors** have accumulated across 13 files:
  1. **Invalid Enum References:** `FinishOrderService.ts`, `UpdateOrderService.ts`, and `DeleteOrderService.ts` check `order.state === OrderState.TOTAL_LOSS`. `TOTAL_LOSS` does not exist on `OrderState` (it is an `AssetState`), meaning this condition evaluates to `undefined` at runtime.
  2. **Zod 4 Incompatibility:** `errorHandler.middleware.ts` and controllers reference `err.errors`, which was deprecated and removed in Zod 4 in favor of `err.issues`.
  3. **Express 5 Param Narrowing:** In Express 5, `req.params.id` is typed as `string | string[] | undefined`. Passing it into services expecting `string` triggers TS2345.
  4. **Broken Internal Imports:** `import("@prisma/client/runtime/library").Decimal` fails to resolve under Prisma 7.
  5. **Repository Interface Type Drift:** `IOrderRepository` and `OrderRepository` disagree on `totalAmount` (`Prisma.Decimal` vs `number`) and `updateState` return fields.
- **Actionable Remediation & Diff:**
  1. Update `package.json` and `ci.yml`:
  ```diff
  --- a/package.json
  +++ b/package.json
  @@ -11,4 +11,5 @@
  +    "typecheck": "tsc --noEmit",
       "lint": "eslint src --ext .ts --fix",
  ```
  2. Remove nonexistent enum reference in `src/services/FinishOrderService.ts`:
  ```diff
  --- a/src/services/FinishOrderService.ts
  +++ b/src/services/FinishOrderService.ts
  @@ -31,3 +31,2 @@
       if (
         order.state === OrderState.DRAFT ||
  -      order.state === OrderState.COMPLETED ||
  -      order.state === OrderState.TOTAL_LOSS
  +      order.state === OrderState.COMPLETED
       ) {
  ```
  3. Fix Zod 4 property access in `src/middlewares/errorHandler.middleware.ts`:
  ```diff
  --- a/src/middlewares/errorHandler.middleware.ts
  +++ b/src/middlewares/errorHandler.middleware.ts
  @@ -29,3 +29,3 @@
       return res
         .status(400)
  -      .json({ error: "Validation failed", details: err.errors });
  +      .json({ error: "Validation failed", details: err.issues });
  ```

---

### Finding 2: Direct PrismaClient Injection in Service (Repository Layer Bypass)
- **Severity:** `HIGH`
- **File Paths & Line Citations:**
  - `src/services/GetDashboardStatsService.ts`: Lines 1, 5, 9, 12, 21, 38, 50, 60
  - `src/routes/dashboard.routes.ts`: Line 13
- **GEMINI.md Rule:**
  > `G-BACK-1.4`: "Repositories/DAOs: Única camada responsável por interagir com o banco de dados."  
  > `G-BACK-1.3`: "Services/Use Cases: Onde vive a regra de negócio da aplicação."
- **Analysis:**
  `GetDashboardStatsService` bypasses the persistence layer entirely. It receives `PrismaClient` directly in its constructor and issues 5 raw ORM queries (`prisma.asset.count`, `prisma.order.groupBy`, `prisma.order.aggregate`, etc.). This violates separation of concerns, couples application analytics directly to Prisma ORM, and makes unit testing impossible without setting up an in-memory database or mocking internal Prisma query builders.
- **Actionable Remediation & Diff:**
  Extract `DashboardRepository` implementing `IDashboardRepository`:
  ```diff
  --- a/src/services/GetDashboardStatsService.ts
  +++ b/src/services/GetDashboardStatsService.ts
  -import { PrismaClient } from "@prisma/client";
  -import { OrderState } from "../domain/OrderState";
  -
  -export class GetDashboardStatsService {
  -  constructor(private readonly prisma: PrismaClient) {}
  +export interface DashboardStatsResult {
  +  totalEquipment: number;
  +  rentedEquipment: number;
  +  activeCustomers: number;
  +  activeOrders: number;
  +  monthlyRevenue: number;
  +  recentOrders: Array<{ id: string; customer: { name: string } }>;
  +}
  +
  +export interface IDashboardRepository {
  +  getStats(): Promise<DashboardStatsResult>;
  +}
  +
  +export class GetDashboardStatsService {
  +  constructor(private readonly dashboardRepository: IDashboardRepository) {}
  +
  +  public async execute(): Promise<DashboardStatsResult> {
  +    return this.dashboardRepository.getStats();
  +  }
  ```

---

### Finding 3: 4 Redundant Database Connection Pools in Route Files
- **Severity:** `HIGH`
- **File Paths & Line Citations:**
  - `src/routes/order.routes.ts`: Lines 17–20
  - `src/routes/product.routes.ts`: Lines 13–16
  - `src/routes/kit.routes.ts`: Lines 11–14
  - `src/routes/dashboard.routes.ts`: Lines 8–11
- **GEMINI.md Rule:**
  > `G-BACK-1.1`: "Routes: Apenas mapeiam os endpoints para os controllers."  
  > `G-ARCH-2`: "Design Patterns: Utilize padrões adequados (ex: Singleton, Repository)."  
  > `G-SEC-3`: "Performance: Queries otimizadas no banco..."
- **Analysis:**
  Each of the four route modules instantiates a separate `new Pool({ connectionString })`, `new PrismaPg(pool)`, and `new PrismaClient({ adapter })`. This results in **4 independent connection pools** created at process startup. In production (especially with cloud database proxies such as Supabase's transaction pooler with tight client connection ceilings), this 4x connection multiplier causes database connection exhaustion, latency spikes, and socket timeouts under moderate concurrent load.
- **Actionable Remediation & Diff:**
  Create a single shared database singleton in `src/infra/database.ts`:
  ```diff
  --- /dev/null
  +++ b/src/infra/database.ts
  @@ -0,0 +1,11 @@
  +import { Pool } from "pg";
  +import { PrismaPg } from "@prisma/adapter-pg";
  +import { PrismaClient } from "@prisma/client";
  +
  +const connectionString = process.env.DATABASE_URL;
  +if (!connectionString) {
  +  throw new Error("DATABASE_URL environment variable is required.");
  +}
  +export const pool = new Pool({ connectionString });
  +const adapter = new PrismaPg(pool);
  +export const prisma = new PrismaClient({ adapter });
  ```
  And clean up route files to import shared instances:
  ```diff
  --- a/src/routes/order.routes.ts
  +++ b/src/routes/order.routes.ts
  -const connectionString = `${process.env.DATABASE_URL}`;
  -const pool = new Pool({ connectionString });
  -const adapter = new PrismaPg(pool);
  -const prisma = new PrismaClient({ adapter });
  +import { prisma } from "../infra/database";
  ```

---

### Finding 4: Complete Absence of Zod Route Parameter Validation
- **Severity:** `CRITICAL`
- **File Paths & Line Citations:**
  - `src/controllers/order.controller.ts`: Lines 42, 61, 83, 107
  - `src/controllers/ProductController.ts`: Lines 67, 93, 118
  - `src/controllers/KitController.ts`: Line 53
- **GEMINI.md Rule:**
  > `G-BACK-2`: "Toda entrada de dados (Body, Params, Query) deve ser estritamente validada usando **Zod** antes de chegar aos Services."
- **Analysis:**
  Not a single route parameter (`:id`, `:orderId`) is validated with Zod across the entire application. Controllers directly destructure `const { id } = req.params;` and pass the raw value into application services and database queries. Malformed IDs, non-UUID strings, or directory traversal payloads pass unchecked into SQL queries. Furthermore, in Express 5, this triggers TypeScript compilation errors.
- **Actionable Remediation & Diff:**
  Create a reusable common parameter validation schema:
  ```diff
  --- /dev/null
  +++ b/src/schemas/params.schema.ts
  @@ -0,0 +1,5 @@
  +import { z } from "zod";
  +
  +export const idParamSchema = z.object({
  +  id: z.string().uuid("Parameter must be a valid UUID"),
  +});
  ```
  Validate route parameters before invoking services:
  ```diff
  --- a/src/controllers/order.controller.ts
  +++ b/src/controllers/order.controller.ts
  +import { idParamSchema } from "../schemas/params.schema";
  +
   public async finishOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
     try {
  -    const { id } = req.params;
  +    const { id } = idParamSchema.parse(req.params);
       const order = await this.finishOrderService.execute(id);
       res.json(order);
  ```

---

### Finding 5: Controllers Bypassing Global Error Middleware with Local Catch Blocks
- **Severity:** `HIGH`
- **File Paths & Line Citations:**
  - `src/controllers/ProductController.ts`: Lines 27–37, 54–64, 80–90, 105–115, 123–130
  - `src/controllers/order.controller.ts`: Lines 94–104, 112–119
- **GEMINI.md Rule:**
  > `G-BACK-3`: "Crie um middleware de erro global. Nunca exponha stack traces sensíveis em produção. Utilize classes de erro customizadas (ex: AppError)."  
  > `G-BACK-1.2`: "Controllers: Lidam apenas com a requisição e resposta HTTP. Não devem conter regras de negócio."
- **Analysis:**
  `ProductController` and `OrderController` (`update`, `delete`) manually trap errors in local `try/catch` blocks, inspect properties with unsafe casts (`const err = error as { statusCode?: number; message?: string }`), and construct custom JSON error payloads. This bypasses `errorHandler.middleware.ts`, suppresses structured Winston error logging, exposes raw console errors via `console.error`, and produces inconsistent error response envelopes.
- **Actionable Remediation & Diff:**
  Refactor all controller methods to delegate unhandled errors to `next(error)`:
  ```diff
  --- a/src/controllers/ProductController.ts
  +++ b/src/controllers/ProductController.ts
  -  public async create(req: Request, res: Response): Promise<Response> {
  -    try {
  -      const data = bodySchema.parse(req.body);
  -      const product = await this.createService.execute(data);
  -      return res.status(201).json(product);
  -    } catch (error: unknown) {
  -      if (error instanceof z.ZodError) {
  -        return res.status(400).json({ error: error.errors });
  -      }
  -      const err = error as { statusCode?: number; message?: string };
  -      const statusCode = err.statusCode || 500;
  -      return res.status(statusCode).json({ message: err.message || "Erro interno ao criar produto" });
  -    }
  -  }
  +  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
  +    try {
  +      const data = createProductSchema.parse(req.body);
  +      const product = await this.createService.execute(data);
  +      res.status(201).json(product);
  +    } catch (error) {
  +      next(error);
  +    }
  +  }
  ```

---

### Finding 6: Dummy Mutative Read Query Anti-Pattern (`update(id, {})`)
- **Severity:** `HIGH`
- **File Paths & Line Citations:**
  - `src/services/UpdateProductStockService.ts`: Lines 30 & 59
  - `src/services/DeleteProductService.ts`: Line 9
- **GEMINI.md Rule:**
  > `G-ARCH-1`: "SOLID & Clean Code: O código deve ser lido como uma documentação."  
  > `G-SEC-3`: "Performance: Queries otimizadas no banco..."
- **Analysis:**
  In `UpdateProductStockService.ts` and `DeleteProductService.ts`, the developer encountered a limitation where `ProductRepository.findById` did not include related `Asset` records. Rather than enhancing the repository query method, the code calls `this.productRepository.update(id, {})` purely to fetch the product with its assets. This anti-pattern:
  1. Issues an unwanted SQL `UPDATE` statement on PostgreSQL.
  2. Updates the `updatedAt` database timestamp without any actual state change.
  3. Acquires exclusive row-level write locks in PostgreSQL, blocking concurrent reads.
  4. Obscures code readability and architectural intent.
- **Actionable Remediation & Diff:**
  Implement an explicit `findByIdWithAssets` method on `ProductRepository`:
  ```diff
  --- a/src/repositories/ProductRepository.ts
  +++ b/src/repositories/ProductRepository.ts
  +  public async findByIdWithAssets(id: string) {
  +    return this.prisma.productBase.findUnique({
  +      where: { id },
  +      include: { assets: true },
  +    });
  +  }
  ```
  And update the service:
  ```diff
  --- a/src/services/UpdateProductStockService.ts
  +++ b/src/services/UpdateProductStockService.ts
  -    const productWithAssets = await this.productRepository.update(id, {}); // update with empty data returns include: {assets: true}
  +    const productWithAssets = await this.productRepository.findByIdWithAssets(id);
  ```

---

### Finding 7: Cleartext Logging of Sensitive Request Headers
- **Severity:** `HIGH`
- **File Paths & Line Citations:**
  - `src/middlewares/logging.middleware.ts`: Line 44
- **GEMINI.md Rule:**
  > `G-SEC-2`: "Nunca exponha credenciais ou dados sensíveis."  
  > `G-SEC-1`: "Proteção: Segurança e headers HTTP."
- **Analysis:**
  `logging.middleware.ts` logs the complete incoming `req.headers` object on every request:
  ```typescript
  logger.info("Request started", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    headers: req.headers, // Vulnerability: logs authorization bearer tokens, session cookies
  });
  ```
  This leaks sensitive authentication credentials (`authorization`, `cookie`, `x-api-key`) directly into standard output and disk log files (`logs/combined.log`), violating basic privacy and security compliance mandates (LGPD/GDPR).
- **Actionable Remediation & Diff:**
  Sanitize headers before emitting log events:
  ```diff
  --- a/src/middlewares/logging.middleware.ts
  +++ b/src/middlewares/logging.middleware.ts
  +  const sanitizedHeaders = { ...req.headers };
  +  delete sanitizedHeaders.authorization;
  +  delete sanitizedHeaders.cookie;
  +  delete sanitizedHeaders["x-api-key"];
  +
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

### Finding 8: Insecure Permissive CORS Configuration
- **Severity:** `MEDIUM`
- **File Paths & Line Citations:**
  - `src/app.ts`: Line 25
- **GEMINI.md Rule:**
  > `G-SEC-1`: "Sempre implemente CORS configurado corretamente, helmet para headers HTTP de segurança, e Rate Limiting..."
- **Analysis:**
  `app.use(cors())` is registered without any options, resulting in `Access-Control-Allow-Origin: *`. Any untrusted third-party website can make cross-origin requests against this API. In a production rental CRM that manages customer PII and financial contracts, this represents an unmitigated CSRF and unauthorized cross-origin data exposure hazard.
- **Actionable Remediation & Diff:**
  Restrict origins using an environment variable whitelist:
  ```diff
  --- a/src/app.ts
  +++ b/src/app.ts
  -app.use(cors());
  +const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");
  +app.use(cors({
  +  origin: (origin, callback) => {
  +    if (!origin || allowedOrigins.includes(origin)) {
  +      callback(null, true);
  +    } else {
  +      callback(new AppError("Not allowed by CORS policy", 403));
  +    }
  +  },
  +  credentials: true,
  +}));
  ```

---

### Finding 9: Rate Limiter Blocking System Healthcheck Endpoint
- **Severity:** `MEDIUM`
- **File Paths & Line Citations:**
  - `src/app.ts`: Lines 28 & 31–33
- **GEMINI.md Rule:**
  > `G-SEC-1`: "Rate Limiting para prevenir força bruta."  
  > `G-SEC-3`: "Performance e disponibilidade."
- **Analysis:**
  `app.use(limiter)` (100 req / 15 min) is mounted on line 28, preceding the `GET /health` route on line 31. System telemetry and container orchestration health checks (e.g., Kubernetes liveness probes, AWS target group health checks, or Docker daemon healthchecks running every 5 seconds) quickly exceed 100 requests. When the limiter trips, `/health` returns `429 Too Many Requests`. The orchestrator concludes the container is dead and forcibly restarts it, leading to recurring outage loops.
- **Actionable Remediation & Diff:**
  Register `/health` *before* the rate limiter middleware:
  ```diff
  --- a/src/app.ts
  +++ b/src/app.ts
  +// Healthcheck endpoint (must be exempt from rate limiting)
  +app.get('/health', (req: Request, res: Response) => {
  +  res.status(200).json({ status: 'OK', uptime: process.uptime() });
  +});
  +
  +app.use(limiter); // Apply rate limiter to API routes only
  ```

---

### Finding 10: Non-Transactional Multi-Step Database Mutations
- **Severity:** `HIGH`
- **File Paths & Line Citations:**
  - `src/services/ConfirmOrderService.ts`: Lines 84–94
  - `src/repositories/OrderRepository.ts`: Lines 142–148
  - `src/repositories/ProductRepository.ts`: Lines 134–140
- **GEMINI.md Rule:**
  > `G-ARCH-1`: "SOLID & Clean Code: escaláveis, seguros e fáceis de manter."  
  > `G-SEC-3`: "Integridade de dados e queries transacionais."
- **Analysis:**
  In `ConfirmOrderService`, the order state is updated to `RESERVED` first, followed by a separate query calling `updateAssetStates(assetIds, AssetState.RENTED)`. Because these two database operations are executed without an enclosing database transaction (`prisma.$transaction`), a process crash, network partition, or database failure between steps will leave the order in `RESERVED` while the assets remain unflagged, corrupting inventory availability tracking.
- **Actionable Remediation & Diff:**
  Wrap multi-step updates inside an interactive transaction:
  ```typescript
  await this.prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { state: OrderState.RESERVED, amountPaid },
    });
    await tx.asset.updateMany({
      where: { id: { in: assetIds } },
      data: { state: AssetState.RENTED },
    });
  });
  ```

---

### Finding 11: Missing Database Indexes on High-Frequency Query Fields
- **Severity:** `HIGH`
- **File Paths & Line Citations:**
  - `prisma/schema.prisma`: Models `Order`, `Asset`, `KitItem`
- **GEMINI.md Rule:**
  > `G-SEC-3`: "Performance: índices adequados para buscas frequentes."
- **Analysis:**
  The schema contains foreign keys and frequently filtered query columns that lack database indexes:
  - `Order.customerId`, `Order.state`, `Order.pickUpDate`, `Order.returnDate`: Queried on every availability evaluation and dashboard aggregation.
  - `Asset.productBaseId` and `Asset.state`: Queried in tandem on every quote calculation (`findAvailableAssetsForProduct`).
  Without composite B-tree indexes, PostgreSQL performs full sequential table scans, degrading availability check response times as inventory scales.
- **Actionable Remediation & Diff:**
  Add indexes in `prisma/schema.prisma`:
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

---

### Finding 12: Unpaginated Database Queries on High-Volume Collections
- **Severity:** `HIGH`
- **File Paths & Line Citations:**
  - `src/repositories/OrderRepository.ts`: Lines 55–71 (`findAll`)
  - `src/repositories/KitRepository.ts`: Lines 43–54 (`findAll`)
  - `src/services/ListOrdersService.ts`: Line 11
  - `src/services/ListKitsService.ts`: Line 7
- **GEMINI.md Rule:**
  > `G-SEC-3`: "Performance: Sugira paginação para listas longas..."
- **Analysis:**
  `OrderRepository.findAll()` performs an unbounded `findMany` that loads every order ever created, eager-loading nested customer relations, nested asset assignments, and product base details. While acceptable in early local testing with 5 records, in production this will deserialize thousands of rows into V8 heap memory, resulting in severe latency and Out-Of-Memory process termination.
- **Actionable Remediation & Diff:**
  Introduce pagination (`page`, `limit`) parameters to `ListOrdersService` and `OrderRepository.findAll`:
  ```typescript
  public async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { customer: true, assets: { include: { asset: { include: { product: true } } } } },
      }),
      this.prisma.order.count(),
    ]);
    return { orders, total, page, limit };
  }
  ```

---

### Finding 13: Incomplete Dependency Inversion in Service Constructors
- **Severity:** `MEDIUM`
- **File Paths & Line Citations:**
  - `src/services/CreateKitService.ts`: Line 6
  - `src/services/CreateProductService.ts`: Line 15
  - `src/services/DeleteOrderService.ts`: Line 6
  - `src/services/DeleteProductService.ts`: Line 6
  - `src/services/ListKitsService.ts`: Line 4
  - `src/services/SearchProductsService.ts`: Line 11
  - `src/services/ToggleFavoriteKitService.ts`: Line 6
  - `src/services/UpdateOrderService.ts`: Line 13
  - `src/services/UpdateProductService.ts`: Line 15
  - `src/services/UpdateProductStockService.ts`: Line 10
- **GEMINI.md Rule:**
  > `G-TEST-1`: "Cultura de Testes: O código deve ser fácil de ser mockado (Inversão de Dependência)."  
  > `G-ARCH-1`: "SOLID & Clean Code: Inversão de Dependência."
- **Analysis:**
  While `CreateQuoteService` and `ConfirmOrderService` define clear repository interfaces (`IOrderRepository`, `IAssetRepository`), 10 other services directly import and couple to concrete repository classes (`constructor(private readonly productRepository: ProductRepository)`). This breaks the Dependency Inversion Principle, forcing test specs to mock concrete class implementations rather than clean interface contracts.
- **Actionable Remediation:**
  Extract interfaces (`IProductRepository`, `IKitRepository`, `IOrderRepository`) and inject interfaces across all services.

---

### Finding 14: Non-Existent Enum Reference `OrderState.TOTAL_LOSS`
- **Severity:** `HIGH`
- **File Paths & Line Citations:**
  - `src/services/FinishOrderService.ts`: Line 34
  - `src/services/UpdateOrderService.ts`: Line 30
  - `src/services/DeleteOrderService.ts`: Line 19
- **GEMINI.md Rule:**
  > `G-ARCH-4`: "Tipagem Rigorosa: TypeScript configurado em modo strict... asserções seguras."
- **Analysis:**
  The services contain guard checks verifying that an order is not in `OrderState.TOTAL_LOSS`. However, `TOTAL_LOSS` is a member of `AssetState`, not `OrderState`. Because TypeScript strict mode was not enforced via `tsc --noEmit`, this code compiled silently with `tsup`. At runtime, `OrderState.TOTAL_LOSS` resolves to `undefined`, meaning the condition `order.state === undefined` is dead logic.
- **Actionable Remediation:**
  Remove `OrderState.TOTAL_LOSS` from order state guard conditions.

---

### Finding 15: Hardcoded Portuguese in Errors, API Messages, and Enums
- **Severity:** `MEDIUM`
- **File Paths & Line Citations:**
  - `prisma/schema.prisma`: Line 31 (`enum ProductCategory { LOUÇAS }`)
  - `src/app.ts`: Line 20 (`"Muitas requisições deste IP..."`)
  - `src/services/CreateQuoteService.ts`: Line 98 (`"Estoque insuficiente..."`)
  - `src/services/ConfirmOrderService.ts`: Line 78 (`"Conflito de reserva detectado..."`)
  - `src/controllers/ProductController.ts`: Lines 35, 62, 87, 112, 127
- **GEMINI.md Rule:**
  > `G-ARCH-3`: "Nomenclatura: Use nomes descritivos em inglês para variáveis, funções e classes. O código deve ser lido como uma documentação."
- **Analysis:**
  The codebase exhibits widespread linguistic inconsistency: English is used for domain identifiers and classes, while Portuguese is hardcoded in API error messages, log statements, rate limiting text, and even a database enum (`LOUÇAS` containing a non-ASCII character).
- **Actionable Remediation:**
  Standardize all error messages and database enums (`TABLEWARE` instead of `LOUÇAS`) into clear English.

---

### Finding 16: Deprecated Zod 4 Property Access `err.errors`
- **Severity:** `HIGH`
- **File Paths & Line Citations:**
  - `src/middlewares/errorHandler.middleware.ts`: Line 31
  - `src/controllers/ProductController.ts`: Lines 33, 56, 82, 107
  - `src/controllers/order.controller.ts`: Line 96
- **GEMINI.md Rule:**
  > `G-ARCH-4`: "Tipagem Rigorosa: O TypeScript deve ser configurado em modo strict."  
  > `G-BACK-3`: "Tratamento de Erros: Middleware de erro global."
- **Analysis:**
  In Zod v4, the property `.errors` on `z.ZodError` was removed and replaced by `.issues`. Accessing `err.errors` causes TypeScript compilation error TS2339 (`Property 'errors' does not exist on type 'ZodError'`) and outputs `undefined` in validation response payloads.
- **Actionable Remediation & Diff:**
  Replace `err.errors` with `err.issues` throughout all error-handling locations.

---

### Finding 17: 40% Application Service Unit Test Coverage Gap
- **Severity:** `HIGH`
- **File Paths & Line Citations:**
  - `src/services/CreateKitService.ts`: 0 tests
  - `src/services/GetDashboardStatsService.ts`: 0 tests
  - `src/services/ListKitsService.ts`: 0 tests
  - `src/services/ListOrdersService.ts`: 0 tests
  - `src/services/SearchProductsService.ts`: 0 tests
  - `src/services/ToggleFavoriteKitService.ts`: 0 tests
- **GEMINI.md Rule:**
  > `G-TEST-2`: "Cobertura: Sempre que criar uma nova feature complexa no Service, sugira os cenários de testes unitários cruciais para ela."
- **Analysis:**
  Six of the fifteen domain services have zero unit test files. `SearchProductsService` (which calculates product availability and pagination counts) and `GetDashboardStatsService` (which aggregates revenue and fleet KPIs) represent complex business logic with zero test regression guards.
- **Actionable Remediation:**
  Author comprehensive unit tests in `src/tests/services/` for all 6 untested use cases.

---

### Finding 18: Inconsistent File Naming Conventions
- **Severity:** `LOW`
- **File Paths & Line Citations:**
  - `src/controllers/order.controller.ts` vs `src/controllers/ProductController.ts`
- **GEMINI.md Rule:**
  > `G-ARCH-3`: "Nomenclatura: O código deve ser lido como uma documentação."
- **Analysis:**
  `order.controller.ts` uses kebab/dot notation, whereas all sibling controller files use PascalCase (`ProductController.ts`, `KitController.ts`, `DashboardController.ts`).
- **Actionable Remediation:**
  Rename `src/controllers/order.controller.ts` to `OrderController.ts` for uniform project-wide convention.

---

## 4. Strategic Remediation Roadmap & Prioritization

To resolve the 18 identified findings systematically, remediation should follow a 4-phase rollout:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 0: Compilation & Critical Security Integrity (P0 - Immediate)            │
│ 1. Resolve 53 `tsc --noEmit` errors (Zod issues, OrderState enum, params).     │
│ 2. Add `"typecheck": "tsc --noEmit"` to package.json and GitHub Actions CI.    │
│ 3. Redact authorization/cookie headers in Winston request logger.              │
│ 4. Whitelist CORS origins and mount /health before express-rate-limit.         │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Architectural Layering & Connection Pooling (P1 - High)               │
│ 1. Consolidate 4 connection pools into a shared singleton (`infra/database`).  │
│ 2. Create `DashboardRepository` and decouple `GetDashboardStatsService`.       │
│ 3. Add `findByIdWithAssets` to `ProductRepository` and remove update hacks.     │
│ 4. Extract route dependency instantiations into a centralized container.      │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Input Validation, Transactions & Error Handling (P2 - Medium)         │
│ 1. Enforce Zod UUID validation on all `req.params` across all routes.          │
│ 2. Centralize all inline schemas into `src/schemas/`.                          │
│ 3. Refactor all controllers to remove local catch blocks and call next(error). │
│ 4. Wrap multi-table updates in `ConfirmOrderService` in prisma.$transaction.   │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Performance, Testing & Cleanliness (P3 - Refinement)                  │
│ 1. Add composite database indexes on `Order` and `Asset` in `schema.prisma`.   │
│ 2. Implement pagination on `OrderRepository.findAll` and `KitRepository`.     │
│ 3. Write unit test suites for the 6 untested domain services.                  │
│ 4. Translate Portuguese error messages and database enums into English.        │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Conclusion & Verification Strategy

This audit provides an actionable, objective baseline of all architectural and code-quality deviations within the Pegue-e-Monte backend. By resolving the findings according to the prioritized roadmap, the engineering team will eliminate runtime risks, ensure strict TypeScript safety, prevent database pool exhaustion, and establish a resilient foundation compliant with `GEMINI.md`.
