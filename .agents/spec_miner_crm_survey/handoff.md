# CRM Platform Evolution: Comprehensive Specification Mining & Survey Report

**Author:** Specification Miner (`teamwork_preview_spec_miner`)  
**Working Directory:** `/home/workspace/backend-boilerplate/.agents/spec_miner_crm_survey/`  
**Date:** 2026-09-09  
**Reference Sources:**
- `/home/workspace/backend-boilerplate/ORIGINAL_REQUEST.md`
- `/home/workspace/backend-boilerplate/GEMINI.md`
- `/home/workspace/backend-boilerplate/AUDIT.md`
- `/home/workspace/backend-boilerplate/ARCHITECTURE.md`
- `/home/workspace/backend-boilerplate/prisma/schema.prisma`
- Existing codebase (`src/app.ts`, `src/routes/`, `src/controllers/`, `src/services/`, `src/repositories/`, `src/schemas/`, `src/tests/`)

---

## 1. Observation

### 1.1 Existing Codebase State & Execution Baseline
1. **Test Suite Execution (`npm test -- --run`):**
   - Command executed: `npm test -- --run`
   - Result: 10 test files passed, 38 tests passed, exit code `0`.
   - All existing tests pass because Vitest executes without strict `tsc` checking, and mocks in `src/tests/services/*.spec.ts` use dynamic resolution.
2. **Build Execution (`npm run build`):**
   - Command executed: `npm run build` (`tsup src --out-dir=dist --clean`)
   - Result: Exit code `0`. `tsup` bundles 46 CJS files in ~116ms using esbuild, which strips type definitions without emitting compile-time type errors.
3. **TypeScript Strict Typecheck Execution (`npx tsc --noEmit`):**
   - Command executed: `npx tsc --noEmit`
   - Result: Exit code `2`, reporting **53 errors across 13 files**.
   - Breakdown of errors:
     - `src/services/DeleteOrderService.ts:19`, `FinishOrderService.ts:34`, `UpdateOrderService.ts:30`: References non-existent enum `OrderState.TOTAL_LOSS` (which belongs to `AssetState`).
     - `src/middlewares/errorHandler.middleware.ts:31`: Accesses `err.errors` on `z.ZodError`, removed in Zod v4 in favor of `err.issues`.
     - `src/controllers/ProductController.ts` (lines 33, 56, 67, 82, 93, 107, 118): Accesses `err.errors` on `z.ZodError`, and passes unvalidated Express 5 `req.params.id` (`string | string[] | undefined`) to services expecting `string`.
     - `src/controllers/order.controller.ts` (lines 46, 83, 96, 107): Passes unvalidated Express 5 `req.params` to services, and accesses `err.errors`.
     - `src/controllers/KitController.ts:56`: Express 5 `req.params.id` type mismatch with string argument.
     - `src/repositories/AssetRepository.ts:22`: Type annotation references `import("@prisma/client/runtime/library").Decimal`, which fails to resolve in Prisma 7.
     - `src/services/CreateQuoteService.ts:45`: References unresolvable Prisma runtime `Decimal`.
     - `src/routes/order.routes.ts` (lines 33, 34, 63, 66): Type conflicts from mismatch between `OrderRepository` return types (`Prisma.Decimal`) and `IOrderRepository` interface declarations (`number | string`).
     - `src/tests/services/*.spec.ts`: 30+ compilation errors where mocked repository objects cast to `Mock<Procedure>` fail method lookup.
4. **Prisma Schema Validation (`npx prisma validate`):**
   - Command executed: `npx prisma validate`
   - Result: Exit code `0`. Schema is currently valid, defining models `Customer`, `ProductBase`, `Asset`, `Order`, `OrderAsset`, `MaintenanceLog`, `Kit`, `KitItem` and enums `OrderState`, `AssetState`, `ProductCategory`.
5. **Database Connection Architecture:**
   - In `src/routes/order.routes.ts` (lines 17–20), `product.routes.ts` (lines 13–16), `kit.routes.ts` (lines 11–14), and `dashboard.routes.ts` (lines 8–11), each router independently executes:
     ```typescript
     const connectionString = `${process.env.DATABASE_URL}`;
     const pool = new Pool({ connectionString });
     const adapter = new PrismaPg(pool);
     const prisma = new PrismaClient({ adapter });
     ```
   - This instantiates **4 separate connection pools** and **4 separate PrismaClient instances** upon application boot.
6. **Input Validation State:**
   - Zero Zod validation exists on route parameters (`:id`, `:orderId`) across all endpoints.
   - Controllers manually extract `const { id } = req.params;` directly into service invocations.
7. **Controller Error Handling State:**
   - `ProductController.ts` and `OrderController.ts` contain local `try/catch` blocks that intercept errors, format ad-hoc JSON structures (`res.status(statusCode).json({ message: ... })`), and bypass `src/middlewares/errorHandler.middleware.ts`.
8. **Logging Middleware State:**
   - `src/middlewares/logging.middleware.ts:44` outputs `headers: req.headers` in cleartext, leaking authorization tokens, bearer credentials, and cookie session headers.
9. **CORS & Rate Limiter State:**
   - `src/app.ts:25` registers `app.use(cors())` with wildcard origin (`*`).
   - `src/app.ts:28` mounts `app.use(limiter)` *before* `GET /health` on line 31, subjecting health probes to IP throttling.
10. **Repository Isolation State:**
    - `src/services/GetDashboardStatsService.ts` injects `PrismaClient` directly, bypassing the repository layer and running raw queries.
    - `UpdateProductStockService.ts:30` and `DeleteProductService.ts:9` execute `this.productRepository.update(id, {})` as a workaround to read assets.
11. **Concurrency and Business Rules State:**
    - `CreateQuoteService.ts` enforces +1 day turnaround buffer for maintenance.
    - `ConfirmOrderService.ts` re-evaluates asset availability with +1 buffer, enforcing a 50% minimum deposit. However, the order state update and asset state updates are executed sequentially without `prisma.$transaction`.

---

## 2. Logic Chain

1. **Premise 1 (R1 Mandate):** `ORIGINAL_REQUEST.md` requires refactoring the codebase to resolve all architectural deviations identified in `AUDIT.md` and strictly adhere to `GEMINI.md`.
   - *Inference 1.1:* All 53 TypeScript compilation errors must be eliminated, and `"typecheck": "tsc --noEmit"` must pass with 0 errors.
   - *Inference 1.2:* A centralized database provider (`src/infra/database.ts` or `src/infra/prisma.ts`) must be established to unify the 4 connection pools into a single singleton pool.
   - *Inference 1.3:* A reusable parameter schema (`src/schemas/params.schema.ts`) must be created to enforce UUID validation across all route parameters before reaching services.
   - *Inference 1.4:* `GetDashboardStatsService` must be decoupled from `PrismaClient` by introducing `IDashboardRepository` and `DashboardRepository`.
   - *Inference 1.5:* Local try/catch blocks in controllers must be replaced with uniform delegation to `next(error)` so that `errorHandler.middleware.ts` handles all errors consistently.
   - *Inference 1.6:* Sensitive request headers must be stripped in `logging.middleware.ts`.
   - *Inference 1.7:* Multi-table state mutations in `ConfirmOrderService` must be enclosed in `prisma.$transaction`.
   - *Inference 1.8:* Portuguese terms (e.g. `LOUÇAS` enum, Portuguese error messages) must be standardized into English.
   - *Inference 1.9:* Database indexes must be added on high-frequency query columns (`Order.customerId`, `Order.state`, `Order.[pickUpDate, returnDate]`, `Asset.[productBaseId, state]`).
   - *Inference 1.10:* Unpaginated listings in `OrderRepository.findAll` and `KitRepository.findAll` must support pagination (`page`, `limit`).

