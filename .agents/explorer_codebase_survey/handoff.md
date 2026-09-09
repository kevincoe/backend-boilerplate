# Comprehensive Codebase & Test Harness Survey Report

**Agent:** `teamwork_preview_explorer`  
**Working Directory:** `/home/workspace/backend-boilerplate/.agents/explorer_codebase_survey`  
**Target Repository:** `/home/workspace/backend-boilerplate`  
**Date:** 2026-09-09  
**Reference Standards:** `GEMINI.md`, `ORIGINAL_REQUEST.md`, `AUDIT.md`, `ARCHITECTURE.md`

---

## 1. Observation

Directly observed files, line citations, tool commands, verbatim outputs, and codebase structures:

### 1.1 Build and Test Infrastructure
- **`package.json`** (lines 6–14):
  ```json
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsup src --out-dir=dist --clean",
    "start": "node dist/server.cjs",
    "lint": "eslint src --ext .ts --fix",
    "format": "prettier --write src/**/*.ts",
    "test": "vitest",
    "test:watch": "vitest --watch"
  }
  ```
- **Build Execution (`npm run build`)**:
  - Command: `tsup src --out-dir=dist --clean`
  - Output: `CLI tsup v8.5.1`, compiles every `.ts` entry point in `src` (including `src/tests/**/*.ts`) into `.cjs` files in `dist/`.
  - Exit code: `0` (duration: ~119ms).
  - Crucial observation: `tsup` bundles using esbuild, which strips TypeScript types without performing type verification.
- **Typecheck Execution (`npx tsc --noEmit`)**:
  - Command: `npx tsc --noEmit`
  - Output: `Found 53 errors in 13 files` (Exit code: `2`).
  - Breakdown of compilation errors:
    * `src/controllers/KitController.ts:56` (1 error)
    * `src/controllers/ProductController.ts:33, 56, 67, 82, 93, 107, 118` (7 errors)
    * `src/controllers/order.controller.ts:46, 62, 83, 96, 107` (5 errors)
    * `src/middlewares/errorHandler.middleware.ts:31` (1 error)
    * `src/repositories/AssetRepository.ts:22` (1 error)
    * `src/routes/order.routes.ts:33, 34, 63, 66` (4 errors)
    * `src/services/CreateQuoteService.ts:45` (1 error)
    * `src/services/DeleteOrderService.ts:19` (1 error)
    * `src/services/FinishOrderService.ts:34` (1 error)
    * `src/services/UpdateOrderService.ts:30` (1 error)
    * `src/tests/services/ConfirmOrderService.spec.ts:34, 42, 53, 62, 63, 76, 77, 79, 83, 90, 96` (11 errors)
    * `src/tests/services/CreateQuoteService.spec.ts:49, 57, 58, 66, 67, 68, 72, 73, 78` (9 errors)
    * `src/tests/services/FinishOrderService.spec.ts:30, 38, 49, 52, 56, 61, 71, 74, 78, 84` (10 errors)
- **Test Framework & Test Execution (`npx vitest run`)**:
  - Framework: Vitest v2.1.0 (`node_modules/vitest/package.json`: v2.1.9).
  - Root config: No `vitest.config.ts` exists in the repository root; Vitest runs with defaults.
  - Test files found: Exactly 10 files:
    1. `src/tests/example.test.ts`
    2. `src/tests/services/ConfirmOrderService.spec.ts`
    3. `src/tests/services/CreateProductService.spec.ts`
    4. `src/tests/services/CreateQuoteService.spec.ts`
    5. `src/tests/services/DeleteOrderService.spec.ts`
    6. `src/tests/services/DeleteProductService.spec.ts`
    7. `src/tests/services/FinishOrderService.spec.ts`
    8. `src/tests/services/UpdateOrderService.spec.ts`
    9. `src/tests/services/UpdateProductService.spec.ts`
    10. `src/tests/services/UpdateProductStockService.spec.ts`
  - Result: `10 passed (10)`, `38 passed (38)` in 427ms.
- **Database Call Handling in Tests**:
  - Tests do **NOT** use a real database (neither PostgreSQL, SQLite, nor pg-mem).
  - All repository interactions are mocked via Vitest `vi.fn()`:
    * E.g., `src/tests/services/CreateQuoteService.spec.ts:14–38`:
      ```typescript
      orderRepositoryMock = { create: vi.fn(), checkAssetsAvailability: vi.fn() };
      assetRepositoryMock = { findAssetsByIds: vi.fn(), countAvailableAssetsForProduct: vi.fn(), findAvailableAssetsForProduct: vi.fn() };
      ```
    * E.g., `src/tests/services/DeleteProductService.spec.ts:68`: Prisma errors are simulated by instantiating `new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", { code: "P2003", clientVersion: "7.8.0" })`.
  - There are zero HTTP integration tests (no `supertest` package installed).

