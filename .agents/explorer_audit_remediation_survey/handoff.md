# Architectural Standardization Survey & R1 Remediation Plan

**Target System:** Audiovisual Equipment Rental Management System ("Pegue-e-Monte")  
**Target Directory:** `/home/workspace/backend-boilerplate`  
**Reference Guidelines:** `/home/workspace/backend-boilerplate/GEMINI.md`  
**Source Audit:** `/home/workspace/backend-boilerplate/AUDIT.md`  
**Survey Date:** 2026-09-08  
**Author:** Teamwork Explorer (`explorer_audit_remediation_survey`)

---

## Executive Summary

A comprehensive investigation of `/home/workspace/backend-boilerplate/src/` confirms that all **18 architectural deviations** reported in `AUDIT.md` are present in the active codebase, including **53 silent TypeScript compilation errors** that currently prevent `tsc --noEmit` from succeeding. While all 38 existing tests currently pass under Vitest because `tsup` and `vitest` strip types without strict verification, the architecture exhibits high-risk anti-patterns: 4 separate database connection pools (hazardous against the configured Supabase transaction pooler), direct ORM injection inside services, unvalidated route parameters, controllers bypassing global error handling with local catch blocks, unpaginated collection queries, and dummy mutative update calls (`update(id, {})`) used as read queries. 

This document details the exact state of every affected file, maps the causal relationships behind the architectural failures, and presents a concrete, zero-regression refactoring plan for **R1 (Architectural Standardization)** that guarantees 100% compliance with `GEMINI.md`.

---

## 1. Observation: Layer-by-Layer Inspection & Verification of Findings

Direct filesystem inspection, static analysis via `npx tsc --noEmit`, and test evaluation via `npx vitest run` revealed the following verified facts across the 8 application layers:

### 1.1 Summary of Verified Findings (18 of 18 Confirmed)

| # | Finding Description | Affected Files | Severity | Current Codebase Status |
|---|---------------------|----------------|----------|-------------------------|
| **1** | 53 silent `tsc --noEmit` errors | 13 files across routes, controllers, services, tests | `CRITICAL` | Confirmed: `tsc --noEmit` exits with code 2 and 53 errors |
| **2** | Direct ORM injection in service | `src/services/GetDashboardStatsService.ts`, `src/routes/dashboard.routes.ts` | `HIGH` | Confirmed: `PrismaClient` passed directly to constructor |
| **3** | 4 redundant DB connection pools | `src/routes/*.routes.ts` (all 4 route files) | `HIGH` | Confirmed: 4 separate `new Pool()` and `new PrismaClient()` instances |
| **4** | Missing Zod route parameter validation | `order.controller.ts`, `ProductController.ts`, `KitController.ts` | `CRITICAL` | Confirmed: `req.params.id` and `req.params.orderId` never parsed with Zod |
| **5** | Controllers bypassing `errorHandler` | `ProductController.ts`, `order.controller.ts` | `HIGH` | Confirmed: 7 controller methods catch errors locally, return ad-hoc JSON |
| **6** | Dummy mutative read query (`update(id, {})`) | `UpdateProductStockService.ts`, `DeleteProductService.ts` | `HIGH` | Confirmed: lines 30, 59 in stock service, line 9 in delete service |
| **7** | Cleartext logging of sensitive headers | `src/middlewares/logging.middleware.ts` | `HIGH` | Confirmed: line 44 logs `headers: req.headers` containing auth tokens/cookies |
| **8** | Insecure wildcard CORS | `src/app.ts` | `MEDIUM` | Confirmed: line 25 registers `app.use(cors())` with no whitelist |
| **9** | Rate limiter blocking `/health` | `src/app.ts` | `MEDIUM` | Confirmed: `app.use(limiter)` on line 28 precedes `app.get('/health')` on line 31 |
| **10** | Non-transactional multi-step mutations | `ConfirmOrderService.ts`, `FinishOrderService.ts`, `OrderRepository.ts`, `ProductRepository.ts` | `HIGH` | Confirmed: sequential DB calls without `prisma.$transaction` |
| **11** | Missing DB composite indexes | `prisma/schema.prisma` | `HIGH` | Confirmed: foreign keys and date ranges lack `@@index` annotations |
| **12** | Unpaginated collection queries | `OrderRepository.ts`, `KitRepository.ts`, `ListOrdersService.ts`, `ListKitsService.ts` | `HIGH` | Confirmed: unbounded `findMany` with deep nested relations |
| **13** | Incomplete DIP in service constructors | 10 service files (`CreateProductService`, `UpdateOrderService`, etc.) | `MEDIUM` | Confirmed: services couple directly to concrete repository classes |
| **14** | Non-existent enum `OrderState.TOTAL_LOSS` | `FinishOrderService.ts`, `UpdateOrderService.ts`, `DeleteOrderService.ts` | `HIGH` | Confirmed: `TOTAL_LOSS` is in `AssetState`, not in `OrderState` |
| **15** | Hardcoded Portuguese in messages & enums | 9 service files, controllers, `app.ts`, `schema.prisma` (`LOUÇAS`) | `MEDIUM` | Confirmed: error strings in PT; `schema.prisma` line 31 has `LOUÇAS` |
| **16** | Deprecated Zod 4 property `err.errors` | `errorHandler.middleware.ts`, `ProductController.ts`, `order.controller.ts` | `HIGH` | Confirmed: TS2339 compiler error on `err.errors` (Zod 4 uses `issues`) |
| **17** | 40% service unit test gap | `CreateKitService`, `GetDashboardStatsService`, `ListKitsService`, `ListOrdersService`, `SearchProductsService`, `ToggleFavoriteKitService` | `HIGH` | Confirmed: 6 of 15 services have zero `.spec.ts` files |
| **18** | Inconsistent controller file naming | `src/controllers/order.controller.ts` vs `ProductController.ts` | `LOW` | Confirmed: kebab/dot casing mixed with PascalCase |