2. **Premise 2 (R2 Mandate):** `ORIGINAL_REQUEST.md` requires implementing the database schema and REST APIs for a Core Client 360 view, covering Clients, Contacts, and an Interaction/Activity History log.
   - *Inference 2.1:* In a B2B/B2C audiovisual rental CRM, a "Client" represents the contractual party (individual or company). A Client possesses multiple "Contacts" (e.g. Event Coordinator, Sound Engineer, Finance Manager) and a rich log of "Activities / Interactions" (calls, emails, meetings, WhatsApp notes, dispatch notes).
   - *Inference 2.2:* The existing `Customer` entity in `prisma/schema.prisma` represents a rudimentary customer record. To evolve into Client 360 while preserving backward compatibility for existing orders, the schema must either enhance `Customer` or define a `Client` aggregate that seamlessly links contacts, interaction logs, order history, credit/reliability metrics, and active bookings.
   - *Inference 2.3:* A dedicated `GET /api/clients/:id/360` endpoint must aggregate:
     1. Client Profile and Status (`ACTIVE`, `INACTIVE`, `PROSPECT`, `BLOCKED`)
     2. Associated Contacts list (identifying the primary contact)
     3. Recent Activity History (chronological touchpoint feed)
     4. Rental Overview: lifetime spend, active orders count, pending quotes count, returned with damage history
     5. Risk & Reliability Metrics: score (0–100 or 1–10), payment punctuality, damage incident count.

3. **Premise 3 (R3 Mandate):** `ORIGINAL_REQUEST.md` requires implementing the database schema and REST APIs for an advanced rental lifecycle supporting items, composite kits, inventory management, quotes, pricing/discount rules, check-in/check-out booking, and damage tracking.
   - *Inference 3.1 (Items & Composite Kits):* Items have base definitions (`ProductBase`) and serialized assets (`Asset`). Composite Kits (`Kit`, `KitItem`) bundle multiple items. In quote/booking operations, kit selection must atomically verify availability and reserve the required quantities of all component items.
   - *Inference 3.2 (Inventory & Buffer):* Serialized asset tracking must enforce discrete states (`AVAILABLE`, `RESERVED`, `RENTED`, `IN_INSPECTION`, `IN_MAINTENANCE`, `TOTAL_LOSS`), alongside the mandatory +1 day turnaround buffer for maintenance and cleaning.
   - *Inference 3.3 (Pricing & Discount Rules):* Pricing must support daily rates, rental duration calculations, multi-day duration discounts (e.g., tier-based: >3 days = 10%, >7 days = 20%, >14 days = 30%), client-tier discounts, and manual discount overrides, while enforcing minimum 50% deposit rules.
   - *Inference 3.4 (Check-in / Check-out Booking Lifecycle):* The order lifecycle must transition through formal physical milestones:
     - `DRAFT` -> `AWAITING_DEPOSIT` -> `RESERVED` -> Check-out -> `IN_PROGRESS` (assets `RENTED`) -> Check-in -> `PENDING_INSPECTION` (assets `IN_INSPECTION`) -> Inspection Passed -> `COMPLETED` (assets `AVAILABLE`).
     - Explicit endpoints for Check-out (`POST /api/orders/:id/checkout`) and Check-in (`POST /api/orders/:id/checkin`) are necessary to capture handover timestamps, staff identifiers, and condition notes.
   - *Inference 3.5 (Damage Tracking):* If damages or losses are identified during return inspection, a `DamageRecord` / `DamageReport` entity must be created linking the order, asset, severity (`MINOR`, `MODERATE`, `SEVERE`, `TOTAL_LOSS`), repair cost, and client liability. When severe or total loss occurs, the asset transitions to `IN_MAINTENANCE` or `TOTAL_LOSS`, the order finishes as `COMPLETED_WITH_DAMAGES`, and the client's reliability score is penalized.

4. **Premise 4 (R4 & Acceptance Criteria):**
   - *Inference 4.1:* `npm run build` and `npm test` must run with exit code 0.
   - *Inference 4.2:* Comprehensive automated unit and integration tests must be specified for all Client 360 endpoints and advanced rental lifecycle operations.
   - *Inference 4.3:* Markdown documentation must be generated containing updated database schemas and an API catalog.

---

## 3. Detailed Specification Breakdown

### 3.1 R1: Architectural Standardization Specification

To bring the codebase into full compliance with `GEMINI.md` and resolve the 18 findings in `AUDIT.md`:

#### 1. TypeScript Strict Verification (`tsc --noEmit`)
- **Fix enum mismatch:** Remove `OrderState.TOTAL_LOSS` in `FinishOrderService.ts`, `UpdateOrderService.ts`, and `DeleteOrderService.ts`. In `OrderState`, allowable states are `DRAFT`, `AWAITING_DEPOSIT`, `RESERVED`, `IN_PROGRESS`, `PENDING_INSPECTION`, `COMPLETED`, `COMPLETED_WITH_DAMAGES`. `TOTAL_LOSS` is strictly an `AssetState`.
- **Fix Zod 4 migration:** Replace all occurrences of `err.errors` with `err.issues` in `errorHandler.middleware.ts` and controllers.
- **Fix Prisma Decimal import:** Replace `import("@prisma/client/runtime/library").Decimal` with `Prisma.Decimal` or standard `number | Decimal` from `@prisma/client`.
- **Fix Repository Interface Alignment:** Reconcile `IOrderRepository` and `OrderRepository` return types (`Prisma.Decimal` vs `number`).
- **Fix Test Mocking:** Type Vitest mocks accurately using `vi.mocked(repo)` or interface casts without invalid `Mock<Procedure>` property access.
- **Add CI check:** Add `"typecheck": "tsc --noEmit"` to `package.json`.

#### 2. Database Connection Pooling Singleton
- Create `src/infra/database.ts` (exporting a single `prisma` instance and `pool`).
- Refactor `order.routes.ts`, `product.routes.ts`, `kit.routes.ts`, and `dashboard.routes.ts` to import the shared `prisma` singleton instead of creating `new Pool()` and `new PrismaClient()`.