---

### 1.2 Prisma Models, Enums, and Database Connections
- **Schema Location**: `/home/workspace/backend-boilerplate/prisma/schema.prisma`
- **Datasource Configuration** (`schema.prisma:5–7`):
  ```prisma
  datasource db {
    provider = "postgresql"
  }
  ```
  Note: No `url = env("DATABASE_URL")` exists in `schema.prisma`. Connections are configured programmatically via `@prisma/adapter-pg`.
- **Existing Enums (3)**:
  1. `OrderState` (`schema.prisma:9–17`):
     `DRAFT`, `AWAITING_DEPOSIT`, `RESERVED`, `IN_PROGRESS`, `PENDING_INSPECTION`, `COMPLETED`, `COMPLETED_WITH_DAMAGES`
  2. `AssetState` (`schema.prisma:19–26`):
     `AVAILABLE`, `RESERVED`, `RENTED`, `IN_INSPECTION`, `IN_MAINTENANCE`, `TOTAL_LOSS`
  3. `ProductCategory` (`schema.prisma:28–35`):
     `MOVEIS`, `DECORACAO`, `LOUÇAS`, `TECIDOS`, `ELETRONICOS`, `GERAL` (Note: `LOUÇAS` contains non-ASCII `Ç`)
- **Existing Models (8)**:
  1. `Customer` (`schema.prisma:37–47`):
     `id` (UUID PK), `name` (String), `email` (String unique), `phone` (String), `document` (String unique, CPF/CNPJ), `score` (Int default 10), `orders` (Order[]), `createdAt`, `updatedAt`.
  2. `ProductBase` (`schema.prisma:49–60`):
     `id` (UUID PK), `name` (String), `description` (String?), `dailyPrice` (Decimal 10,2), `category` (ProductCategory default GERAL), `imageUrl` (String?), `assets` (Asset[]), `kitItems` (KitItem[]), `createdAt`, `updatedAt`.
  3. `Asset` (`schema.prisma:62–72`):
     `id` (UUID PK), `productBaseId` (String FK), `product` (ProductBase relation), `serialNumber` (String unique), `state` (AssetState default AVAILABLE), `orders` (OrderAsset[]), `maintenanceLog` (MaintenanceLog[]), `createdAt`, `updatedAt`.
  4. `Order` (`schema.prisma:74–86`):
     `id` (UUID PK), `customerId` (String FK), `customer` (Customer relation), `state` (OrderState default DRAFT), `totalAmount` (Decimal 10,2), `amountPaid` (Decimal 10,2 default 0.00), `pickUpDate` (DateTime), `returnDate` (DateTime), `assets` (OrderAsset[]), `createdAt`, `updatedAt`.
  5. `OrderAsset` (`schema.prisma:89–96`):
     `orderId` (String FK), `assetId` (String FK), `order` (Order relation), `asset` (Asset relation), composite PK `@@id([orderId, assetId])`.
  6. `MaintenanceLog` (`schema.prisma:98–107`):
     `id` (UUID PK), `assetId` (String FK), `asset` (Asset relation), `description` (String), `cost` (Decimal 10,2?), `resolved` (Boolean default false), `createdAt`, `updatedAt`.
  7. `Kit` (`schema.prisma:109–118`):
     `id` (UUID PK), `name` (String), `description` (String?), `price` (Decimal 10,2), `isFavorited` (Boolean default false), `items` (KitItem[]), `createdAt`, `updatedAt`.
  8. `KitItem` (`schema.prisma:120–127`):
     `id` (UUID PK), `kitId` (String FK onDelete Cascade), `kit` (Kit relation), `productBaseId` (String FK), `productBase` (ProductBase relation), `quantity` (Int default 1).
- **Database Connection Setup in Code**:
  - Connection stack: `pg.Pool` + `@prisma/adapter-pg.PrismaPg` + `@prisma/client.PrismaClient`.
  - Critical observation: 4 independent pools are instantiated across 4 route files at load time:
    * `src/routes/order.routes.ts:17–20`
    * `src/routes/product.routes.ts:13–16`
    * `src/routes/kit.routes.ts:11–14`
    * `src/routes/dashboard.routes.ts:8–11`
  - Code pattern repeated in all 4 files:
    ```typescript
    const connectionString = `${process.env.DATABASE_URL}`;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    ```