---

### 1.2 Granular Verification Across Layers

#### Layer 1: App Configuration & Security (`src/app.ts`, `src/server.ts`, `src/middlewares/logging.middleware.ts`)
- **Observation 1.2.1 (`src/app.ts:20`):** Rate limiter error message is hardcoded in Portuguese: `message: 'Muitas requisições deste IP, tente novamente mais tarde.'` (Violates GEMINI.md G-ARCH-3).
- **Observation 1.2.2 (`src/app.ts:25`):** `app.use(cors())` contains no origin configuration, resolving to `Access-Control-Allow-Origin: *` (Violates GEMINI.md G-SEC-1).
- **Observation 1.2.3 (`src/app.ts:28, 31`):** `app.use(limiter)` is mounted on line 28, before `app.get('/health')` on line 31. Docker and Kubernetes liveness probes hitting `/health` every 5–10 seconds exceed the 100 req/15min quota and trigger false container restarts (Violates GEMINI.md G-SEC-1, G-SEC-3).
- **Observation 1.2.4 (`src/middlewares/logging.middleware.ts:44`):**
  ```typescript
  logger.info("Request started", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    headers: req.headers, // DANGEROUS: Dumps Authorization Bearer tokens and Cookie headers into stdout/logs
  });
  ```
  Violates GEMINI.md G-SEC-2.

#### Layer 2: Middlewares & Errors (`src/middlewares/errorHandler.middleware.ts`, `src/errors/AppError.ts`)
- **Observation 1.2.5 (`src/middlewares/errorHandler.middleware.ts:31`):**
  ```typescript
  return res
    .status(400)
    .json({ error: "Validation failed", details: err.errors });
  ```
  In Zod v4.4.2 (installed in `package.json`), `err.errors` does not exist on `ZodError`, triggering `error TS2339: Property 'errors' does not exist on type 'ZodError<unknown>'`. At runtime, `details` evaluates to `undefined`.
- **Observation 1.2.6 (`src/errors/AppError.ts`):** `AppError` is properly implemented with `statusCode` and prototype restoration, but controllers consistently bypass it.

#### Layer 3: Routes Layer (`src/routes/*.routes.ts`)
- **Observation 1.2.7 (Composition Root & Connection Multiplier):**
  All four route files (`order.routes.ts`, `product.routes.ts`, `kit.routes.ts`, `dashboard.routes.ts`) duplicate the following database initialization block:
  ```typescript
  const connectionString = `${process.env.DATABASE_URL}`;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  ```
  Because `.env` points to a Supabase pooler (`postgresql://...aws-0-us-east-1.pooler.supabase.com:6543/postgres`), this quadruples the client connection footprint at startup.
- **Observation 1.2.8 (Route Responsibility Breach):**
  `src/routes/order.routes.ts` instantiates 4 repositories, 6 services, and the controller inside the route file (lines 22–46). GEMINI.md G-BACK-1.1 strictly mandates: *"Routes: Apenas mapeiam os endpoints para os controllers."* Routes should contain only endpoint route declarations, not dependency graph wiring.
- **Observation 1.2.9 (Compiler Incompatibilities in Route Signatures):**
  - `src/routes/order.routes.ts:33`: `OrderRepository` return type for `findById` has `totalAmount: Decimal`, whereas `ConfirmOrderService`'s `IOrderRepository` expects `number | string`.
  - `src/routes/order.routes.ts:34`: `OrderRepository.updateState` returns `Order`, whereas `FinishOrderService`'s `IOrderRepository` expects `OrderData` with `assets`.
  - `src/routes/order.routes.ts:63, 66`: Controller methods `update` and `delete` only accepted 2 arguments `(req, res)` but the route passed `(req, res, next)`.