#### 3. Zod Input & Parameter Validation
- Create `src/schemas/params.schema.ts` defining:
  ```typescript
  export const idParamSchema = z.object({
    id: z.string().uuid("Parameter :id must be a valid UUID"),
  });
  export const orderIdParamSchema = z.object({
    orderId: z.string().uuid("Parameter :orderId must be a valid UUID"),
  });
  ```
- Enforce parameter parsing on all routes accepting `:id` or `:orderId`.
- Move inline controller schemas into `src/schemas/`.

#### 4. Separation of Concerns & Repository Layer Decoupling
- Create `IDashboardRepository` and `src/repositories/DashboardRepository.ts` to encapsulate all 5 analytics queries.
- In `ProductRepository`, implement `findByIdWithAssets(id: string)` to eliminate dummy `update(id, {})` mutative reads in `UpdateProductStockService` and `DeleteProductService`.
- Extract repository interfaces (`IProductRepository`, `IKitRepository`, `IOrderRepository`) and inject interfaces across all services to uphold Dependency Inversion (DIP).

#### 5. Error Handling & Security Standardizations
- Remove local try/catch JSON formatting in `ProductController` and `OrderController`. All errors must be forwarded to `next(error)`.
- In `src/middlewares/logging.middleware.ts`, sanitize `req.headers` by omitting `authorization`, `cookie`, and `x-api-key`.
- In `src/app.ts`, configure CORS with an explicit origin whitelist via `process.env.CORS_ORIGIN`.
- In `src/app.ts`, mount `GET /health` *before* `app.use(limiter)`.
- Wrap multi-table state updates in `ConfirmOrderService` within `prisma.$transaction`.
- Standardize all error strings and replace non-ASCII enum `LOUÇAS` with `TABLEWARE` (or similar English identifier).
- Add composite database indexes in `prisma/schema.prisma`:
  - `Order`: `@@index([customerId])`, `@@index([state])`, `@@index([pickUpDate, returnDate])`
  - `Asset`: `@@index([productBaseId, state])`
  - `KitItem`: `@@index([kitId])`, `@@index([productBaseId])`
- Add pagination (`page`, `limit`) to `OrderRepository.findAll` and `KitRepository.findAll`.

---

### 3.2 R2: Client 360 API (Core) Specification

#### Schema & Data Model
```prisma
enum ClientStatus {
  LEAD
  PROSPECT
  ACTIVE
  INACTIVE
  BLOCKED
}

enum ContactRole {
  PRIMARY
  BILLING
  TECHNICAL
  EVENT_PRODUCER
  OPERATIONS
  OTHER
}

enum ActivityType {
  CALL
  EMAIL
  MEETING
  NOTE
  TASK
  WHATSAPP
  SITE_VISIT
  DAMAGE_DISPUTE
}

enum ActivityStatus {
  PENDING
  COMPLETED
  CANCELLED
}

model Client {
  id               String         @id @default(uuid())
  name             String
  companyName      String?
  document         String         @unique // CPF or CNPJ
  email            String         @unique
  phone            String
  secondaryPhone   String?
  address          String?
  city             String?
  state            String?
  postalCode       String?
  status           ClientStatus   @default(ACTIVE)
  reliabilityScore Int            @default(100) // Score 0 to 100
  creditLimit      Decimal?       @db.Decimal(10, 2)
  notes            String?
  contacts         Contact[]
  activities       Activity[]
  orders           Order[]
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  @@index([email])
  @@index([document])
  @@index([status])
}

model Contact {
  id           String      @id @default(uuid())
  clientId     String
  client       Client      @relation(fields: [clientId], references: [id], onDelete: Cascade)
  name         String
  email        String
  phone        String
  role         ContactRole @default(OTHER)
  isPrimary    Boolean     @default(false)
  department   String?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  @@index([clientId])
}

model Activity {
  id           String         @id @default(uuid())
  clientId     String
  client       Client         @relation(fields: [clientId], references: [id], onDelete: Cascade)
  contactId    String?
  type         ActivityType
  subject      String
  description  String
  status       ActivityStatus @default(COMPLETED)
  performedBy  String?        // Staff user name or ID
  scheduledAt  DateTime?
  completedAt  DateTime?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  @@index([clientId])
  @@index([type])
  @@index([createdAt])
}
```

*(Note on backward compatibility: If `Customer` model is retained or refactored into `Client`, an adapter or alias ensures existing `order.customerId` points cleanly to the client record).*

#### REST Endpoints Specification (Client 360 Core)

| Method | Endpoint | Description | Request Body / Query Params | Response Status & Body | Error Codes |
|---|---|---|---|---|---|
| `POST` | `/api/clients` | Create new client | Body: `name`, `companyName?`, `document`, `email`, `phone`, `address?`, `status?`, `creditLimit?` | `201 Created` `{ client }` | `400` (Validation), `409` (Doc/Email conflict) |
| `GET` | `/api/clients` | List clients (paginated, filtered) | Query: `page`, `limit`, `search?`, `status?` | `200 OK` `{ data: Client[], total, page, limit }` | `400` |
| `GET` | `/api/clients/:id` | Get single client profile | Params: `:id` (UUID) | `200 OK` `{ client }` | `400`, `404` |
| `PUT` | `/api/clients/:id` | Update client profile | Params: `:id`, Body: partial client fields | `200 OK` `{ client }` | `400`, `404`, `409` |
| `DELETE` | `/api/clients/:id` | Soft delete or deactivate client | Params: `:id` | `200 OK` or `204 No Content` | `400` (Active orders guard), `404` |
| `GET` | `/api/clients/:id/360` | **Consolidated 360 View** | Params: `:id` (UUID) | `200 OK` (Full 360 Aggregate payload) | `400`, `404` |
| `POST` | `/api/clients/:id/contacts` | Add contact to client | Params: `:id`, Body: `name`, `email`, `phone`, `role`, `isPrimary?`, `department?` | `201 Created` `{ contact }` | `400`, `404` |
| `GET` | `/api/clients/:id/contacts` | List contacts for client | Params: `:id` | `200 OK` `Contact[]` | `400`, `404` |
| `GET` | `/api/contacts/:id` | Get contact detail | Params: `:id` | `200 OK` `{ contact }` | `400`, `404` |
| `PUT` | `/api/contacts/:id` | Update contact | Params: `:id`, Body: contact fields | `200 OK` `{ contact }` | `400`, `404` |
| `DELETE` | `/api/contacts/:id` | Delete contact | Params: `:id` | `204 No Content` | `400` (Cannot delete sole primary contact without designating another), `404` |
| `POST` | `/api/clients/:id/activities` | Log new client interaction | Params: `:id`, Body: `type`, `subject`, `description`, `contactId?`, `status?`, `performedBy?` | `201 Created` `{ activity }` | `400`, `404` |
| `GET` | `/api/clients/:id/activities` | List activity history (chronological) | Params: `:id`, Query: `page`, `limit`, `type?`, `status?` | `200 OK` `{ data: Activity[], total, page, limit }` | `400`, `404` |
| `GET` | `/api/activities/:id` | Get activity detail | Params: `:id` | `200 OK` `{ activity }` | `400`, `404` |
| `PUT` | `/api/activities/:id` | Update activity / mark complete | Params: `:id`, Body: `status`, `description?` | `200 OK` `{ activity }` | `400`, `404` |