---

### 1.3 Express Configuration and Routing Pipeline
- **Entry Points**:
  - `src/server.ts:1–10`: imports `dotenv/config`, imports `app` from `./app`, starts `app.listen(PORT)` with `PORT = process.env.PORT || 3333`.
  - `src/app.ts:1–44`:
    * Line 15: `app.set('trust proxy', 1);`
    * Line 24: `app.use(helmet());`
    * Line 25: `app.use(cors());` (Wildcard `*` origin)
    * Line 26: `app.use(express.json());`
    * Line 27: `app.use(requestLogger);` (`src/middlewares/logging.middleware.ts:44` logs `req.headers` including tokens/cookies)
    * Line 28: `app.use(limiter);` (100 req / 15 min per IP)
    * Line 31–33: `app.get('/health', (req, res) => { res.status(200).json({ status: 'OK', uptime: process.uptime() }); });` (Mounted *after* rate limiter)
    * Lines 36–39:
      ```typescript
      app.use('/api/orders', orderRoutes);
      app.use('/api/products', productRoutes);
      app.use('/api/kits', kitRoutes);
      app.use('/api/dashboard', dashboardRoutes);
      ```
    * Line 42: `app.use(errorHandler);`
- **Error Handling Middleware** (`src/middlewares/errorHandler.middleware.ts:6–36`):
  - Handles `AppError` (`src/errors/AppError.ts`) -> returns `res.status(err.statusCode).json({ error: err.message })`.
  - Handles `z.ZodError` -> returns `res.status(400).json({ error: "Validation failed", details: err.errors })` (Note: `err.errors` causes TS error under Zod 4).
  - Unhandled fallback -> returns `res.status(500).json({ error: "Internal server error" })`.

---

### 1.4 Existing Routes and Controllers
- **Order Routes & Controller** (`src/routes/order.routes.ts` & `src/controllers/order.controller.ts`):
  * `POST /api/orders/quotes`: `orderController.createQuote` -> `CreateQuoteService.execute`
  * `POST /api/orders/:orderId/confirm`: `orderController.confirmOrder` -> `ConfirmOrderService.execute`
  * `POST /api/orders/:id/finish`: `orderController.finishOrder` -> `FinishOrderService.execute`
  * `GET /api/orders`: `orderController.listOrders` -> `ListOrdersService.execute`
  * `PUT /api/orders/:id`: `orderController.update` -> `UpdateOrderService.execute`
  * `DELETE /api/orders/:id`: `orderController.delete` -> `DeleteOrderService.execute`
- **Product Routes & Controller** (`src/routes/product.routes.ts` & `src/controllers/ProductController.ts`):
  * `GET /api/products`: `productController.index` -> `SearchProductsService.execute` (query params: `page`, `limit`, `category`, `search`)
  * `POST /api/products`: `productController.create` -> `CreateProductService.execute`
  * `PUT /api/products/:id`: `productController.update` -> `UpdateProductService.execute`
  * `PATCH /api/products/:id/stock`: `productController.updateStock` -> `UpdateProductStockService.execute`
  * `DELETE /api/products/:id`: `productController.delete` -> `DeleteProductService.execute`
- **Kit Routes & Controller** (`src/routes/kit.routes.ts` & `src/controllers/KitController.ts`):
  * `POST /api/kits`: `kitController.create` -> `CreateKitService.execute`
  * `GET /api/kits`: `kitController.list` -> `ListKitsService.execute`
  * `PATCH /api/kits/:id/favorite`: `kitController.toggleFavorite` -> `ToggleFavoriteKitService.execute`
- **Dashboard Routes & Controller** (`src/routes/dashboard.routes.ts` & `src/controllers/DashboardController.ts`):
  * `GET /api/dashboard/stats`: `dashboardController.getStats` -> `GetDashboardStatsService.execute`
- **Health Route**:
  * `GET /health` (`src/app.ts:31`)

---

### 1.5 Rental/Order Lifecycle & Existing Services
- **15 Services in `src/services/`**:
  * Tested (9 services): `CreateQuoteService`, `ConfirmOrderService`, `FinishOrderService`, `UpdateOrderService`, `DeleteOrderService`, `CreateProductService`, `UpdateProductService`, `UpdateProductStockService`, `DeleteProductService`.
  * Untested (6 services): `ListOrdersService`, `SearchProductsService`, `CreateKitService`, `ListKitsService`, `ToggleFavoriteKitService`, `GetDashboardStatsService`.