#### Layer 4: Controllers Layer (`src/controllers/*.ts`)
- **Observation 1.2.10 (Missing Parameter Validation):**
  - `order.controller.ts:42`: `const { orderId } = req.params;` passed directly to `confirmOrderService.execute(orderId, ...)` without Zod UUID validation. Under Express 5, `req.params.orderId` is typed `string | string[] | undefined`, causing TS2345.
  - `order.controller.ts:61, 83, 107`: `const { id } = req.params;` passed unvalidated.
  - `ProductController.ts:67, 93, 118`: `const { id } = req.params;` passed unvalidated.
  - `KitController.ts:53`: `const { id } = req.params;` passed unvalidated.
  Violates GEMINI.md G-BACK-2: *"Toda entrada de dados (Body, Params, Query) deve ser estritamente validada usando Zod antes de chegar aos Services."*
- **Observation 1.2.11 (Error Handler Bypass with Local Catch Blocks):**
  `ProductController.ts` methods `index`, `create`, `update`, `updateStock`, and `delete` catch errors locally and return custom JSON envelopes:
  ```typescript
  // ProductController.ts:54-63
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    const err = error as { statusCode?: number; message?: string };
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ message: err.message || "Erro interno ao criar produto" });
  }
  ```
  This bypasses `errorHandler.middleware.ts`, suppresses Winston error logging, and leaks raw console statements (`console.error`).
- **Observation 1.2.12 (Inline Schemas):**
  `ProductController.ts` and `KitController.ts` define Zod schemas inline inside controller methods rather than organizing them in `src/schemas/`.

#### Layer 5: Services Layer (`src/services/*.ts`)
- **Observation 1.2.13 (`GetDashboardStatsService.ts:1, 5`):**
  `GetDashboardStatsService` bypasses the repository layer completely, taking `PrismaClient` directly in its constructor and executing 5 raw ORM queries (`prisma.asset.count`, `prisma.order.groupBy`, etc.). Violates GEMINI.md G-BACK-1.4: *"Repositories/DAOs: Única camada responsável por interagir com o banco de dados."*
- **Observation 1.2.14 (Dummy Mutative Update Anti-Pattern):**
  In `UpdateProductStockService.ts` (lines 30, 59) and `DeleteProductService.ts` (line 9):
  ```typescript
  const productWithAssets = await this.productRepository.update(id, {}); // update with empty data returns include: {assets: true}
  ```
  An empty update is executed against PostgreSQL solely to retrieve the relation `assets`. This mutates the `updatedAt` timestamp and acquires row-level write locks for a read-only requirement.
- **Observation 1.2.15 (Invalid Enum Reference `OrderState.TOTAL_LOSS`):**
  - `FinishOrderService.ts:34`: `order.state === OrderState.TOTAL_LOSS`
  - `UpdateOrderService.ts:30`: `order.state === OrderState.TOTAL_LOSS`
  - `DeleteOrderService.ts:19`: `OrderState.TOTAL_LOSS`
  In `prisma/schema.prisma` and `src/domain/OrderState.ts`, `OrderState` does not contain `TOTAL_LOSS`. `TOTAL_LOSS` is only defined in `AssetState`. At runtime, `OrderState.TOTAL_LOSS` is `undefined`.
- **Observation 1.2.16 (Non-Existent Prisma Runtime Export):**
  `CreateQuoteService.ts:45` and `AssetRepository.ts:22` import `import("@prisma/client/runtime/library").Decimal`. In Prisma 7, this path cannot be resolved, throwing TS2307.
- **Observation 1.2.17 (Concrete Repository Dependency Injection):**
  10 services declare concrete repository classes in their constructors (`constructor(private readonly productRepository: ProductRepository)`) instead of interfaces, violating the Dependency Inversion Principle (GEMINI.md G-TEST-1, G-ARCH-1).
- **Observation 1.2.18 (Hardcoded Portuguese Messages):**
  Services consistently throw `new AppError("Pedido não encontrado.", 404)` and `new AppError("Estoque insuficiente para o produto...", 409)` in Portuguese, conflicting with GEMINI.md G-ARCH-3.

#### Layer 6: Repositories Layer (`src/repositories/*.ts`)
- **Observation 1.2.19 (Unpaginated High-Volume Queries):**
  `OrderRepository.findAll()` and `KitRepository.findAll()` perform unbounded `findMany` queries eager-loading all nested records, risking heap memory exhaustion in production (Violates GEMINI.md G-SEC-3).
- **Observation 1.2.20 (Non-Transactional Cascade Deletions):**
  - `OrderRepository.delete(id)` (lines 142–148) deletes `orderAsset` records and then deletes `order` in two separate un-transactioned calls.
  - `ProductRepository.delete(id)` (lines 134–140) deletes `asset` records and then deletes `productBase` in two separate un-transactioned calls.
- **Observation 1.2.21 (Repository Interface Incompatibilities):**
  `IOrderRepository` defined in `ConfirmOrderService` and `FinishOrderService` expects different shapes than what `OrderRepository` provides (e.g. `OrderRepository.updateState` does not include `assets`).

