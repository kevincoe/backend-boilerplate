# Handoff Report — Codebase Architectural Survey

**Agent:** `explorer_survey_1` (Codebase Architecture Explorer)  
**Parent Agent:** `orchestrator_1` (`c6d9d5e4-bafa-48bf-bbdb-fbda2bb6913b`)  
**Date:** 2026-09-09  
**Status:** Task Complete (Hard Handoff)  
**Primary Deliverable:** `/home/workspace/backend-boilerplate/.agents/explorer_survey_1/report.md`

---

## 1. Observation

Direct observations from codebase inspection, file views, and command execution:

1. **File Inventory & Tree**:
   - The repository contains 77 files outside of `node_modules`, `.git`, and `.agents`.
   - Core layers under `src/`: 4 route files (`routes/`), 4 controllers (`controllers/`), 15 services (`services/`), 5 repositories (`repositories/`), 2 domain enum files (`domain/`), 1 schema file (`schemas/order.schema.ts`), 2 middlewares (`middlewares/`), 1 error class (`errors/AppError.ts`), and 10 test files (`tests/`).

2. **Configuration & Dependencies**:
   - `package.json` specifies `"type": "module"`, `express: "^5.2.1"`, `@prisma/client: "^7.8.0"`, `@prisma/adapter-pg: "^7.8.0"`, `pg: "^8.21.0"`, `winston: "^3.19.0"`, and `zod: "^4.4.2"`.
   - `tsconfig.json` specifies `"target": "ES2022"`, `"module": "ESNext"`, `"moduleResolution": "Bundler"`, and `"strict": true`.
   - `package.json` scripts: `"dev": "tsx watch src/server.ts"`, `"build": "tsup src --out-dir=dist --clean"`, `"test": "vitest"`, `"lint": "eslint src --ext .ts --fix"`. There is no `typecheck` script.

3. **Multiple Database Pools & Client Duplication**:
   - `src/routes/order.routes.ts:17-20`:
     ```typescript
     const connectionString = `${process.env.DATABASE_URL}`;
     const pool = new Pool({ connectionString });
     const adapter = new PrismaPg(pool);
     const prisma = new PrismaClient({ adapter });
     ```
   - Identical 4-line blocks are present in `src/routes/product.routes.ts:13-16`, `src/routes/kit.routes.ts:11-14`, and `src/routes/dashboard.routes.ts:8-11`. Four separate pools and PrismaClient instances are created.

4. **Layer Violations**:
   - `src/services/GetDashboardStatsService.ts:1, 5, 9, 21, 38, 50, 60`: Directly imports and injects `PrismaClient` and queries `this.prisma.asset.count`, `this.prisma.order.groupBy`, `this.prisma.order.count`, `this.prisma.order.aggregate`, and `this.prisma.order.findMany`, bypassing any repository/DAO.
   - `src/services/DeleteProductService.ts:25-33`: Directly catches `Prisma.PrismaClientKnownRequestError` with code `P2003` inside domain service.
   - `src/services/UpdateProductStockService.ts:30, 59` and `src/services/DeleteProductService.ts:9`: Execute `this.productRepository.update(id, {})` as an empty-mutation hack to retrieve assets because `ProductRepository.findById` does not support eager-loading assets.

5. **Validation Inconsistencies**:
   - Route parameters `req.params.id` and `req.params.orderId` are passed directly to services without Zod validation in:
     - `src/controllers/ProductController.ts:67, 93, 118`
     - `src/controllers/KitController.ts:53`
     - `src/controllers/order.controller.ts:42, 61, 83, 107`
   - Zod schemas are defined inline in controllers instead of in `src/schemas/` (`ProductController.ts:20, 41, 68, 94`, `KitController.ts:16, 49`, `order.controller.ts:84`).

6. **Error Handling Bypass**:
   - `src/controllers/ProductController.ts:27-37, 54-64, 80-90, 105-115, 123-129` and `src/controllers/order.controller.ts:94-104, 112-118`: Catch blocks handle errors internally using `const err = error as { statusCode?: number; message?: string }` and `console.error`, bypassing the global `errorHandler` middleware.
   - `src/middlewares/logging.middleware.ts:61-76`: Defines `errorLogger`, but it is never registered in `src/app.ts`.

7. **53 Silent TypeScript Compiler Errors**:
   - Executing `npx tsc --noEmit` fails with exit code 2 and outputs 53 errors across 13 files:
     - `src/services/DeleteOrderService.ts:19:18`, `src/services/FinishOrderService.ts:34:34`, `src/services/UpdateOrderService.ts:30:34`: `error TS2339: Property 'TOTAL_LOSS' does not exist on type 'typeof OrderState'` (`TOTAL_LOSS` is in `AssetState`).
     - `src/middlewares/errorHandler.middleware.ts:31:56`, `src/controllers/ProductController.ts:33, 56, 82, 107`, `src/controllers/order.controller.ts:96`: `error TS2339: Property 'errors' does not exist on type 'ZodError<unknown>'` (in Zod 4, property is `issues`).
     - `src/repositories/AssetRepository.ts:22:37`, `src/services/CreateQuoteService.ts:45:37`: `error TS2307: Cannot find module '@prisma/client/runtime/library'`.
     - `src/routes/order.routes.ts:33, 34`: Incompatible return types between `OrderRepository` and `IOrderRepository`.
     - `src/routes/order.routes.ts:63, 66`: Passing 3 arguments to 2-argument controller handlers.
     - `src/controllers/KitController.ts:56`, `ProductController.ts:78, 101, 121`, `order.controller.ts:46, 62, 92, 110`: Type `string | string[]` from Express 5 `req.params` not assignable to `string`.

