# Comprehensive Specification Mining Report: Architectural Requirements & Audit Standards

**Agent:** `spec_miner_survey_1` (Specification Miner)  
**Date:** 2026-09-08 / 2026-09-09 UTC  
**Target Project:** `backend-boilerplate` (CRM Pegue-e-Monte / Equipment Rental System)  
**Working Directory:** `/home/workspace/backend-boilerplate`  
**Authoritative Sources Inspected:**
- `/home/workspace/backend-boilerplate/ORIGINAL_REQUEST.md`
- `/home/workspace/backend-boilerplate/GEMINI.md`
- `/home/workspace/backend-boilerplate/API_DOCS.md`
- `/home/workspace/backend-boilerplate/README.md`
- `/home/workspace/backend-boilerplate/package.json`
- `/home/workspace/backend-boilerplate/tsconfig.json`
- `/home/workspace/backend-boilerplate/prisma/schema.prisma`
- Application source files in `src/` (Controllers, Services, Repositories, Middlewares, Errors, Routes, Domain, Tests)

---

## 1. Executive Summary

This report establishes the authoritative specification baseline for the **Pegue-e-Monte** backend project. It mines, deconstructs, and categorizes all architectural requirements, coding standards, design patterns, security rules, error handling guidelines, and testing criteria outlined in `ORIGINAL_REQUEST.md` and `GEMINI.md`.

The survey results serve as the definitive specification contract for:
1. **Milestone 1 (Architectural Documentation):** Requirements for architecture scope, layered structure, data flow, component interactions, and syntax-valid Mermaid visual models.
2. **Milestone 2 (Codebase Audit & Critique):** Comprehensive taxonomy of GEMINI.md guidelines, rule citations, audit checklist, and deviation criteria.
3. **Acceptance Criteria & Quality Gates:** Clear evaluation metrics ensuring documentation depth and audit rigor.

---

## 2. R1 Requirements: Architectural Documentation Specification

Per `ORIGINAL_REQUEST.md` (§ R1. Architectural Documentation), the deliverable must be a comprehensive Markdown document describing the backend architecture, complete with Mermaid diagrams visualizing data flows, component interactions, and system structure.

### 2.1 Scope & Purpose
The architectural documentation must provide an exhaustive, holistic breakdown of the system:
- **System Overview & Domain Context:** Equipment rental CRM ("Pegue-e-Monte") managing customers, product catalog, individualized physical assets, rental orders/quotes, promotional kits, and operational analytics.
- **Layered Clean Architecture:** Structural boundaries between HTTP presentation (Routes & Controllers), Domain Business Logic (Services / Use Cases), Data Access (Repositories / DAOs), Persistence (Prisma ORM & PostgreSQL pool), and Cross-Cutting Concerns (Middlewares, Logging, Security).
- **Domain State Machines:** Formal transitions for order lifecycle (`OrderState`) and physical asset status (`AssetState`).
- **Data Consistency & Concurrency Strategies:** Prevention of double-booking, race condition mitigation upon order confirmation, and inventory buffer rules (+1 day cleaning window).

### 2.2 Structural Blueprint of Architectural Deliverable
The resulting architectural document must feature the following sections:
1. **Executive Overview & Technology Stack** (Node.js, Express, TypeScript, PostgreSQL, Prisma, Zod, Winston, Helmet, CORS, Rate Limit).
2. **High-Level System Topology & Container View** (Client, Reverse Proxy trust, Express Server, PostgreSQL/Supabase database).
3. **Detailed Layered Architecture** (Presentation, Domain/Application, Infrastructure/Persistence, Cross-Cutting).
4. **Domain Model & State Machines** (`OrderState`, `AssetState`, `ProductCategory`, associative entities like `OrderAsset`).
5. **Key Business Flows & Request Lifecycles** (Quote creation with buffer logic, order confirmation with concurrency lock, order finalization and asset release).
6. **Security, Observability & Performance Architecture** (Rate limiting, Helmet headers, CORS policies, Winston structured logging, Prisma connection pool management).
7. **Mermaid Diagrams** (Minimum 2 mandatory diagrams; recommended 4 to cover all aspects).