#### Layer 7: Database & Prisma (`prisma/schema.prisma`)
- **Observation 1.2.22 (Missing Indexes):**
  `Order.customerId`, `Order.state`, `Order.[pickUpDate, returnDate]`, `Asset.[productBaseId, state]`, and `KitItem.kitId` lack composite and foreign key indexes, resulting in full table scans during availability verification (Violates GEMINI.md G-SEC-3).
- **Observation 1.2.23 (Non-ASCII Enum Value):**
  `ProductCategory` defines `LOUÇAS` on line 31, introducing non-ASCII characters into the database schema and API contracts.

#### Layer 8: Tests Layer (`src/tests/`)
- **Observation 1.2.24 (Mock Typings Causing TS2339):**
  In `ConfirmOrderService.spec.ts`, `CreateQuoteService.spec.ts`, and `FinishOrderService.spec.ts`, mocks are declared as `let orderRepositoryMock: ReturnType<typeof vi.fn>;` instead of `Record<string, Mock>` or `Mocked<IOrderRepository>`. This accounts for **30 of the 53 `tsc --noEmit` compilation errors**.
- **Observation 1.2.25 (Test Coverage Gap):**
  6 services (`CreateKitService`, `GetDashboardStatsService`, `ListKitsService`, `ListOrdersService`, `SearchProductsService`, `ToggleFavoriteKitService`) have no unit test files in `src/tests/services/` (Violates GEMINI.md G-TEST-2).
- **Observation 1.2.26 (Test Coupling to Portuguese Strings):**
  Existing tests in `DeleteOrderService.spec.ts`, `UpdateOrderService.spec.ts`, `DeleteProductService.spec.ts`, `UpdateProductService.spec.ts`, and `UpdateProductStockService.spec.ts` assert verbatim Portuguese error strings (e.g., `rejects.toThrow(new AppError("Pedido não encontrado.", 404))`).

---

## 2. Logic Chain: Root Causes and Cascading Systemic Impacts

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             ROOT ARCHITECTURAL FLAWS                            │
│  - No central database singleton; connection pools created inside route files    │
│  - esbuild stripping types without `tsc --noEmit` check in CI pipeline           │
│  - Routes acting as composition root instead of a dedicated container            │
│  - Zod parsing applied exclusively to request body, omitting params and query    │
│  - Controllers manually handling exceptions rather than propagating to next()    │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              CASCADING CONSEQUENCES                              │
│                                                                                  │
│ 1. Production Database Failure:                                                  │
│    Each route instantiating Pool + PrismaPg creates 4 pools per node process.    │
│    Connecting to Supabase transaction pooler (port 6543) quickly triggers        │
│    MaxClientConnections errors and drops connections under concurrency.          │
│                                                                                  │
│ 2. Silent Type Drift & Runtime Crashes:                                          │
│    53 compilation errors accumulated silently. `OrderState.TOTAL_LOSS` is dead   │
│    code (evaluates to undefined), and `err.errors` produces undefined payloads. │
│                                                                                  │
│ 3. Data Inconsistency & Race Conditions:                                         │
│    ConfirmOrderService updates order to RESERVED and assets to RENTED in two     │
│    separate queries without prisma.$transaction. A failure midway permanently    │
│    desynchronizes order state from asset availability.                           │
│                                                                                  │
│ 4. Read Bottlenecks & Locking:                                                   │
│    `update(id, {})` hack issues mutative UPDATEs to read assets, locking rows   │
│    in PostgreSQL and distorting updatedAt audit trails.                          │
│                                                                                  │
│ 5. Inconsistent API Error Envelopes:                                             │
│    ProductController returns { message: string }, while errorHandler returns     │
│    { error: string }. Frontend clients cannot reliably parse error payloads.     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

1. **Premise A:** In Express 5 and modern TypeScript, `req.params` values are typed as `string | string[] | undefined`. Without Zod coercion and validation, passing raw params into services expecting `string` UUIDs causes TypeScript compile failures and accepts malformed input.
2. **Premise B:** `tsup` relies on esbuild, which strips type annotations without type checking. Because `package.json` lacked a `"typecheck": "tsc --noEmit"` script and CI did not run `tsc`, 53 errors went undetected while `npm run build` and `npm test` passed.
3. **Premise C:** When route files instantiate connections, pooling cannot be shared across modules. In cloud environments using transaction poolers with small connection limits, multiple pools lead to exhaustion.
4. **Premise D:** When domain operations involve multiple database mutations (e.g. order reservation + asset status updates), the absence of transactional boundaries risks partial writes and corrupted inventory states.
5. **Conclusion:** Remediation must be executed in a structured, phased sequence that unifies the persistence layer first, standardizes schemas and error propagation next, decouples routing via dependency inversion, and aligns all unit tests without functional regression.

---

## 3. Caveats & Assumptions