- **Existing Rental Flow**:
  1. `CreateQuoteService`: Accepts `{ customer, items: [{ productId, quantity }], pickUpDate, returnDate }`. Adds **+1 day turnaround buffer** (`returnDateWithBuffer = returnDate + 1 day`). Evaluates `countAvailableAssetsForProduct` to prevent overlapping bookings. If available < quantity, throws 409 AppError. Calculates `totalAmount = dailyPrice * days * quantity`. Upserts `Customer`. Creates `Order` in `DRAFT` state with associated `assets`.
  2. `ConfirmOrderService`: Re-evaluates availability for race-condition defense (again with +1 day buffer). Requires `paymentAmount >= 50% * totalAmount`. Updates `Order.state = RESERVED` and `Asset.state = RENTED`.
  3. `FinishOrderService`: Verifies order is in progress/reserved. Updates `Order.state = COMPLETED` and `Asset.state = AVAILABLE`.
  4. Missing steps: Check-out dispatch (`IN_PROGRESS`), Check-in return inspection (`PENDING_INSPECTION`), Damage tracking (`COMPLETED_WITH_DAMAGES`), Kit expansion in quotes, discount/pricing rules.

---

## 2. Logic Chain

From these direct observations, we establish the following deductive logic chain:

1. **Test Suite & Verification Independence**:
   - *Observation*: Vitest executes 38 tests across 10 files in ~427ms with zero database connections, relying exclusively on `vi.fn()` repository mocks.
   - *Inference*: The project's existing tests are fast, decoupled unit tests. Adding new CRM tests does not require configuring a live PostgreSQL database for CI unit test execution. However, new modules must follow the repository pattern with mockable interfaces (`DIP`) so they can be tested identically.

2. **False Sense of Build Safety (`tsup` vs `tsc`)**:
   - *Observation*: `npm run build` succeeds (code 0) because `tsup` strips types via esbuild without typechecking. Meanwhile, `npx tsc --noEmit` fails with 53 errors across 13 files.
   - *Inference*: If new CRM code is introduced without first resolving existing type errors and without running `tsc --noEmit`, latent runtime defects (such as `OrderState.TOTAL_LOSS === undefined`, and `err.errors === undefined`) will propagate silently. Fixing the 53 `tsc` errors is an essential prerequisite for adding strict CRM types.

3. **Connection Pooling Bottleneck**:
   - *Observation*: 4 route files instantiate their own `new Pool({ connectionString })` and `new PrismaClient({ adapter })`.
   - *Inference*: Each route creates an isolated connection pool. Adding a new `client.routes.ts` or `crm.routes.ts` following the existing pattern would create a 5th pool, leading to PostgreSQL client connection exhaustion in production environments. Creating `src/infra/database.ts` as a shared singleton resolves this immediately.

4. **Integration Surface for Client 360**:
   - *Observation*: `Customer` currently has only basic fields (`name`, `email`, `phone`, `document`, `score`) and is referenced by `Order.customerId`. `CustomerRepository.upsertCustomer` is called in `CreateQuoteService`.
   - *Inference*: Evolving `Customer` to support Client 360 without breaking existing quote generation requires either extending `Customer` with CRM fields (`address`, `companyName`, `status`, `notes`, `tags`) and adding relational models (`Contact`, `Interaction`), or defining `Client` with a transparent alias/foreign key relationship. Maintaining `CustomerRepository.upsertCustomer` ensures full backward compatibility with `CreateQuoteService` and its existing tests.

5. **Integration Surface for Advanced Rental Lifecycle**:
   - *Observation*: `Kit` and `KitItem` exist in `schema.prisma` and have CRUD services, but `CreateQuoteService` only accepts individual `productId`s. Furthermore, `OrderState` already defines `IN_PROGRESS`, `PENDING_INSPECTION`, and `COMPLETED_WITH_DAMAGES`, and `MaintenanceLog` already exists for assets, but no services implement check-out, check-in, or damage recording.
   - *Inference*: The schema and domain state models were already designed with the advanced rental lifecycle in mind. Expanding `CreateQuoteService` to support kits and discount rules, and adding use cases for `CheckoutOrderService` (`RESERVED` -> `IN_PROGRESS`), `CheckinOrderService` (`IN_PROGRESS` -> `PENDING_INSPECTION`), and `RecordDamageService` (creates `MaintenanceLog`, sets `AssetState.IN_MAINTENANCE`/`TOTAL_LOSS`, and sets `OrderState.COMPLETED_WITH_DAMAGES`) will complete the state machine naturally without architectural friction.