### 2.3 Required Mermaid Diagrams & Visualization Rules
`ORIGINAL_REQUEST.md` specifies that diagrams must visualize:
- **Data Flows**
- **Component Interactions**
- **System Structure**

#### Diagram Specifications:
| Diagram Name | Type | Purpose & Scope | Key Elements |
|---|---|---|---|
| **System Architecture / Component Structure** | `graph TD` or `C4Container` | Illustrates structural layering, component boundaries, and dependency flow. | Client -> Global Middlewares -> Express Routers -> Controllers -> Services (Use Cases) -> Repositories -> Prisma Client -> PostgreSQL DB. |
| **End-to-End Request & Data Flow** | `sequenceDiagram` | Traces complete request-response cycle from client request to database query and response output. | Client, Express App, RateLimiter/Helmet, Router, Controller, Zod Validation, Service, Repository, Database. |
| **Order & Reservation Lifecycle Interactions** | `sequenceDiagram` or `graph TD` | Shows component interactions during critical business operations (Quote Creation & Confirmation with race-condition re-check). | Customer/Front, OrderController, Zod Schema, CreateQuoteService, AssetRepository, OrderRepository, Concurrency Check. |
| **Domain State Transition Model** | `stateDiagram-v2` | Models state transitions of Orders and physical Assets, highlighting business triggers and validations. | Order States: `DRAFT` -> `AWAITING_DEPOSIT` -> `RESERVED` -> `IN_PROGRESS` -> `PENDING_INSPECTION` -> `COMPLETED` / `COMPLETED_WITH_DAMAGES`. Asset States: `AVAILABLE` -> `RESERVED` -> `RENTED` -> `IN_INSPECTION` -> `IN_MAINTENANCE` / `TOTAL_LOSS`. |

#### Syntax Correctness & Rendering Validation Requirements:
- Must use valid Mermaid fences (` ```mermaid ... ``` `).
- Must declare valid graph types (`graph TD`, `sequenceDiagram`, `stateDiagram-v2`, `erDiagram`).
- Node labels with special characters (brackets, quotes, parentheses, dashes) must be enclosed in double quotes (e.g., `id["Description (Detail)"]`).
- No dangling syntax tokens, unclosed parentheses, or illegal arrow operators.
- Subgraphs must have explicit unique identifiers and closing `end` statements.
- Every diagram must be verified to render cleanly without browser or markdown parser syntax errors.

---

## 3. R2 Requirements: Codebase Audit & Critique Guidelines (GEMINI.md)

Per `ORIGINAL_REQUEST.md` (§ R2. Codebase Audit and Critique) and `GEMINI.md`, the codebase must be rigorously audited against all established engineering principles and standards.

### 3.1 Guideline Taxonomy & Rule Definitions

Below is the complete, canonical rule inventory extracted from `GEMINI.md`:

```
================================================================================
GEMINI.md RULE TAXONOMY
================================================================================
SECTION: 🤖 Papel e Persona
  - G-ROLE: Senior Software Engineer & Fullstack Solutions Architect persona.
            Specialist in Node.js, React, TypeScript, Linux.
            Objective: Clean, scalable, secure, easy-to-maintain code.

SECTION: 🛠️ Stack Tecnológica Base
  - G-STACK-BE: Node.js, Express, TypeScript.
  - G-STACK-FE: React, Vite, TypeScript, Tailwind CSS.
  - G-STACK-VAL: Zod.
  - G-STACK-TOOL: Docker, tsx, tsup, ESLint, Prettier.

SECTION: 📐 Princípios de Engenharia e Arquitetura
  - G-ARCH-1 (SOLID & Clean Code):
      * Prioritize small functions with single responsibility (SRP).
      * Avoid deep nesting.
      * Mandatory use of Early Return / Guard Clauses.
  - G-ARCH-2 (Design Patterns):
      * Use appropriate patterns when solving real problems (Factory, Strategy, Repository).
      * Strictly avoid overengineering.
  - G-ARCH-3 (Nomenclatura / Naming):
      * Descriptive English names for variables, functions, and classes.
      * Code must read like documentation.
  - G-ARCH-4 (Tipagem Rigorosa / Rigorous Typing):
      * TypeScript configured in `strict: true` mode.
      * NEVER use `any`.
      * If type is unknown, use `unknown` with safe assertions / type guards.

SECTION: ⚙️ Regras de Backend (Node.js/Express)
  - G-BACK-1 (Separação de Responsabilidades / Layers):
      * Routes: Map endpoints to controllers ONLY.
      * Controllers: Handle HTTP request and response ONLY; NO business logic.
      * Services / Use Cases: House application business logic.
      * Repositories / DAOs: Sole layer responsible for interacting with database.
  - G-BACK-2 (Validação / Validation):
      * ALL incoming data (Body, Params, Query) must be strictly validated using Zod BEFORE reaching Services.
  - G-BACK-3 (Tratamento de Erros / Error Handling):
      * Centralized global error middleware.
      * NEVER expose sensitive stack traces in production.
      * Utilize custom error classes (e.g., `AppError`).

SECTION: 🖥️ Regras de Frontend (React)
  - G-FRONT-1 (Arquitetura de Componentes):
      * Small, dumb components.
      * Complex logic and API calls extracted into Custom Hooks.
  - G-FRONT-2 (Gerenciamento de Estado):
      * Prioritize local state.
      * Modern lightweight global state (Zustand, Context API); avoid heavy solutions.
  - G-FRONT-3 (Acessibilidade / a11y):
      * ARIA attributes and full keyboard navigation.

SECTION: 🔒 Segurança e Performance
  - G-SEC-1 (Proteção / Security Protection):
      * Properly configured CORS.
      * `helmet` for HTTP security headers.
      * Rate Limiting to prevent brute-force attacks.
  - G-SEC-2 (Dados Sensíveis / Sensitive Data):
      * NEVER hardcode credentials.
      * Always use environment variables (`process.env`).
  - G-SEC-3 (Performance):
      * Pagination for long lists.
      * Optimized database queries.
      * Proper database indexes for frequent searches.

SECTION: 🧪 Testes e Qualidade
  - G-TEST-1 (Cultura de Testes):
      * Design code for testability.
      * Easily mockable via Dependency Inversion.
  - G-TEST-2 (Cobertura / Test Coverage):
      * Suggest crucial unit test scenarios for every complex Service feature.

SECTION: 🗣️ Formato da Resposta da IA
  - G-AI-1: Think step-by-step before suggesting refactorings.
  - G-AI-2: Direct, concise communication without unnecessary filler.
  - G-AI-3: Provide complete code blocks or exact diffs.
  - G-AI-4: Alert user immediately if a request violates any guideline and propose the correct approach.
================================================================================
```

### 3.2 Audit Evaluation Criteria & Reference Matrix
For Milestone 2, the critique must evaluate every layer against these exact rules. Below is the criteria table that the auditor must satisfy:

| Guideline ID | Rule Name | Requirement Description | Verification Focus in Backend Codebase |
|---|---|---|---|
| **G-ARCH-1** | SOLID & Clean Code | Small single-purpose functions, early returns, guard clauses, no deep nesting. | Inspect complex methods in Services and Controllers for nested conditionals and multiple responsibilities. |
| **G-ARCH-2** | Design Patterns | Pragmatic patterns (Repository, Factory, Singleton); avoid overengineering. | Check repository abstraction, connection pool singleton vs multiple instances, service factories. |
| **G-ARCH-3** | Naming Standards | Descriptive English names; self-documenting code. | Verify identifiers across models, routes, variables, and error messages. |
| **G-ARCH-4** | Rigorous Typing | Strict TS mode, zero `any`, safe `unknown` type narrowing. | Scan for `any` keywords, unsafe type casts, and untyped error handling (`catch (error: unknown)`). |
| **G-BACK-1.1** | Layer: Routes | Routes must ONLY map endpoints to controllers. | Verify if route files contain business logic, database instantiations, or inline handlers. |
| **G-BACK-1.2** | Layer: Controllers | Controllers handle HTTP only; no business logic. | Check controllers for price calculations, state transitions, direct database queries, or ad-hoc error formatting. |
| **G-BACK-1.3** | Layer: Services | Services house business logic exclusively. | Check that all domain logic, validation of business rules, and state changes reside in Services. |
| **G-BACK-1.4** | Layer: Repositories | Repositories exclusively interact with database. | Verify that NO service or controller directly imports or uses `PrismaClient` or raw SQL. |
| **G-BACK-2** | Zod Validation | ALL input (Body, Params, Query) strictly validated with Zod before Services. | Check if Route Params (e.g. `:id`, `:orderId`) and Query parameters are validated via Zod. Check if schemas are centralized. |
| **G-BACK-3** | Error Handling | Global error middleware, custom `AppError`, no stack traces exposed in production. | Verify if all controller catch blocks invoke `next(error)` or handle errors with inconsistent ad-hoc JSON responses. Verify stack trace masking. |
| **G-SEC-1** | Security Headers & Rate Limit | CORS configured, Helmet enabled, Rate Limiting active. | Verify `app.ts` middleware configuration, rate limit settings, proxy trust, and CORS origins. |
| **G-SEC-2** | Sensitive Data Handling | No hardcoded secrets; use `process.env`. | Check for credentials in code, connection string handling, and `.env` parsing. |
| **G-SEC-3** | Performance & Queries | Pagination for lists, query optimization, indexing. | Check `findAll` pagination implementations, `PrismaClient` connection pooling, and schema indexes. |
| **G-TEST-1** | Testability & Inversion | Code easily mockable via Dependency Inversion. | Verify whether Services depend on interfaces (`IOrderRepository`) or concrete classes (`OrderRepository`). |
| **G-TEST-2** | Unit Test Coverage | Critical unit tests covering complex business scenarios. | Review test suite coverage in `src/tests/services/` for edge cases (buffer dates, race conditions, stock shortages). |