1. **Database Connectivity during CI/Local Execution:**
   - The PostgreSQL database URL in `.env` points to an external Supabase instance (`aws-0-us-east-1.pooler.supabase.com`). If network access to Supabase is throttled or offline, Prisma schema migrations must be performed with caution. Adding indexes to `schema.prisma` does not break TypeScript compilation or unit tests, which run fully mocked in Vitest.
2. **Enum `LOUÇAS` vs `TABLEWARE`:**
   - In production databases, renaming an existing PostgreSQL enum value requires an `ALTER TYPE ... RENAME VALUE` migration. For the backend codebase, we should introduce an English alias or mapping to satisfy GEMINI.md naming requirements while remaining compatible with existing database rows.
3. **Test String Coupling:**
   - Because 5 existing test files assert verbatim Portuguese error strings, changing service messages to English must be paired with updating the corresponding test assertions in the exact same commit; otherwise, the test suite will fail.
4. **Pagination Contract:**
   - Modifying `findAll` to return `{ data, total, page, limit }` instead of a plain array must be reflected in controllers and route tests. `ListOrdersService` and `ListKitsService` will expose paginated results with sensible defaults (`page = 1, limit = 20`) so callers omitting query parameters still receive predictable responses.

---

## 4. Concrete R1 Refactoring Plan (Architectural Standardization)

To achieve 100% compliance with `GEMINI.md` and resolve all 18 findings without breaking existing functionality, the implementation is organized into **6 sequential, verifiable phases**:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 0: Compilation, Security & Hygiene Baseline (P0 - Immediate)              │
│ 1. Fix Zod 4 `err.issues` in `errorHandler.middleware.ts`.                      │
│ 2. Remove invalid `OrderState.TOTAL_LOSS` in 3 services.                        │
│ 3. Fix `@prisma/client/runtime/library` Decimal imports.                        │
│ 4. Fix mock typing declarations in the 3 broken test specs.                     │
│ 5. Add `"typecheck": "tsc --noEmit"` to package.json.                           │
│ 6. Sanitize headers in Winston logger (`authorization`, `cookie`, `x-api-key`). │
│ 7. Restrict CORS origins via whitelist in `src/app.ts`.                         │
│ 8. Move `/health` endpoint before rate limiter middleware in `src/app.ts`.      │
│ 9. Rename `order.controller.ts` to `OrderController.ts`.                        │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Database Singleton, Interfaces & Transactions (P1 - High)              │
│ 1. Create `src/infra/database.ts` with singleton `prisma` and `pool`.           │
│ 2. Add composite indexes to `prisma/schema.prisma` on Order, Asset, KitItem.   │
│ 3. Define repository interfaces in `src/repositories/contracts/`.               │
│ 4. Implement `IDashboardRepository` and `DashboardRepository`.                  │
│ 5. Add `findByIdWithAssets(id)` to `ProductRepository` and replace update hack.│
│ 6. Add transactional operations (`prisma.$transaction`) in Order/Product repos. │
│ 7. Implement pagination (`findAll({ page, limit })`) in Order & Kit repos.      │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Schemas & Strict Input Validation (P1 - High)                          │
│ 1. Create `src/schemas/params.schema.ts` (idParamSchema, orderIdParamSchema).   │
│ 2. Create `src/schemas/product.schema.ts` and `src/schemas/kit.schema.ts`.      │
│ 3. Create `src/schemas/pagination.schema.ts` for query params.                  │
│ 4. Move all inline schemas out of controllers into `src/schemas/`.              │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Service Layer Clean-up & DIP (P1 - High)                               │
│ 1. Refactor `GetDashboardStatsService` to inject `IDashboardRepository`.        │
│ 2. Refactor all 10 concrete repository services to inject interfaces.           │
│ 3. Replace all instances of `update(id, {})` with `findByIdWithAssets(id)`.     │
│ 4. Standardize error messages to English in services and align test assertions. │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: Controller Standardization & Error Handling (P1 - High)                │
│ 1. Refactor all controllers to use `(req, res, next): Promise<void>`.          │
│ 2. Eliminate all local try/catch error handling; delegate all errors to next(). │
│ 3. Enforce Zod validation for body, params, and query across all endpoints.     │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: Routes & Dependency Injection Container (P2 - Medium)                  │
│ 1. Create `src/infra/container.ts` to instantiate repositories & services.      │
│ 2. Clean up all route files: routes only map endpoints to controllers.          │
│ 3. Remove all pool/Prisma client instantiations from route files.               │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 6: Test Suite Modernization & Gap Elimination (P2 - Medium)               │
│ 1. Update existing tests to mock repository interfaces cleanly.                 │
│ 2. Update `UpdateProductStockService` and `DeleteProductService` test mocks     │
│    to mock `findByIdWithAssets` instead of `update`.                            │
│ 3. Author 6 new unit test suites for the untested services.                     │
│ 4. Verify 100% pass across `npm test`, `npm run build`, and `npm run typecheck`.│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.1 Detailed Code Changes by Phase