6. **Controller Architecture Standardization**:
   - *Observation*: Existing controllers (`order.controller.ts` and `ProductController.ts`) manually catch errors, log with `console.error`, and format ad-hoc JSON instead of passing to `next(error)`, and skip Zod validation on `req.params`.
   - *Inference*: New CRM controllers must strictly conform to `GEMINI.md`: validate all inputs (params, query, body) via Zod schemas, delegate errors to `next(error)`, and let `errorHandler.middleware.ts` handle serialization.

---

## 3. Caveats

1. **No Real Database Running in Current Environment**: The exploration did not execute live migrations (`prisma migrate dev` or `prisma db push`) against a live PostgreSQL server, as no PostgreSQL daemon is running locally and the environment is read-only. Database compatibility was verified via Prisma schema static analysis.
2. **Untested Existing Services**: 6 of the 15 existing domain services have 0% test coverage. Any refactoring to interfaces or database singletons must preserve their existing method signatures to avoid unintended regressions.
3. **Non-ASCII Enum `LOUÇAS`**: In `prisma/schema.prisma:31`, `ProductCategory` defines `LOUÇAS`. While supported by Prisma PostgreSQL, any schema migration altering enums should be handled carefully to avoid breaking database constraints or existing serialized data.

---

## 4. Conclusion

The `backend-boilerplate` codebase has a clean Layered Architecture (Routes -> Controllers -> Services -> Repositories -> Prisma) and a functional in-memory Vitest testing harness. However, there are significant deviations that must be addressed to ensure a stable CRM evolution:

1. **Build & Test**:
   - Build: `npm run build` (`tsup`) succeeds, but `npx tsc --noEmit` fails with 53 compilation errors.
   - Test: `npx vitest run` executes 10 test files (38 tests) cleanly in ~427ms using pure `vi.fn()` repository mocks.
2. **Database & Persistence**:
   - 8 models and 3 enums exist in `prisma/schema.prisma`.
   - Connection handling is fragmented into 4 separate pools across route files. A shared singleton in `src/infra/database.ts` is required.
3. **Express Pipeline**:
   - Express 5.2.1 is configured with Helmet, CORS, json parser, Winston logger, and rate limiter. Rate limiter currently precedes `/health`, which should be reordered.
4. **Client 360 Architecture**:
   - Seamlessly integrates by extending `Customer` (or linking `Client`) with `Contact` (1:N) and `Interaction` (1:N), providing dedicated endpoints under `/api/clients`, and aggregating client profile, contacts, timeline, and order metrics in `GET /api/clients/:id/360`.
5. **Advanced Rental Lifecycle Architecture**:
   - Seamlessly integrates by completing the existing `OrderState` machine: kit expansion and discount rules in quoting, dispatch check-out (`IN_PROGRESS`), return check-in (`PENDING_INSPECTION`), and damage recording linked to `MaintenanceLog` (`COMPLETED_WITH_DAMAGES`).
6. **Key Friction Points**:
   - 53 `tsc --noEmit` errors (Zod 4 `.issues`, `OrderState.TOTAL_LOSS`, Express 5 `req.params`, Prisma 7 Decimal import, Vitest mock typings).
   - Incomplete Dependency Inversion in 10 services.
   - Zero Zod validation on route parameters (`:id`).

---

## 5. Verification Method

To independently verify all observations and findings documented in this survey:

1. **Verify Test Harness Execution**:
   ```bash
   npx vitest run
   ```
   *Expected output*: 10 test files passed, 38 tests passed.

2. **Verify Build Execution**:
   ```bash
   npm run build
   ```
   *Expected output*: `tsup src --out-dir=dist --clean` completes with code 0 in ~120ms.

3. **Verify TypeScript Compilation Failure (53 errors)**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected output*: Exits with code 2, reporting `Found 53 errors in 13 files`.

4. **Verify Database Pool Multiplication**:
   Inspect line citations:
   - `src/routes/order.routes.ts:17–20`
   - `src/routes/product.routes.ts:13–16`
   - `src/routes/kit.routes.ts:11–14`
   - `src/routes/dashboard.routes.ts:8–11`

5. **Verify Mock Strategy in Tests**:
   Inspect `src/tests/services/CreateQuoteService.spec.ts:13–39` and `src/tests/services/ConfirmOrderService.spec.ts:11–22` to confirm tests run in-memory without database access.