#### Detailed Client 360 Aggregation Response Payload (`GET /api/clients/:id/360`)
```json
{
  "client": {
    "id": "uuid",
    "name": "Acme Productions Ltd",
    "document": "12.345.678/0001-90",
    "email": "contact@acmeprod.com",
    "phone": "+1-555-0199",
    "status": "ACTIVE",
    "reliabilityScore": 95,
    "creditLimit": 25000.00
  },
  "contacts": [
    {
      "id": "uuid",
      "name": "Sarah Connor",
      "email": "sarah@acmeprod.com",
      "phone": "+1-555-0122",
      "role": "PRIMARY",
      "isPrimary": true,
      "department": "Production Logistics"
    }
  ],
  "recentActivities": [
    {
      "id": "uuid",
      "type": "CALL",
      "subject": "Quote discussion for Summer Gala",
      "description": "Discussed camera packages and lighting grid.",
      "performedBy": "John Agent",
      "createdAt": "2026-09-08T18:00:00Z"
    }
  ],
  "rentalMetrics": {
    "lifetimeSpend": 48500.00,
    "totalOrdersCount": 14,
    "activeRentalsCount": 2,
    "pendingQuotesCount": 1,
    "completedOrdersCount": 11,
    "damageIncidentsCount": 0
  },
  "activeBookings": [
    {
      "orderId": "uuid",
      "state": "IN_PROGRESS",
      "pickUpDate": "2026-09-07T09:00:00Z",
      "returnDate": "2026-09-12T18:00:00Z",
      "totalAmount": 3400.00,
      "itemCount": 5
    }
  ]
}
```

---

### 3.3 R3: Advanced Rental Process API Specification

#### Schema & Data Model Additions
```prisma
enum DamageSeverity {
  MINOR        // Scratches, cosmetic blemishes (repair cost minimal)
  MODERATE     // Functional defect, broken cable/mount, requires shop bench repair
  SEVERE       // Major structural, optical, or electronic damage
  TOTAL_LOSS   // Destroyed, submerged in water, unrepairable, stolen/missing
}

enum DamageStatus {
  REPORTED
  ASSESSED
  CHARGED
  REPAIRED
  WRITTEN_OFF
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
  DURATION_TIER
  CLIENT_SCORE
}

model DamageRecord {
  id                  String         @id @default(uuid())
  orderId             String
  order               Order          @relation(fields: [orderId], references: [id])
  assetId             String
  asset               Asset          @relation(fields: [assetId], references: [id])
  reportedBy          String         // Technician / inspector name
  severity            DamageSeverity
  status              DamageStatus   @default(REPORTED)
  description         String
  photoUrls           String[]
  estimatedRepairCost Decimal        @db.Decimal(10, 2)
  actualRepairCost    Decimal?       @db.Decimal(10, 2)
  chargeToClient      Decimal        @default(0.00) @db.Decimal(10, 2)
  isClientBilled      Boolean        @default(false)
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt

  @@index([orderId])
  @@index([assetId])
  @@index([severity])
}

model RentalCheckLog {
  id          String    @id @default(uuid())
  orderId     String
  order       Order     @relation(fields: [orderId], references: [id])
  type        String    // CHECK_OUT or CHECK_IN
  performedBy String    // Warehouse staff name
  condition   String    // Notes on equipment condition
  passed      Boolean   @default(true)
  timestamp   DateTime  @default(now())

  @@index([orderId])
}
```

#### Order Lifecycle State Machine Evolution
```
[DRAFT Quote]
      │
      ▼
[AWAITING_DEPOSIT]  ──(Deposit Cancelled)──► [CANCELLED]
      │
      ▼ (50%+ Deposit Confirmed + Double-Booking Availability Re-check)
[RESERVED] (Assets locked to RENTED / RESERVED)
      │
      ▼ (Check-out Endpoint: POST /api/orders/:id/checkout)
[IN_PROGRESS] (Assets with client, serial numbers verified)
      │
      ▼ (Check-in Endpoint: POST /api/orders/:id/checkin)
[PENDING_INSPECTION] (Assets returned to warehouse, inspection queue)
      │
      ├────────────────────────────┬────────────────────────────┐
      ▼ (Clean Inspection)         ▼ (Damages Logged)           ▼ (Total Loss)
 [COMPLETED]             [COMPLETED_WITH_DAMAGES]     [COMPLETED_WITH_DAMAGES]
 (Assets -> AVAILABLE)   (Asset -> IN_MAINTENANCE     (Asset -> TOTAL_LOSS
                          Client billed damage fee     Client penalized
                          MaintenanceLog created)      Fleet write-off)
```

#### Detailed Business Logic & Rules

1. **Composite Kit Availability & Allocation Logic:**
   - A Kit consists of multiple component items (`KitItem` -> `ProductBase` with specified `quantity`).
   - When a quote or booking contains a kit:
     - The service extracts all child items: $\text{Required Asset Count}_i = \text{Kit Quantity} \times \text{KitItem Quantity}_i$.
     - Availability is evaluated across $[T_{\text{pickUp}}, T_{\text{return}} + \text{1-day buffer}]$.
     - If *any* component item has insufficient stock, the entire kit allocation fails with `409 Conflict` describing exactly which component is unavailable.
     - When confirmed, specific physical serialized assets for each component item are locked.
2. **Pricing & Discount Calculation Rules:**
   - **Base Price Calculation:**
     - For each product line item: $\text{Daily Rate} \times \text{Quantity} \times \text{Rental Days}$.
     - For composite kits: $\text{Kit Daily Rate} \times \text{Kit Quantity} \times \text{Rental Days}$.
   - **Duration Discount Rules:**
     - 1–3 days: Standard daily rate (0% discount).
     - 4–7 days: 10% multi-day discount.
     - 8–14 days: 20% multi-day discount.
     - 15+ days: 30% extended rental discount.
   - **Client Reliability Tier Discount:**
     - Score $\ge 90$: 5% loyalty discount.
     - Score $\ge 98$: 10% VIP discount.
     - Score $< 50$: No discounts allowed, 100% upfront deposit mandatory (instead of standard 50%).
   - **Manual Discount Overrides:**
     - Admin/manager can specify a custom discount percentage or fixed amount with a required `discountReason`.
   - **Deposit Requirement:**
     - Minimum 50% of total calculated contract amount (unless client score $<50$ requires 100%).