#### Phase 0: Compilation, Security & Hygiene Baseline

1. **Update `package.json`:**
   ```json
   "scripts": {
     "dev": "tsx watch src/server.ts",
     "build": "tsup src --out-dir=dist --clean",
     "start": "node dist/server.cjs",
     "typecheck": "tsc --noEmit",
     "lint": "eslint src --ext .ts --fix",
     "format": "prettier --write src/**/*.ts",
     "test": "vitest run",
     "test:watch": "vitest"
   }
   ```

2. **Fix `src/middlewares/errorHandler.middleware.ts`:**
   Replace `.json({ error: "Validation failed", details: err.errors })` with:
   ```typescript
   if (err instanceof z.ZodError) {
     logger.warn("Validation error", {
       details: err.issues,
       url: req.originalUrl,
       method: req.method,
     });
     return res
       .status(400)
       .json({ error: "Validation failed", details: err.issues });
   }
   ```

3. **Fix Invalid Enum `OrderState.TOTAL_LOSS`:**
   - In `src/services/FinishOrderService.ts`:
     ```typescript
     if (
       order.state === OrderState.DRAFT ||
       order.state === OrderState.COMPLETED
     ) {
       throw new AppError("Order cannot be finished in its current state", 400);
     }
     ```
   - In `src/services/UpdateOrderService.ts`:
     ```typescript
     if (
       order.state === OrderState.COMPLETED ||
       order.state === OrderState.COMPLETED_WITH_DAMAGES
     ) {
       throw new AppError("Cannot edit an order that has already been finished.", 400);
     }
     ```
   - In `src/services/DeleteOrderService.ts`:
     ```typescript
     const deletableStates = [
       OrderState.DRAFT,
       OrderState.COMPLETED,
       OrderState.COMPLETED_WITH_DAMAGES,
     ];
     ```

4. **Fix Decimal Imports (`AssetRepository.ts` & `CreateQuoteService.ts`):**
   Replace `import("@prisma/client/runtime/library").Decimal` with `Prisma.Decimal` imported from `@prisma/client`.

5. **Fix Mock Typings in Test Files:**
   In `ConfirmOrderService.spec.ts`, `CreateQuoteService.spec.ts`, and `FinishOrderService.spec.ts`, replace `ReturnType<typeof vi.fn>` with explicit mocked object types:
   ```typescript
   let orderRepositoryMock: {
     findById: Mock;
     updateState: Mock;
     updateAssetStates: Mock;
     checkAssetsAvailability: Mock;
     create?: Mock;
   };
   ```

6. **Sanitize Request Headers in `src/middlewares/logging.middleware.ts`:**
   ```typescript
   export function requestLogger(req: Request, res: Response, next: NextFunction): void {
     const startTime = Date.now();
     const sanitizedHeaders = { ...req.headers };
     delete sanitizedHeaders.authorization;
     delete sanitizedHeaders.cookie;
     delete sanitizedHeaders["x-api-key"];

     logger.info("Request started", {
       method: req.method,
       url: req.url,
       ip: req.ip,
       userAgent: req.get("User-Agent"),
       headers: sanitizedHeaders,
     });
     // ...
   }
   ```

7. **Fix CORS & Rate Limiter in `src/app.ts`:**
   ```typescript
   const app: Application = express();
   app.set('trust proxy', 1);

   // Middlewares Globais
   app.use(helmet());

   const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:3000").split(",");
   app.use(cors({
     origin: (origin, callback) => {
       if (!origin || allowedOrigins.includes(origin)) {
         callback(null, true);
       } else {
         callback(new AppError("Not allowed by CORS policy", 403));
       }
     },
     credentials: true,
   }));

   app.use(express.json());
   app.use(requestLogger);

   // Healthcheck endpoint (BEFORE rate limiter)
   app.get('/health', (req: Request, res: Response) => {
     res.status(200).json({ status: 'OK', uptime: process.uptime() });
   });

   // Apply rate limiter to API routes only
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     limit: 100,
     message: 'Too many requests from this IP, please try again later.'
   });
   app.use('/api', limiter);
   ```

8. **Rename Controller:**
   Rename `src/controllers/order.controller.ts` to `src/controllers/OrderController.ts` and update references in `order.routes.ts`.

---

#### Phase 1: Database Singleton, Interfaces & Transactions

1. **Create `src/infra/database.ts`:**
   ```typescript
   import { Pool } from "pg";
   import { PrismaPg } from "@prisma/adapter-pg";
   import { PrismaClient } from "@prisma/client";

   const connectionString = process.env.DATABASE_URL;
   if (!connectionString) {
     throw new Error("DATABASE_URL environment variable is required.");
   }

   export const pool = new Pool({ connectionString });
   const adapter = new PrismaPg(pool);
   export const prisma = new PrismaClient({ adapter });
   ```

2. **Add Missing Indexes in `prisma/schema.prisma`:**
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

