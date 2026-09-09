# Project: CRM Platform Evolution

## Architecture
- **System Overview**: Node.js, Express 5, TypeScript, Prisma 7, PostgreSQL backend for CRM (Customer Relationship Management) and Audiovisual Equipment Rental Management.
- **Layers**:
  - Presentation Layer: `src/routes/` and `src/controllers/`
  - Domain / Business Logic Layer: `src/services/` and `src/domain/`
  - Persistence Layer: `src/repositories/` and `prisma/schema.prisma`
  - Infrastructure / Cross-Cutting: `src/infra/database.ts` (shared singleton pool), `src/middlewares/` (Winston logger with sanitized headers, global error handler, CORS whitelist, unthrottled healthcheck), `src/schemas/` (centralized Zod validation for body, params, query), `src/errors/` (custom AppError).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---|---|---|---|
| 1 | Database Singleton | Consolidate 4 separate connection pools into shared `src/infra/database.ts` | M1 | AUDIT.md §3, GEMINI.md |
| 2 | TypeScript Strict Compilation | Resolve all 53 `tsc --noEmit` errors across routes, controllers, services, tests | M1 | AUDIT.md §1, GEMINI.md |
| 3 | Zod Route Parameter Validation | Implement `idParamSchema`, `orderIdParamSchema` in `src/schemas/params.schema.ts` | M1 | AUDIT.md §4, GEMINI.md |
| 4 | Controller Error Delegation | Eliminate local try/catch ad-hoc envelopes; forward all errors to `next(error)` | M1 | AUDIT.md §5, GEMINI.md |
| 5 | Replace Dummy Update Reads | Implement `findByIdWithAssets` in `ProductRepository` replacing `update(id, {})` | M1 | AUDIT.md §6, GEMINI.md |
| 6 | Logger Header Sanitization | Strip `authorization`, `cookie`, `x-api-key` headers in `logging.middleware.ts` | M1 | AUDIT.md §7, GEMINI.md |
| 7 | CORS & Rate Limiter Fix | Explicit CORS origin whitelist; mount `/health` before rate limiter | M1 | AUDIT.md §8-9, GEMINI.md |
| 8 | Transactional Operations | Wrap multi-table operations (`delete`, `confirmOrder`) in `prisma.$transaction` | M1 | AUDIT.md §10, GEMINI.md |
| 9 | Database Indexes | Add composite B-tree indexes to `Order`, `Asset`, `KitItem` in `schema.prisma` | M1 | AUDIT.md §11, GEMINI.md |
| 10 | Paginated Collections | Add `page` and `limit` to `OrderRepository.findAll` and `KitRepository.findAll` | M1 | AUDIT.md §12, GEMINI.md |
| 11 | Service Dependency Inversion | Refactor service constructors to inject repository interfaces | M1 | AUDIT.md §13, GEMINI.md |
| 12 | English Standardization | Rename non-ASCII enum `LOUÇAS` to `TABLEWARE`; English error messages | M1 | AUDIT.md §14-15, GEMINI.md |
| 13 | Zod 4 `err.issues` Fix | Migrate deprecated `err.errors` to `err.issues` | M1 | AUDIT.md §16, GEMINI.md |
| 14 | Dashboard Repository | Extract `IDashboardRepository` & `DashboardRepository` | M1 | AUDIT.md §2, GEMINI.md |
| 15 | Unit Test Alignment | Align test assertions with English errors & mock interfaces; 100% pass | M1 | AUDIT.md §17, GEMINI.md |
| 16 | Client Entity & CRUD | Database model `Client` and REST endpoints (`POST/GET/PUT/DELETE /api/clients`) | M2 | ORIGINAL_REQUEST.md §R2 |
| 17 | Contact Management | Database model `Contact` and REST endpoints (`/api/clients/:id/contacts`) | M2 | ORIGINAL_REQUEST.md §R2 |
| 18 | Activity History Log | Database model `Activity` and REST endpoints (`/api/clients/:id/activities`) | M2 | ORIGINAL_REQUEST.md §R2 |
| 19 | Client 360 Aggregated View | Aggregated endpoint `GET /api/clients/:id/360` with profile, contacts, log, metrics | M2 | ORIGINAL_REQUEST.md §R2 |
| 20 | Composite Kit Allocation | Expand kits into constituent items with +1 day buffer availability verification | M3 | ORIGINAL_REQUEST.md §R3 |
| 21 | Pricing & Discount Rules | Duration discounts (>3d 10%, >7d 20%), client score loyalty tiers, overrides | M3 | ORIGINAL_REQUEST.md §R3 |
| 22 | Rental Check-out Milestone | Dispatch endpoint `POST /api/orders/:id/checkout` transitioning to `IN_PROGRESS` | M3 | ORIGINAL_REQUEST.md §R3 |
| 23 | Rental Check-in Milestone | Return endpoint `POST /api/orders/:id/checkin` transitioning to `PENDING_INSPECTION` | M3 | ORIGINAL_REQUEST.md §R3 |
| 24 | Damage Tracking & Cascades | `DamageRecord` model, `POST /api/orders/:id/damages`, maintenance & score cascade | M3 | ORIGINAL_REQUEST.md §R3 |
| 25 | Database Schemas Documentation | Comprehensive Markdown document of all CRM and rental schemas and indexes | M4 | ORIGINAL_REQUEST.md §R4 |
| 26 | API Route Catalog Documentation | Comprehensive Markdown catalog of all new REST endpoints, schemas, responses | M4 | ORIGINAL_REQUEST.md §R4 |
| 27 | E2E & Automated Test Suite | Unit and integration tests for Client 360, rental lifecycle, build & test pass | M5 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | M1: Architectural Standardization | Resolve all 18 AUDIT.md findings, 53 tsc errors, DB singleton, Zod params, DIP, English errors, tests pass | none | IN_PROGRESS |
| 2 | M2: Client 360 Core API | Prisma schema (Client, Contact, Activity), Repositories, Services, Controllers, Routes, Tests | M1 | PLANNED |
| 3 | M3: Advanced Rental Process API | Prisma schema (DamageRecord, RentalCheckLog), Kit expansion, Pricing/Discounts, Checkout/Checkin, Damages, Tests | M1, M2 | PLANNED |
| 4 | M4: System Documentation | Comprehensive Markdown documentation for database schemas, new API routes, and architecture | M2, M3 | PLANNED |
| 5 | M5: Comprehensive Verification & Gate | Automated tests for Client 360 & Rental, npm run build (code 0), npm test (pass), Reviewer + Challenger + Forensic Audit | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
### Database Singleton (`src/infra/database.ts`)
- Exports `pool` (pg.Pool) and `prisma` (PrismaClient with PrismaPg adapter).
- All repositories and services share this single instance.