---

## 4. Acceptance Criteria & Audit Rigor Standards

Per `ORIGINAL_REQUEST.md` (§ Acceptance Criteria), all deliverables must meet explicit, measurable standards:

### 4.1 Documentation Quality Standards
- [x] **Criterion D1 (Diagram Quantity):** The architectural document must contain at least **two** Mermaid diagrams (e.g., Data Flow and System Architecture). *Downstream recommendation: include 4 diagrams to cover system structure, data flow, order lifecycle sequence, and state machines.*
- [x] **Criterion D2 (Diagram Syntax Validity):** All Mermaid diagrams must render correctly without any syntax errors. Every diagram must be strictly validated.

### 4.2 Audit Rigor Standards
- [x] **Criterion A1 (Guideline References):** The audit critique must explicitly reference at least **three specific guidelines** from `GEMINI.md` (e.g., Layer Separation, Zod Validation, Rigorous Typing, Error Handling).
- [x] **Criterion A2 (Exact Citations):** Every identified architectural deviation must include an **exact file path citation** (and line numbers) alongside a concise, actionable explanation of the violation and a recommended concrete fix.

---

## 5. Features Discovered (Specification Miner Core Table)

The table below enumerates all public interfaces, endpoints, domain behaviors, inputs, outputs, error conditions, and discovery channels in the codebase:

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Health & Telemetry | GET `/health` | Server uptime and health probe | None | HTTP 200 `{ status: "OK", uptime: number }` | HTTP 500 if server failing | `src/app.ts:31-33`, `API_DOCS.md:7-16` |
| 2 | Security & Middleware | Reverse Proxy Trust | Configures Express to trust proxy for IP detection | `app.set('trust proxy', 1)` | Trust header set | None | `src/app.ts:15` |
| 3 | Security & Middleware | Rate Limiting | Enforces 100 requests per 15-minute window per IP | HTTP Client requests | Headers (`RateLimit-*`), HTTP 429 if exceeded | HTTP 429 "Muitas requisições deste IP..." | `src/app.ts:17-21,28` |
| 4 | Security & Middleware | Helmet & CORS | Adds HTTP security headers and enables CORS | Inbound HTTP headers | Security headers (`X-DNS-Prefetch-Control`, `X-Frame-Options`, etc.) | None | `src/app.ts:24-25` |
| 5 | Observability | Request & Error Logging | Structured Winston logging with duration tracking | Inbound HTTP req / res events | Console logs (JSON in prod, colorized in dev) | Logs unhandled errors with stack | `src/middlewares/logging.middleware.ts:1-79`, `src/app.ts:27` |
| 6 | Error Handling | Central Error Middleware | Formats `AppError`, `ZodError`, and internal 500s | Thrown Error / NextFunction | JSON `{ error: string, details?: any }` | Masks 500 stack in prod; warns on 400 | `src/middlewares/errorHandler.middleware.ts:6-36` |
| 7 | Order Management | Create Quote (POST `/api/orders/quotes`) | Creates draft rental quote with availability check and cleaning buffer | JSON: `customer`, `items: [{productId, quantity}]`, `pickUpDate`, `returnDate` | HTTP 201 `{ id, customerId, pickUpDate, returnDate, assetIds, totalAmount, state: "DRAFT" }` | 400 validation error; 404 product not found; 409 insufficient stock | `src/routes/order.routes.ts:50`, `src/services/CreateQuoteService.ts:62-129`, `src/schemas/order.schema.ts:3-29` |
| 8 | Order Management | Confirm Order (POST `/api/orders/:orderId/confirm`) | Confirms order, checks min 50% deposit, re-checks availability (race condition), locks assets | Route param: `orderId`; Body: `{ paymentAmount: number }` | HTTP 200 Updated Order `{ id, state: "RESERVED", amountPaid, ... }` | 400 invalid state / deposit < 50%; 404 order not found; 409 booking collision | `src/routes/order.routes.ts:53`, `src/services/ConfirmOrderService.ts:35-97`, `src/schemas/order.schema.ts:31-35` |
| 9 | Order Management | Finish Order (POST `/api/orders/:id/finish`) | Marks order COMPLETED and releases rented assets to AVAILABLE | Route param: `id` | HTTP 200 Updated Order `{ id, state: "COMPLETED", ... }` | 400 order in DRAFT/COMPLETED; 404 not found | `src/routes/order.routes.ts:56`, `src/services/FinishOrderService.ts:24-55` |
| 10 | Order Management | List Orders (GET `/api/orders`) | Lists all orders ordered by creation descending | None | HTTP 200 `Order[]` with customer and assets | 500 on database failure | `src/routes/order.routes.ts:59`, `src/services/ListOrdersService.ts:1-12` |
| 11 | Order Management | Update Order (PUT `/api/orders/:id`) | Updates dates or total amount with availability re-validation | Route param: `id`; Body: `{ pickUpDate?, returnDate?, totalAmount? }` | HTTP 200 `Order` | 400 dates invalid or order completed; 404 not found; 409 date collision | `src/routes/order.routes.ts:62`, `src/controllers/order.controller.ts:82-104`, `src/services/UpdateOrderService.ts:15-74` |
| 12 | Order Management | Delete Order (DELETE `/api/orders/:id`) | Deletes order and associated order assets if state permits | Route param: `id` | HTTP 204 No Content | 400 order in active/unfinalized state; 404 not found | `src/routes/order.routes.ts:65`, `src/controllers/order.controller.ts:106-119`, `src/services/DeleteOrderService.ts:8-32` |
| 13 | Product Management | Search Products (GET `/api/products`) | Paginated search of products with stock availability aggregation | Query: `page`, `limit`, `category`, `search` | HTTP 200 `{ data: Product[], total, page, limit }` | 400 on invalid query coercion | `src/routes/product.routes.ts:35`, `src/controllers/ProductController.ts:19-38`, `src/services/SearchProductsService.ts:13-51` |
| 14 | Product Management | Create Product (POST `/api/products`) | Creates product and automatically generates individual serial assets | Body: `{ name, description?, category, pricePerDay, stock, imageUrl? }` | HTTP 201 Product representation with `isAvailable` | 400 price <= 0, stock < 0, or invalid category | `src/routes/product.routes.ts:38`, `src/controllers/ProductController.ts:40-64`, `src/services/CreateProductService.ts:17-48` |
| 15 | Product Management | Update Product (PUT `/api/products/:id`) | Updates product metadata (name, price, category, etc.) | Route param: `id`; Body: `{ name?, description?, category?, pricePerDay?, imageUrl? }` | HTTP 200 Updated Product | 400 validation error; 404 not found | `src/routes/product.routes.ts:41`, `src/controllers/ProductController.ts:66-90`, `src/services/UpdateProductService.ts:1-35` |
| 16 | Product Management | Update Stock (PATCH `/api/products/:id/stock`) | Adjusts physical assets count (creates new assets or deletes AVAILABLE ones) | Route param: `id`; Body: `{ newStockQuantity: number }` | HTTP 200 Updated Product with new stock totals | 400 negative stock or removing rented/reserved assets; 404 not found | `src/routes/product.routes.ts:44`, `src/controllers/ProductController.ts:92-115`, `src/services/UpdateProductStockService.ts:12-76` |
| 17 | Product Management | Delete Product (DELETE `/api/products/:id`) | Cascades deletion of product assets and product base | Route param: `id` | HTTP 204 No Content | 404 / 500 error | `src/routes/product.routes.ts:48`, `src/controllers/ProductController.ts:117-130`, `src/services/DeleteProductService.ts:1-12` |
| 18 | Kit Management | Create Kit (POST `/api/kits`) | Creates promotional kit bundle linked to product items | Body: `{ name, description?, price, isFavorited?, items: [{productBaseId, quantity}] }` | HTTP 201 `KitWithItems` | 400 invalid payload, empty items, or non-UUID productBaseId | `src/routes/kit.routes.ts:30`, `src/controllers/KitController.ts:14-36`, `src/services/CreateKitService.ts:1-25` |
| 19 | Kit Management | List Kits (GET `/api/kits`) | Lists all kits ordered by creation descending | None | HTTP 200 `KitWithItems[]` | 500 database error | `src/routes/kit.routes.ts:31`, `src/controllers/KitController.ts:38-45`, `src/services/ListKitsService.ts:1-12` |
| 20 | Kit Management | Toggle Favorite (PATCH `/api/kits/:id/favorite`) | Updates `isFavorited` boolean flag on kit | Route param: `id`; Body: `{ isFavorited: boolean }` | HTTP 200 Updated Kit | 400 invalid boolean; 404 not found | `src/routes/kit.routes.ts:32`, `src/controllers/KitController.ts:47-62`, `src/services/ToggleFavoriteKitService.ts:1-16` |
| 21 | Dashboard & Analytics | Get Stats (GET `/api/dashboard/stats`) | Aggregates operational KPIs (equipment, active clients, monthly revenue, recent orders) | None | HTTP 200 `{ totalEquipment, rentedEquipment, activeCustomers, activeOrders, monthlyRevenue, recentOrders }` | 500 database failure | `src/routes/dashboard.routes.ts:18`, `src/controllers/DashboardController.ts:9-21`, `src/services/GetDashboardStatsService.ts:7-76` |
| 22 | Customer Persistence | Upsert Customer | Finds customer by email or document; creates record if absent | `{ name, email, phone, document }` | `Customer` record | Throws if duplicate constraints violated | `src/repositories/CustomerRepository.ts:6-31` |
| 23 | Inventory Scheduling | Check Assets Availability | Evaluates temporal overlap against blocking order states (`AWAITING_DEPOSIT`, `RESERVED`, `IN_PROGRESS`, `PENDING_INSPECTION`) | `assetIds`, `startDate`, `endDate`, optional `excludeOrderId` | `string[]` (unavailable asset IDs) | None | `src/repositories/OrderRepository.ts:93-129` |
| 24 | Testing Infrastructure | Vitest Test Suite | Unit tests for services with mocked repositories | Executed via `npm test` (`vitest --run`) | 10 test files, 38 passing tests | Fails on regression | `package.json:12`, `src/tests/` |