3. **Add `findByIdWithAssets` in `ProductRepository.ts`:**
   ```typescript
   public async findByIdWithAssets(id: string) {
     return this.prisma.productBase.findUnique({
       where: { id },
       include: { assets: true },
     });
   }
   ```

4. **Wrap Multi-Table Operations in `prisma.$transaction`:**
   - In `OrderRepository.ts`:
     ```typescript
     public async delete(id: string): Promise<void> {
       await this.prisma.$transaction(async (tx) => {
         await tx.orderAsset.deleteMany({ where: { orderId: id } });
         await tx.order.delete({ where: { id } });
       });
     }

     public async confirmOrderTransaction(
       orderId: string,
       amountPaid: number,
       assetIds: string[],
     ): Promise<Order> {
       return this.prisma.$transaction(async (tx) => {
         const order = await tx.order.update({
           where: { id: orderId },
           data: { state: OrderState.RESERVED, amountPaid },
         });
         if (assetIds.length > 0) {
           await tx.asset.updateMany({
             where: { id: { in: assetIds } },
             data: { state: AssetState.RENTED },
           });
         }
         return order;
       });
     }
     ```
   - In `ProductRepository.ts`:
     ```typescript
     public async delete(id: string) {
       return this.prisma.$transaction(async (tx) => {
         await tx.asset.deleteMany({ where: { productBaseId: id } });
         return tx.productBase.delete({ where: { id } });
       });
     }
     ```

5. **Extract `DashboardRepository`:**
   Create `src/repositories/DashboardRepository.ts` implementing `IDashboardRepository` to encapsulate all 5 ORM aggregation queries currently residing in `GetDashboardStatsService`.

---

#### Phase 2: Schemas & Strict Input Validation

1. **Create `src/schemas/params.schema.ts`:**
   ```typescript
   import { z } from "zod";

   export const idParamSchema = z.object({
     id: z.string().uuid("Parameter :id must be a valid UUID"),
   });

   export const orderIdParamSchema = z.object({
     orderId: z.string().uuid("Parameter :orderId must be a valid UUID"),
   });
   ```

2. **Create `src/schemas/product.schema.ts`:**
   Extract `createProductSchema`, `updateProductSchema`, `updateStockSchema`, and `searchProductsQuerySchema` into `src/schemas/product.schema.ts`.

3. **Create `src/schemas/kit.schema.ts`:**
   Extract `createKitSchema`, `toggleFavoriteKitSchema` into `src/schemas/kit.schema.ts`.

---

#### Phase 3: Service Layer Clean-up & Dependency Inversion

1. **Define Repository Interfaces in `src/repositories/contracts/`:**
   - `IProductRepository.ts`
   - `IOrderRepository.ts`
   - `IKitRepository.ts`
   - `IDashboardRepository.ts`
   - `IAssetRepository.ts`
   - `ICustomerRepository.ts`

2. **Inject Interfaces across all Services:**
   Update all 15 services to depend strictly on repository interfaces rather than concrete classes.

3. **Eliminate `update(id, {})` in Services:**
   - In `UpdateProductStockService.ts`:
     ```typescript
     // BEFORE: const productWithAssets = await this.productRepository.update(id, {});
     // AFTER:
     const productWithAssets = await this.productRepository.findByIdWithAssets(id);
     ```
   - In `DeleteProductService.ts`:
     ```typescript
     // BEFORE: const product = await this.productRepository.update(id, {});
     // AFTER:
     const product = await this.productRepository.findByIdWithAssets(id);
     ```

4. **Standardize Error Messages to English:**
   - Replace `"Pedido não encontrado."` with `"Order not found."`
   - Replace `"Produto não encontrado."` with `"Product not found."`
   - Replace `"O estoque não pode ser negativo."` with `"Stock quantity cannot be negative."`
   - Replace `"O preço por dia deve ser maior que zero."` with `"Daily price must be greater than zero."`
   - Replace `"Não é possível editar um pedido já finalizado."` with `"Cannot edit an order that has already been finished."`
   - Synchronize all corresponding test assertions in `src/tests/services/*.spec.ts`.

---

#### Phase 4: Controller Standardization & Error Propagation

1. **Standardize all Controller Signatures:**
   All controller methods must declare:
   ```typescript
   public async method(req: Request, res: Response, next: NextFunction): Promise<void>
   ```

2. **Standard Pattern for All Controller Endpoints:**
   ```typescript
   public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
     try {
       const { id } = idParamSchema.parse(req.params);
       const data = updateProductSchema.parse(req.body);
       const product = await this.updateService.execute({ id, ...data });
       res.status(200).json(product);
     } catch (error) {
       next(error);
     }
   }
   ```
   All local catches and manual `res.status(500).json(...)` are completely removed.

---

#### Phase 5: Routes & Centralized Dependency Container

1. **Create `src/infra/container.ts`:**
   Instantiate repositories, services, and controllers once using the shared `prisma` singleton.