### Parameter Validation (`src/schemas/params.schema.ts`)
- `idParamSchema = z.object({ id: z.string().uuid() })`
- `orderIdParamSchema = z.object({ orderId: z.string().uuid() })`

### Client 360 (`/api/clients`)
- `GET /api/clients/:id/360`: Returns `{ client, contacts, recentActivities, rentalMetrics, activeBookings }`.

### Rental Lifecycle (`/api/orders`)
- `POST /api/orders/quotes`: Calculates price with duration/score discounts and verifies component kit stock with +1 day buffer.
- `POST /api/orders/:orderId/confirm`: Validates >= 50% deposit and atomically reserves assets.
- `POST /api/orders/:id/checkout`: Validates `RESERVED` state, records check-out, updates order to `IN_PROGRESS` and assets to `RENTED`.
- `POST /api/orders/:id/checkin`: Validates `IN_PROGRESS` state, records check-in, updates order to `PENDING_INSPECTION` and assets to `IN_INSPECTION`.
- `POST /api/orders/:id/damages`: Records `DamageRecord`, updates asset to `IN_MAINTENANCE` or `TOTAL_LOSS`, marks order `COMPLETED_WITH_DAMAGES`, penalizes client reliability score.

## Code Layout
- Infrastructure: `src/infra/` (`database.ts`, `container.ts`)
- Presentation: `src/routes/`, `src/controllers/`
- Domain & Services: `src/services/`, `src/domain/`
- Repositories: `src/repositories/`, `src/repositories/contracts/`
- Validation: `src/schemas/`
- Errors: `src/errors/`
- Middlewares: `src/middlewares/`
- Tests: `src/tests/`
- Documentation: `DATABASE_SCHEMAS.md`, `API_CATALOG.md`, `ARCHITECTURE.md`