---

## 6. Edge Cases & Boundary Conditions Discovered

The following table documents observable behavioral nuances, edge cases, and deviation patterns identified during specification inspection:

| # | Feature / Area | Input / Condition | Observed Behavior & Analysis | Guideline Impact |
|---|---|---|---|---|
| 1 | Cleaning Buffer Logic | Quote creation for dates `2026-08-01` to `2026-08-05` | Service automatically adds 1 day buffer to `returnDate` (`2026-08-06`) for cleaning/inspection before querying asset availability and calculating daily price. | **G-BACK-1.3** (Business logic properly situated in Service). |
| 2 | Double Booking / Race Condition | Two concurrent payments confirming overlapping orders | `ConfirmOrderService` re-evaluates `checkAssetsAvailability` with `excludeOrderId` right before marking `RESERVED`. If collision detected, aborts with 409 `AppError`. | **G-BACK-1.3, G-SEC-3** (Critical concurrency guard). |
| 3 | Stock Reduction Protection | Requesting stock reduction when assets are rented | `UpdateProductStockService` queries only `AVAILABLE` assets for deletion. If `quantityToRemove > availableAssets.length`, throws 400 `AppError` preventing deletion of rented/reserved gear. | **G-BACK-1.3** (Integrity protection). |
| 4 | Non-existent Enum Reference | `FinishOrderService:34`, `UpdateOrderService:30`, `DeleteOrderService:19` check `order.state === OrderState.TOTAL_LOSS` | `TOTAL_LOSS` exists in `AssetState`, NOT in `OrderState`. Comparing `order.state` against `OrderState.TOTAL_LOSS` evaluates to `undefined`, making this condition a dead-code branch or silent bug. | **G-ARCH-4** (Typing rigor violation). |
| 5 | Error Response Inconsistency | Controller error handling across modules | In `OrderController` (`update`, `delete`) and `ProductController` (all methods), errors are caught in local `try/catch` and returned directly as JSON without calling `next(error)`. In contrast, `KitController` and `DashboardController` delegate to `next(error)`. | **G-BACK-3** (Error handling middleware bypass). |
| 6 | Redundant DB Pool Instantiation | Router initialization in route files | `order.routes.ts`, `product.routes.ts`, `kit.routes.ts`, and `dashboard.routes.ts` each execute `new Pool()` and `new PrismaClient()`. This creates 4 independent connection pools instead of a shared Singleton. | **G-ARCH-2, G-SEC-3** (Design pattern & performance risk). |
| 7 | Route Param Validation Gap | Endpoints with `:id` or `:orderId` (e.g., `GET /api/products/:id`, `DELETE /api/orders/:id`) | Route params are extracted directly from `req.params` without Zod validation for UUID format or string length. | **G-BACK-2** (Input validation rule violation). |
| 8 | Zod Schema Locality | Placement of validation schemas | `order.schema.ts` defines schemas for quote creation and confirmation, but `update` schema is declared inside `order.controller.ts:84`. In `ProductController`, all schemas are inline inside methods. | **G-BACK-2, G-ARCH-1** (Inconsistent schema organization). |
| 9 | Direct DB Injection in Service | `GetDashboardStatsService:5` | Constructor injects `PrismaClient` directly rather than an abstract Repository/DAO, bypassing the repository architectural layer. | **G-BACK-1.4** (Layer separation violation). |
| 10 | Dependency Inversion Inconsistency | Service constructors across domain | `CreateQuoteService` injects repository interfaces (`IOrderRepository`, `IAssetRepository`), whereas `UpdateOrderService`, `DeleteOrderService`, `CreateProductService` inject concrete repository classes. | **G-TEST-1, G-ARCH-2** (Incomplete dependency inversion). |