3. **Turnaround Buffer Enforcement (+1 Day):**
   - In all availability lookups (`countAvailableAssetsForProduct`, `checkAssetsAvailability`), return date has +1 day appended:
     ```typescript
     const returnDateWithBuffer = new Date(returnDate);
     returnDateWithBuffer.setDate(returnDateWithBuffer.getDate() + 1);
     ```
   - Prevents booking equipment on turnaround days before optical cleaning, battery charging, and sensor testing are completed.
4. **Check-out Workflow (`POST /api/orders/:id/checkout`):**
   - Pre-condition: Order state must be `RESERVED`.
   - Payload: `staffName`, `notes?`, `assetBarcodesScanned?`.
   - Operation:
     - Verifies all assigned serialized assets are in `RESERVED` state.
     - Creates a `RentalCheckLog` record of type `CHECK_OUT`.
     - Atomically transitions order to `IN_PROGRESS` and assets to `RENTED`.
5. **Check-in Workflow (`POST /api/orders/:id/checkin`):**
   - Pre-condition: Order state must be `IN_PROGRESS`.
   - Payload: `staffName`, `returnNotes?`, `hasReportedDamage: boolean`.
   - Operation:
     - Creates a `RentalCheckLog` record of type `CHECK_IN`.
     - Atomically transitions order to `PENDING_INSPECTION` and assets to `IN_INSPECTION`.
6. **Damage Tracking Workflow (`POST /api/orders/:id/damages`):**
   - Pre-condition: Order is in `PENDING_INSPECTION` or `IN_PROGRESS`.
   - Payload: `assetId`, `reportedBy`, `severity`, `description`, `photoUrls?`, `estimatedRepairCost`, `chargeToClient`.
   - Business Effects:
     - Creates `DamageRecord`.
     - If severity is `TOTAL_LOSS`:
       - Asset state is set to `TOTAL_LOSS`.
       - Client reliability score is reduced (e.g. -15 points).
     - If severity is `MINOR`, `MODERATE`, or `SEVERE`:
       - Asset state is set to `IN_MAINTENANCE`.
       - Automatically generates a `MaintenanceLog` record.
       - Client reliability score is reduced (Minor: -2, Moderate: -5, Severe: -10).
     - Order state transitions to `COMPLETED_WITH_DAMAGES` once inspection finishes.
     - Logs an Activity touchpoint on the client profile (`type: DAMAGE_DISPUTE`).

#### REST Endpoints Specification (Advanced Rental Process API)

| Method | Endpoint | Description | Request Body / Query Params | Response Status & Body | Error Codes |
|---|---|---|---|---|---|
| `POST` | `/api/orders/quotes` | Create quote with products, kits, and discount calculation | Body: `customerId`/`clientId`, `items: [{ productId?, kitId?, quantity }]`, `pickUpDate`, `returnDate`, `discountCode?`, `customDiscount?` | `201 Created` `{ quote }` with price breakdown | `400`, `404`, `409` (Stock unavailable) |
| `POST` | `/api/orders/:orderId/confirm` | Confirm quote with payment deposit (atomic concurrency check) | Params: `:orderId`, Body: `paymentAmount` | `200 OK` `{ order: { state: "RESERVED" } }` | `400` (<50% deposit), `404`, `409` (Race collision) |
| `POST` | `/api/orders/:id/checkout` | Check-out equipment to client | Params: `:id`, Body: `staffName`, `notes?` | `200 OK` `{ order: { state: "IN_PROGRESS" } }` | `400` (Not in RESERVED), `404` |
| `POST` | `/api/orders/:id/checkin` | Check-in equipment on return | Params: `:id`, Body: `staffName`, `returnNotes?` | `200 OK` `{ order: { state: "PENDING_INSPECTION" } }` | `400` (Not in IN_PROGRESS), `404` |
| `POST` | `/api/orders/:id/finish` | Finalize clean inspection & complete order | Params: `:id` | `200 OK` `{ order: { state: "COMPLETED" } }` | `400`, `404` |
| `POST` | `/api/orders/:id/damages` | Record equipment damage / avaries | Params: `:id`, Body: `assetId`, `reportedBy`, `severity`, `description`, `estimatedRepairCost`, `chargeToClient` | `201 Created` `{ damageRecord }` | `400`, `404`, `409` |
| `GET` | `/api/damages` | List damage records (filtered by order, asset, severity, status) | Query: `page`, `limit`, `orderId?`, `assetId?`, `severity?`, `status?` | `200 OK` `{ data: DamageRecord[], total }` | `400` |
| `GET` | `/api/damages/:id` | Get damage record detail | Params: `:id` | `200 OK` `{ damageRecord }` | `400`, `404` |
| `PATCH` | `/api/damages/:id` | Update damage resolution & billing | Params: `:id`, Body: `status`, `actualRepairCost?`, `isClientBilled?` | `200 OK` `{ damageRecord }` | `400`, `404` |
| `GET` | `/api/inventory/availability` | Query fleet availability for items & kits across custom date range | Query: `startDate`, `endDate`, `productIds?`, `kitIds?` | `200 OK` `{ items: [...], kits: [...] }` | `400` |
| `GET` | `/api/orders` | List orders (paginated, filter by state, client, date) | Query: `page`, `limit`, `state?`, `clientId?` | `200 OK` `{ data: Order[], total, page, limit }` | `400` |
| `GET` | `/api/orders/:id` | Get order detail with items, assets, check logs, and damages | Params: `:id` | `200 OK` `{ order }` | `400`, `404` |
| `PUT` | `/api/orders/:id` | Modify order dates or financial terms | Params: `:id`, Body: `pickUpDate?`, `returnDate?`, `totalAmount?` | `200 OK` `{ order }` | `400`, `404`, `409` |
| `DELETE` | `/api/orders/:id` | Delete/cancel order in cancellable state | Params: `:id` | `204 No Content` | `400` (Cannot delete active order), `404` |

---

### 3.4 R4: Documentation Requirements Specification

The delivery must include:
1. **Updated Database Schemas Markdown (`DATABASE_SCHEMAS.md` or updated `API_DOCS.md` / `ARCHITECTURE.md`):**
   - Full ER documentation of all models: `Client`, `Contact`, `Activity`, `ProductBase`, `Asset`, `Kit`, `KitItem`, `Order`, `OrderAsset`, `DamageRecord`, `RentalCheckLog`, `MaintenanceLog`.
   - Field names, data types, nullability, unique keys, foreign key constraints, default values, and composite B-tree indexes.
2. **API Route Catalog Markdown (`API_CATALOG.md` or updated `API_DOCS.md`):**
   - Detailed route catalog covering all new and standardized routes:
     - Endpoints under `/api/clients`, `/api/contacts`, `/api/activities`
     - Endpoints under `/api/orders`, `/api/damages`, `/api/inventory`
     - Request body JSON schemas and parameter schemas
     - Example response payloads (200, 201, 204)
     - Standardized error response envelope (`{ "error": string, "details"?: unknown }`)