8. **CI/CD & Test Status**:
   - `npm run test` (`vitest run`): Passes all 10 test suites and 38 tests because Vitest executes via esbuild transforms without type-checking.
   - `npm run build` (`tsup`): Passes because tsup builds with esbuild without type-checking.
   - `.github/workflows/ci.yml`: Runs `npm run lint`, `npm run build`, and `npm run test`. Because `tsc --noEmit` is absent from CI, all 53 TypeScript errors are undetected in CI.

---

## 2. Logic Chain

1. **Premise 1 (Layer Isolation)**: `GEMINI.md` mandates strict separation of concerns where Routes only map endpoints, Controllers handle HTTP req/res, Services hold business logic, and Repositories are the sole layer interacting with the database.
2. **Deduction from Observation 3**: Because each route file instantiates `Pool`, `PrismaPg`, and `PrismaClient` (Observation 3), routes are acting as manual composition roots and creating 4 independent database connection pools, which violates single responsibility and wastes database connection slots.
3. **Deduction from Observation 4**: Because `GetDashboardStatsService` executes Prisma queries directly (Observation 4), the rule stating "Repositories/DAOs: Única camada responsável por interagir com o banco de dados" is directly broken.
4. **Deduction from Observation 4 & 5**: Because `ProductRepository.findById` does not load assets, services perform dummy updates (`update(id, {})`) to load them, generating unnecessary mutation SQL queries.
5. **Deduction from Observation 7 & 8**: Because `tsup` and `vitest` do not run type-checking and CI does not run `tsc --noEmit`, invalid enum references (`OrderState.TOTAL_LOSS`), Zod 4 property incompatibilities (`err.errors`), Express 5 param type mismatches, and repository interface mismatches exist silently in production code despite green CI builds.

---

## 3. Caveats

- **External Database**: Database connectivity was verified by reviewing `.env` and `docker-compose.yml`. We did not issue network calls to the external Supabase instance to avoid altering external state.
- **Frontend Scope**: An implementation plan (`implementation_plan.md`) exists for a React frontend, but no frontend code exists in the repository yet.
- **Prisma Migrations**: Only the initial migration `20260702222334_init_postgres` exists in `prisma/migrations`. The `Kit` and `KitItem` models in `schema.prisma` were likely pushed via `prisma db push` without generating a migration SQL file.

---

## 4. Conclusion

The backend architecture possesses solid domain foundations (state machines for orders and assets, clean separation into layers, Winston logging, and comprehensive unit tests), but suffers from:
1. **Architectural fragmentation**: 4 redundant connection pools across route modules, direct database access in the dashboard service, and dummy `update` queries for data fetching.
2. **Guideline violations (`GEMINI.md`)**: Lack of param validation with Zod, controllers catching errors and bypassing the global error handler, and inline schemas.
3. **Hidden compilation failures**: 53 TypeScript errors masked by CI's lack of `tsc --noEmit`.

All findings, complete endpoint flows, Mermaid diagrams, and prioritized remediation plans have been compiled into `/home/workspace/backend-boilerplate/.agents/explorer_survey_1/report.md`.

---

## 5. Verification Method

To independently reproduce and verify every finding in this report:

1. **Verify TypeScript Compiler Errors**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected result*: Exit code 2 with 53 errors across 13 files, including `OrderState.TOTAL_LOSS` and Zod `err.errors`.

2. **Verify Passing Vitest Tests (Bypassing Typecheck)**:
   ```bash
   npx vitest run
   ```
   *Expected result*: 10 test files pass (38 tests).

3. **Verify Build Succeeds Despite Type Errors**:
   ```bash
   npm run build
   ```
   *Expected result*: `tsup` succeeds in ~100ms.

4. **Verify Database Pool Duplication**:
   Inspect line 17 in `src/routes/order.routes.ts`, line 13 in `src/routes/product.routes.ts`, line 11 in `src/routes/kit.routes.ts`, and line 8 in `src/routes/dashboard.routes.ts`.

5. **Verify Direct Prisma Query in Service**:
   Inspect `src/services/GetDashboardStatsService.ts` lines 1, 5, 9, 21, 38, 50, 60.

6. **Verify Invalid Enum Usage**:
   Inspect `src/services/DeleteOrderService.ts:19`, `src/services/FinishOrderService.ts:34`, `src/services/UpdateOrderService.ts:30` against `src/domain/OrderState.ts`.