---

## 7. Downstream Audit Checklist: GEMINI.md Rules vs. Codebase Hotspots

To facilitate immediate execution of Milestone 2 (Codebase Audit & Critique), the following reference matrix links GEMINI.md rules directly to concrete inspection targets in the repository:

```
+---------------------------------------------------------------------------------------------------------+
| RULE ID       | GEMINI.md REQUIREMENT        | AUDIT VERIFICATION TARGET & OBSERVED CODEBASE REALITY   |
+---------------------------------------------------------------------------------------------------------+
| G-ARCH-1      | SOLID & Clean Code           | • src/services/UpdateProductStockService.ts:24-31 (hacky |
|               | (Guard clauses, SRP, no deep |   call to repository.update(id, {}) to fetch assets).    |
|               | nesting, small functions)    | • src/controllers/ProductController.ts (inline schemas & |
|               |                              |   repetitive error catching).                            |
+---------------+------------------------------+----------------------------------------------------------+
| G-ARCH-2      | Design Patterns              | • src/routes/*.routes.ts (4 separate PrismaClient &      |
|               | (Repository, Singleton,      |   pg.Pool instances instead of shared Singleton).        |
|               | avoiding overengineering)    | • Mixed usage of repository interfaces vs concrete repo. |
+---------------+------------------------------+----------------------------------------------------------+
| G-ARCH-3      | Naming Standards             | • Descriptive English names throughout entities/methods. |
|               | (Self-documenting, English)  | • Inconsistent Portuguese error messages in some         |
|               |                              |   services vs English in others.                         |
+---------------+------------------------------+----------------------------------------------------------+
| G-ARCH-4      | Rigorous Typing              | • tsconfig.json has "strict": true.                      |
|               | (Strict TS, no any, safe     | • Check for 'any' casts or implicit undefined enums:    |
|               | unknown narrowing)           |   OrderState.TOTAL_LOSS in FinishOrderService:34.        |
+---------------+------------------------------+----------------------------------------------------------+
| G-BACK-1.1    | Layer: Routes                | • Routes map to controllers, but also instantiate       |
|               | (Map endpoints only)         |   PrismaClient, Pool, and Repositories in file scope.   |
+---------------+------------------------------+----------------------------------------------------------+
| G-BACK-1.2    | Layer: Controllers           | • Controllers mostly delegate, but ProductController     |
|               | (HTTP only, no biz logic)    |   and OrderController.update handle ad-hoc error status. |
+---------------+------------------------------+----------------------------------------------------------+
| G-BACK-1.3    | Layer: Services              | • Business logic well-isolated in Services (e.g. quote   |
|               | (Business rules residence)   |   buffer, deposit validation, race condition check).     |
+---------------+------------------------------+----------------------------------------------------------+
| G-BACK-1.4    | Layer: Repositories          | • VIOLATION: src/services/GetDashboardStatsService.ts    |
|               | (Exclusive DB access)        |   directly receives PrismaClient instead of a Repo.      |
+---------------+------------------------------+----------------------------------------------------------+
| G-BACK-2      | Zod Input Validation         | • Body validation present for POST/PUT.                  |
|               | (Body, Params, Query before  | • VIOLATION: Route params (:id, :orderId) lack Zod       |
|               | reaching services)           |   validation across all routes.                          |
+---------------+------------------------------+----------------------------------------------------------+
| G-BACK-3      | Error Handling               | • Global errorHandler in src/middlewares/                |
|               | (Global middleware, custom   | • VIOLATION: ProductController & OrderController bypass  |
|               | AppError, no stack in prod)  |   next(error) and format responses ad-hoc.               |
+---------------+------------------------------+----------------------------------------------------------+
| G-SEC-1       | Security Middlewares         | • Helmet, CORS, and rateLimit configured in app.ts.      |
|               | (CORS, Helmet, Rate Limit)   | • RateLimit trust proxy set to 1.                        |
+---------------+------------------------------+----------------------------------------------------------+
| G-SEC-2       | Sensitive Data Handling      | • Uses process.env.DATABASE_URL and PORT.                |
|               | (No hardcoded credentials)   | • No hardcoded passwords detected in src.                |
+---------------+------------------------------+----------------------------------------------------------+
| G-SEC-3       | Performance & Queries        | • Pagination implemented in SearchProductsService.       |
|               | (Pagination, query indexes)  | • Database connection pool exhaustion risk due to        |
|               |                              |   multiple Pool instantiations.                          |
+---------------+------------------------------+----------------------------------------------------------+
| G-TEST-1      | Testability & Inversion      | • CreateQuoteService, ConfirmOrderService use DI & mock  |
|               | (Dependency inversion)       | • Other services rely directly on concrete repos.        |
+---------------+------------------------------+----------------------------------------------------------+
| G-TEST-2      | Crucial Unit Tests           | • 10 test files and 38 passing tests in Vitest.          |
|               | (Complex service scenarios)  | • Covers buffer dates, stock insufficiency, confirmation |
+---------------+------------------------------+----------------------------------------------------------+
```

---

## 8. Conclusion

All requirements from `ORIGINAL_REQUEST.md` and `GEMINI.md` have been mined, cataloged, cross-referenced with the codebase, and prepared for downstream milestones:
- **Milestone 1** has a clear blueprint and rigorous criteria for generating comprehensive architectural documentation and valid Mermaid diagrams.
- **Milestone 2** is provided with an exhaustive, ready-to-use audit checklist citing specific GEMINI.md rules alongside concrete file paths and line numbers.
- **Milestone 3 & Sentinel Verification** can independently evaluate deliverables against these exact acceptance criteria.