3. **Architecture Updates (`ARCHITECTURE.md`):**
   - Updates reflecting the CRM Platform Evolution:
     - Client 360 bounded context and domain models
     - Advanced rental process state machines (Check-out, Check-in, Damage cascades)
     - Centralized infrastructure singleton (`src/infra/database.ts`)
     - Centralized Zod validation layer (`src/schemas/`)
     - Dependency Inversion across all services and repositories.

---

### 3.5 Acceptance Criteria & Testing Strategy

#### 1. Build Verification
- Command: `npm run build`
- Invariant: Must exit with code `0`. All entrypoints must compile cleanly into `dist/`.

#### 2. Existing Tests Verification
- Command: `npm test -- --run`
- Invariant: All 38 existing unit tests must pass without regression.

#### 3. TypeScript Typecheck Verification
- Command: `npx tsc --noEmit`
- Invariant: 0 errors across all 13 currently failing files and all newly added files.

#### 4. New Automated Tests: Client 360 View
- Test file: `src/tests/services/Client360.spec.ts` (or individual service specs in `src/tests/services/` and integration tests):
  1. `CreateClientService`: Validates document uniqueness, valid email, and default reliability score (100). Rejects duplicate CPF/CNPJ.
  2. `CreateContactService`: Validates association to client, role assignment, and enforces that primary contact flag is handled correctly.
  3. `LogActivityService`: Logs activity touchpoints (`CALL`, `EMAIL`, `MEETING`, etc.) with correct timestamp and author.
  4. `GetClient360Service`: Retrieves consolidated view combining profile, contacts, activities, lifetime spend, active orders, and reliability metrics.
  5. `DeleteClientService`: Verifies client cannot be deleted if active rental orders exist.