2. **Streamline Route Modules:**
   ```typescript
   // src/routes/order.routes.ts
   import { Router } from "express";
   import { orderController } from "../infra/container";

   export const orderRoutes = Router();

   orderRoutes.post("/quotes", (req, res, next) => orderController.createQuote(req, res, next));
   orderRoutes.post("/:orderId/confirm", (req, res, next) => orderController.confirmOrder(req, res, next));
   orderRoutes.post("/:id/finish", (req, res, next) => orderController.finishOrder(req, res, next));
   orderRoutes.get("/", (req, res, next) => orderController.listOrders(req, res, next));
   orderRoutes.put("/:id", (req, res, next) => orderController.update(req, res, next));
   orderRoutes.delete("/:id", (req, res, next) => orderController.delete(req, res, next));
   ```
   No database pools or service constructors exist in route modules.

---

#### Phase 6: Test Suite Modernization & Gap Elimination

1. **Fix Mock Method Signatures:**
   - In `UpdateProductStockService.spec.ts` and `DeleteProductService.spec.ts`, replace `productRepositoryMock.update` with `productRepositoryMock.findByIdWithAssets`.
2. **Align Test Error Expectations with English Messages:**
   - Update `DeleteOrderService.spec.ts`, `UpdateOrderService.spec.ts`, `DeleteProductService.spec.ts`, `UpdateProductService.spec.ts`, and `UpdateProductStockService.spec.ts` to expect English `AppError` messages.
3. **Author 6 New Service Unit Test Suites:**
   - `src/tests/services/CreateKitService.spec.ts`: test name validation, empty items guard, successful kit creation.
   - `src/tests/services/GetDashboardStatsService.spec.ts`: test correct delegation and metric payload aggregation.
   - `src/tests/services/ListKitsService.spec.ts`: test list return format and empty array handling.
   - `src/tests/services/ListOrdersService.spec.ts`: test list return format and pagination metadata.
   - `src/tests/services/SearchProductsService.spec.ts`: test availability filtering, total count, stock calculations.
   - `src/tests/services/ToggleFavoriteKitService.spec.ts`: test 404 when kit not found, successful toggle.

---

## 5. Verification Method

To verify full architectural compliance and prevent regressions, the following verification commands and checks must be executed:

### 5.1 Verification Commands

```bash
# 1. Verify TypeScript compilation (strict mode, zero errors)
npm run typecheck
# Target result: Exit code 0, 0 errors.

# 2. Verify build output
npm run build
# Target result: Exit code 0, cleanly bundled into dist/.

# 3. Verify all unit tests (existing 38 + 6 new suites)
npm test
# Target result: 16 test files passed, 100% pass rate.

# 4. Verify code formatting and lint rules
npm run lint
# Target result: Exit code 0, no ESLint violations.
```

### 5.2 Independent Inspection Criteria

| Inspection Item | File to Inspect | Expected Standard | Invalidation Condition |
| :--- | :--- | :--- | :--- |
| **Prisma Singleton** | `src/infra/database.ts` | Single `new PrismaClient({ adapter })` exported | Any `new PrismaClient` inside `src/routes/` |
| **Zod Route Params** | `src/controllers/*.ts` | Every method parsing `req.params` with Zod | Raw `const { id } = req.params;` passed to service |
| **Clean Routes** | `src/routes/*.routes.ts` | Only router definitions; no ORM or services instantiated | `new Pool` or `new *Service` inside route files |
| **No Local Catches** | `src/controllers/ProductController.ts` | Every catch block calls `next(error)` | Any `res.status(statusCode).json({ message: ... })` in catch |
| **Safe Read Queries** | `src/services/UpdateProductStockService.ts` | Calls `findByIdWithAssets(id)` | Any call to `update(id, {})` |
| **Credential Redaction** | `src/middlewares/logging.middleware.ts` | Authorization and Cookie deleted from log meta | Unsanitized `req.headers` in logger output |
| **Healthcheck Unthrottled** | `src/app.ts` | `/health` route registered before `app.use('/api', limiter)` | `/health` registered after rate limiter |
| **Service DIP** | `src/services/*.ts` | Constructors accept interface (`IProductRepository`) | Constructor accepts class `ProductRepository` |
| **English Errors** | `src/services/*.ts` | All `AppError` messages in English | Hardcoded Portuguese in thrown errors |
| **Test Coverage** | `src/tests/services/*.spec.ts` | 15 spec files (1 per service) | Any service missing dedicated spec file |

---

## Conclusion

The backend codebase possesses a well-designed domain core (buffer logic, availability checks, state transitions) that is currently undermined by pervasive architectural shortcuts: route-level connection pooling, missing param validations, local catch blocks, and dummy mutative reads. By executing the 6-phase remediation plan detailed above, the engineering team will resolve all 18 findings, eliminate the 53 `tsc` errors, preserve the existing 38 tests, and bring the codebase into full, uncompromising compliance with `GEMINI.md`.