#### 5. New Automated Tests: Advanced Rental Process Lifecycle
- Test file: `src/tests/services/RentalLifecycle.spec.ts` (or individual service specs):
  1. `CreateQuoteWithKitsAndDiscounts`:
     - Creates quote containing composite kits and single products.
     - Verifies kit component expansion and availability calculation with +1 day buffer.
     - Applies duration discount curve (e.g. 10% for 5-day rental).
     - Applies client score discount.
     - Throws 409 Conflict if any kit item component is out of stock.
  2. `ConfirmOrderWithDeposit`:
     - Validates minimum 50% deposit.
     - Re-checks availability with +1 cleaning buffer.
     - Atomically transitions order to `RESERVED` and assets to `RENTED` via transaction.
     - Throws 409 Conflict on double-booking collision.
  3. `CheckoutOrder`:
     - Verifies order must be in `RESERVED` state.
     - Records `RentalCheckLog` (`CHECK_OUT`).
     - Transitions order to `IN_PROGRESS`.
  4. `CheckinOrder`:
     - Verifies order must be in `IN_PROGRESS` state.
     - Records `RentalCheckLog` (`CHECK_IN`).
     - Transitions order to `PENDING_INSPECTION` and assets to `IN_INSPECTION`.
  5. `DamageReportingAndCascade`:
     - Records damage with severity `TOTAL_LOSS` -> asset becomes `TOTAL_LOSS`, order completes as `COMPLETED_WITH_DAMAGES`, client score penalized.
     - Records damage with severity `MODERATE` -> asset becomes `IN_MAINTENANCE`, `MaintenanceLog` created, repair cost calculated.

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | R1: Architecture | Database Singleton | Consolidate 4 separate database connection pools into a shared database singleton provider | `process.env.DATABASE_URL` | Shared `PrismaClient` and `pg.Pool` instance | Throws if `DATABASE_URL` missing | `AUDIT.md:193-234`, `ARCHITECTURE.md:575-612` |
| 2 | R1: Architecture | Zod Route Parameter Validation | Strict UUID validation middleware/schema on all `:id` and `:orderId` route params | `req.params` | Parsed `{ id: string }` | Returns `400 Bad Request` `{ error, details }` on invalid UUID | `AUDIT.md:237-272`, `GEMINI.md:G-BACK-2` |
| 3 | R1: Architecture | Global Error Handling Standard | Controllers delegate all errors to `next(error)`; eliminate local try/catch ad-hoc envelopes | `next(error)` in catch blocks | Uniform JSON `{ error: string }` | Returns standardized 400, 404, 409, 500 | `AUDIT.md:275-314`, `GEMINI.md:G-BACK-3` |
| 4 | R1: Architecture | Explicit Asset Querying | Implement `findByIdWithAssets` on `ProductRepository` to remove dummy `update(id, {})` reads | `productId: string` | `ProductBase & { assets: Asset[] }` | Returns `null` if not found | `AUDIT.md:317-350`, `ARCHITECTURE.md:6-10` |
| 5 | R1: Architecture | Header Logging Sanitization | Omit `authorization`, `cookie`, `x-api-key` in Winston request logger | `req.headers` | Redacted headers object in logs | None | `AUDIT.md:353-391`, `GEMINI.md:G-SEC-2` |
| 6 | R1: Architecture | CORS Origin Whitelist | Configure CORS with explicit origin whitelist rather than wildcard `*` | `origin: string`, `process.env.CORS_ORIGIN` | Allowed origin header or 403 Forbidden | Rejects unauthorized origins with 403 | `AUDIT.md:394-420`, `GEMINI.md:G-SEC-1` |
| 7 | R1: Architecture | Healthcheck Rate Limiting Exemption | Mount `GET /health` before `express-rate-limit` middleware | `GET /health` | `{ status: "OK", uptime }` | None (never throttled by 429) | `AUDIT.md:423-444`, `ARCHITECTURE.md:820-840` |
| 8 | R1: Architecture | Atomic Transactional State Updates | Wrap multi-table updates in `ConfirmOrderService` in `prisma.$transaction` | Order ID, payment amount, asset IDs | Atomic state commit | Rollback on failure | `AUDIT.md:447-472`, `ARCHITECTURE.md:843-861` |
| 9 | R1: Architecture | Composite Database Indexes | Add indexes on `Order`, `Asset`, `KitItem` high-frequency query columns | Prisma schema definition | Optimized B-tree indexes in Postgres | None | `AUDIT.md:475-507`, `ARCHITECTURE.md:879-903` |
| 10 | R1: Architecture | Paginated Collection Listings | Add `page` and `limit` to `OrderRepository.findAll` and `KitRepository.findAll` | `page: number`, `limit: number` | `{ data: T[], total, page, limit }` | Returns `400` on negative page/limit | `AUDIT.md:510-538`, `ARCHITECTURE.md:864-877` |
| 11 | R1: Architecture | Dependency Inversion in Services | Refactor all 10 service constructors to inject repository interfaces rather than concrete classes | Interfaces (`IProductRepository`, etc.) | Mockable, decoupled use cases | None | `AUDIT.md:541-561`, `GEMINI.md:G-TEST-1` |
| 12 | R1: Architecture | English Language Standardization | Standardize non-ASCII enum `LOUÇAS` to `TABLEWARE` and all Portuguese error strings to English | Schema enum & service error messages | Uniform English API output | None | `AUDIT.md:579-593`, `GEMINI.md:G-ARCH-3` |
| 13 | R1: Architecture | Zod 4 `err.issues` Fix | Migrate deprecated `err.errors` calls to `err.issues` | `ZodError` | Validation issues array | None | `AUDIT.md:596-609`, `GEMINI.md:G-ARCH-4` |
| 14 | R1: Architecture | TypeScript Compile Integrity | Fix all 53 `tsc --noEmit` errors and add `"typecheck": "tsc --noEmit"` | TypeScript compiler | 0 errors | Exit code 2 if type error | `AUDIT.md:93-147`, `package.json` |
| 15 | R1: Architecture | Dashboard Repository Extraction | Extract `IDashboardRepository` & `DashboardRepository` to eliminate ORM leak | `IDashboardRepository` | Aggregated dashboard stats | Throws on DB error | `AUDIT.md:150-190`, `ARCHITECTURE.md:615-641` |
| 16 | R2: Client 360 | Client Management (CRUD) | Create, retrieve, update, and deactivate client entities | Client payload (name, doc, email, phone) | Client object | `400` (Validation), `409` (Duplicate doc/email) | `ORIGINAL_REQUEST.md:47` |
| 17 | R2: Client 360 | Contact Management | Manage multiple contacts per client with roles (`PRIMARY`, `BILLING`, `TECHNICAL`) | Contact payload (name, email, phone, role) | Contact object | `400`, `404` (Client not found) | `ORIGINAL_REQUEST.md:47` |
| 18 | R2: Client 360 | Activity / Interaction Log | Record touchpoints (`CALL`, `EMAIL`, `MEETING`, `WHATSAPP`, `DAMAGE_DISPUTE`) | Activity payload (type, subject, description) | Activity object | `400`, `404` | `ORIGINAL_REQUEST.md:47` |
| 19 | R2: Client 360 | Consolidated 360 View | Single aggregated endpoint returning client profile, contacts, activities, rental stats, and risk score | `clientId: string` | Consolidated 360 JSON payload | `400`, `404` | `ORIGINAL_REQUEST.md:47` |
| 20 | R3: Rental | Composite Kit Quotation | Expanding kit into constituent items and verifying availability for all items with +1 day buffer | Kit ID, quantity, dates | Quote with kit price and assigned assets | `409 Conflict` if any component item out of stock | `ORIGINAL_REQUEST.md:50`, `schema.prisma:110` |
| 21 | R3: Rental | Duration & Tier Pricing Rules | Dynamic discount calculation based on rental duration (e.g. >3d 10%, >7d 20%) and client score | Dates, items, client score | Adjusted line item subtotals and discount breakdown | `400` if dates invalid | `ORIGINAL_REQUEST.md:50` |
| 22 | R3: Rental | Minimum Deposit Guard | Verifies payment is $\ge 50\%$ before transitioning order to `RESERVED` | `paymentAmount: number` | Confirmed order | `400 Bad Request` if deposit $<50\%$ | `ConfirmOrderService.ts:53-60` |
| 23 | R3: Rental | Turnaround Buffer (+1 Day) | Mandatory +1 day post-rental turnaround window for cleaning and inspection | `returnDate: Date` | Evaluated against `returnDate + 1 day` | `409 Conflict` on overlap within buffer | `CreateQuoteService.ts:68-72` |
| 24 | R3: Rental | Concurrency Race Condition Re-check | Pre-confirmation availability re-verification excluding current order to prevent double booking | Asset IDs, dates with buffer, excludeOrderId | Confirmed reservation | `409 Conflict` if another order reserved asset | `ConfirmOrderService.ts:62-81` |
| 25 | R3: Rental | Check-out Dispatch Milestone | Warehouse dispatch check transitioning order to `IN_PROGRESS` and assets to `RENTED` | Order ID, staff name, notes | Updated order state `IN_PROGRESS` | `400` if order not in `RESERVED` | `ORIGINAL_REQUEST.md:50`, `ARCHITECTURE.md:408` |
| 26 | R3: Rental | Check-in Return Milestone | Warehouse return receipt transitioning order to `PENDING_INSPECTION` and assets to `IN_INSPECTION` | Order ID, staff name, return condition | Updated order state `PENDING_INSPECTION` | `400` if order not in `IN_PROGRESS` | `ORIGINAL_REQUEST.md:50`, `ARCHITECTURE.md:409` |
| 27 | R3: Rental | Damage / Avaries Recording | Log equipment damage with severity (`MINOR`, `MODERATE`, `SEVERE`, `TOTAL_LOSS`) and costs | Damage payload (orderId, assetId, severity, cost) | `DamageRecord` object | `400`, `404` | `ORIGINAL_REQUEST.md:50`, `schema.prisma:98` |
| 28 | R3: Rental | Damage Cascade & Penalization | Automatic transition of asset to `IN_MAINTENANCE` or `TOTAL_LOSS`, order to `COMPLETED_WITH_DAMAGES`, client score penalty | Damage severity | Updated asset/order states and client score | None | `ORIGINAL_REQUEST.md:50`, `AssetState.ts` |
| 29 | R3: Rental | Real-time Inventory Availability Query | Query fleet availability for all items and kits across custom date ranges with buffer | `startDate`, `endDate`, optional IDs | Available asset counts and stock projection | `400` if start $\ge$ end | `ORIGINAL_REQUEST.md:50` |
| 30 | R4: Docs | Database Schema Documentation | Markdown reference of all CRM and rental tables, relationships, and indexes | Schema definitions | `DATABASE_SCHEMAS.md` / `ARCHITECTURE.md` | None | `ORIGINAL_REQUEST.md:53, 66` |
| 31 | R4: Docs | REST API Catalog | Markdown catalog of all endpoints, parameters, Zod schemas, payloads, and error formats | API definitions | `API_CATALOG.md` / `API_DOCS.md` | None | `ORIGINAL_REQUEST.md:53, 66` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---|---|---|
| 1 | Create Quote | `returnDate` equal to or earlier than `pickUpDate` | Zod refinement throws validation error with message `"Return date must be after pick-up date"`, resulting in `400 Bad Request`. |
| 2 | Create Quote | Single day rental where duration calculation gives 0 | Service uses fallback `days = Math.ceil(...) || 1`, correctly billing for a minimum of 1 day. |
| 3 | Create Quote with Buffer | Quote A returns on Sept 10. Quote B requests pickup on Sept 11 for the same asset. | Because +1 day turnaround buffer is enforced, Quote A's blocked window extends through Sept 11. Quote B availability check flags conflict and rejects with `409 Conflict`. |
| 4 | Confirm Order | `paymentAmount` is 49.9% of `totalAmount` | Service checks `paymentAmount < totalAmount * 0.5` and throws `AppError("Deposit amount must be at least 50%...", 400)`. |
| 5 | Confirm Order | Payment made for an order already in `RESERVED` or `COMPLETED` state | Service checks `order.state !== DRAFT && order.state !== AWAITING_DEPOSIT` and throws `AppError("Order cannot be confirmed in its current state", 400)`. |
| 6 | Confirm Order (Race Condition) | Two clients receive quotes for the sole available Sony FX3 camera. Client A confirms first. Client B confirms 1 second later. | Client B's `checkAssetsAvailability` identifies that the asset is now claimed by Client A's `RESERVED` order, aborting Client B's transaction with `409 Conflict`. |
| 7 | Route Parameters | Non-UUID string passed to `:id` or `:orderId` (e.g. `/api/orders/abc-123/confirm` or SQL injection payload) | Zod UUID schema rejects payload with `400 Bad Request` before reaching controller or database query. |
| 8 | Kit Availability | Kit requires 2 cameras and 4 lenses. Warehouse has 5 cameras available but only 3 lenses available. | Kit allocation fails atomically; service throws `409 Conflict` identifying lenses as the bottleneck item. |
| 9 | Check-out Booking | Warehouse operator attempts to check out an order that is still in `DRAFT` or `AWAITING_DEPOSIT` | Service rejects request with `400 Bad Request` because equipment cannot be dispatched without confirmed deposit. |
| 10 | Check-in Booking | Warehouse operator attempts to check in an order that has not been dispatched (`RESERVED`) | Service rejects request with `400 Bad Request` because equipment was never checked out. |
| 11 | Damage Reporting | Return inspection detects total destruction (`TOTAL_LOSS`) of a cinema lens | Asset state is updated to `TOTAL_LOSS`, order is finalized as `COMPLETED_WITH_DAMAGES`, client's reliability score is docked 15 points, and a damage charge is recorded. |
| 12 | Delete Client | Attempting to delete a client who has active orders in `RESERVED` or `IN_PROGRESS` | Service blocks deletion with `400 Bad Request` stating client has active rental commitments. |
| 13 | Delete Product | Attempting to delete a product base whose physical assets are rented or have order history | Service catches foreign key constraint `P2003` or checks active assets, returning `400 Bad Request` advising to zero out stock instead. |
| 14 | Stock Contraction | Admin attempts to decrease stock quantity below the number of currently rented/reserved units | Service calculates `availableStock` and throws `400 Bad Request` indicating units cannot be removed while deployed in field. |
| 15 | Primary Contact Switch | Creating a second contact for a client marked as `isPrimary: true` | Service unsets `isPrimary` on the existing primary contact, ensuring exactly one primary contact per client. |
| 16 | Rate Limiter on Healthcheck | Automated infrastructure probe sends 150 health requests in 1 minute to `/health` | Because `/health` is mounted *before* `express-rate-limit`, probes consistently return `200 OK` and are not throttled with `429`. |
| 17 | Header Logging | Client sends `Authorization: Bearer <secret_token>` or `Cookie: session=<hash>` | Winston logger redacts `authorization` and `cookie` headers, preventing credential exposure in `logs/combined.log`. |

---

## 4. Caveats

1. **Database Schema Migration Execution:**
   - The project uses PostgreSQL connected to Supabase pooler via `DATABASE_URL`. Any schema additions (`Client`, `Contact`, `Activity`, `DamageRecord`, `RentalCheckLog`, composite indexes) must be applied either via `npx prisma db push` (development mode) or Prisma migrations.
   - For local unit tests, Vitest currently mocks repository interfaces, allowing unit test suites to execute without a live database connection.
2. **Customer vs. Client Domain Terminology:**
   - The existing system uses `Customer` for basic order associations. In the CRM evolution, `Client` represents the expanded B2B/B2C entity. The implementation should either cleanly migrate `Customer` to `Client` or provide a 1:1 foreign key/adapter to avoid breaking legacy queries in `OrderRepository`.
3. **Zod Version Compatibility:**
   - The project has Zod `^4.4.2` installed. Code must strictly use `err.issues` rather than `err.errors`.
4. **No Code Modification Undertaken:**
   - In accordance with the role of Specification Miner, no implementation files have been modified. All findings are purely analytical, observational, and navigational.

---

## 5. Conclusion

The specification survey establishes a clear, comprehensive roadmap for evolving the `backend-boilerplate` into a CRM platform:
1. **R1 (Architectural Standardization):** Requires resolving 53 silent TypeScript compilation errors, unifying 4 connection pools into `src/infra/database.ts`, enforcing Zod parameter validation across all routes, standardizing controller error delegation, extracting `DashboardRepository`, implementing `findByIdWithAssets`, redacting sensitive headers, exempting `/health` from rate limiting, and wrapping mutations in `prisma.$transaction`.
2. **R2 (Client 360 Core API):** Requires implementing `Client`, `Contact`, and `Activity` models and controllers, providing full CRUD plus a consolidated `GET /api/clients/:id/360` endpoint aggregating profile, contacts, touchpoints, rental spend, and risk score.
3. **R3 (Advanced Rental Process API):** Requires composite kit expansion, multi-day and client-tier discount pricing rules, check-out and check-in operational endpoints (`RentalCheckLog`), damage avaries tracking (`DamageRecord`) with asset state cascades (`IN_MAINTENANCE`, `TOTAL_LOSS`), and preserving the +1 day turnaround cleaning buffer and anti-race condition guards.
4. **R4 (Documentation):** Requires delivering updated markdown schemas and an exhaustive API catalog covering all endpoints and payloads.
5. **Acceptance Criteria:** `npm run build` exits 0, `npm test` passes all tests, and comprehensive automated test suites cover Client 360 and the rental lifecycle.

---

## 6. Verification Method

To independently verify the findings in this report:

1. **Verify TypeScript Errors:**
   ```bash
   npx tsc --noEmit
   ```
   *Expected:* Fails with 53 compilation errors across the 13 cited files (e.g. `OrderState.TOTAL_LOSS`, `err.errors`, Express 5 `req.params`).
2. **Verify Existing Vitest Test Suite:**
   ```bash
   npm test -- --run
   ```
   *Expected:* All 10 test files and 38 unit tests pass with exit code 0.
3. **Verify Build Process:**
   ```bash
   npm run build
   ```
   *Expected:* Bundles output to `dist/` with exit code 0.
4. **Verify Prisma Schema:**
   ```bash
   npx prisma validate
   ```
   *Expected:* Confirms `prisma/schema.prisma` is currently valid.
5. **Verify Connection Pool Duplication:**
   Inspect `src/routes/order.routes.ts:17-20`, `product.routes.ts:13-16`, `kit.routes.ts:11-14`, and `dashboard.routes.ts:8-11`.
6. **Verify Header Logging Vulnerability:**
   Inspect `src/middlewares/logging.middleware.ts:44` where `headers: req.headers` is logged directly.
7. **Verify Rate Limiter Placement:**
   Inspect `src/app.ts:28` (`app.use(limiter)`) and line 31 (`app.get('/health', ...)`).
