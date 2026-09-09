# Project: Backend Architecture Documentation and GEMINI.md Codebase Audit

## Architecture
- **System Overview**: Node.js, Express 5, TypeScript, Prisma 7, PostgreSQL backend for an audiovisual / camera equipment rental and inventory management system.
- **Layers**:
  - Presentation Layer: `src/routes/` and `src/controllers/`
  - Domain / Business Logic Layer: `src/services/` and `src/domain/`
  - Persistence Layer: `src/repositories/` and `prisma/schema.prisma`
  - Cross-Cutting Concerns: `src/middlewares/`, `src/errors/`, `src/schemas/`
- **Interfaces**:
  - Centralized Database Provider (`prismaSingleton`)
  - Repository interfaces (`IOrderRepository`, `IProductRepository`, `IAssetRepository`, `IKitRepository`, `IDashboardRepository`)
  - Centralized Error Handling (`AppError`, `errorHandler`)
  - Centralized Input Validation (`order.schema.ts`, `product.schema.ts`, `kit.schema.ts`, `params.schema.ts`)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | R1.1 System Architecture Documentation | Comprehensive breakdown of backend layers, components, technologies, and lifecycle | M1 | ORIGINAL_REQUEST.md §R1 |
| 2 | R1.2 System Topology Mermaid Diagram | Valid Mermaid diagram visualizing system components, layers, and database interactions | M1 | ORIGINAL_REQUEST.md Acceptance Criteria |
| 3 | R1.3 Data Flow Sequence Mermaid Diagram | Valid Mermaid diagram visualizing end-to-end request-response cycle and database interaction | M1 | ORIGINAL_REQUEST.md Acceptance Criteria |
| 4 | R1.4 State Machine & Concurrency Documentation | Detailed description and diagrams of Order/Asset states, cleaning buffer, and race condition prevention | M1 | Survey Reports |
| 5 | R2.1 GEMINI.md Guideline Taxonomy | Explicit citation and analysis of at least 3 (targeting all 18) guidelines across 8 sections in GEMINI.md | M2 | ORIGINAL_REQUEST.md §R2, GEMINI.md |
| 6 | R2.2 Deviation Inventory with File Citations | Detailed audit of all architectural deviations with exact file path citations, line numbers, and issue explanations | M2 | ORIGINAL_REQUEST.md Acceptance Criteria |
| 7 | R2.3 Concrete Improvement Suggestions | Actionable remediation steps, code diffs, and architectural refactorings for every identified deviation | M2 | ORIGINAL_REQUEST.md §R2 |
| 8 | R3.1 Acceptance Criteria Verification | Reviewer, Challenger, and Auditor verification confirming zero Mermaid syntax errors, >=3 GEMINI.md rules cited, exact file citations present | M3 | ORIGINAL_REQUEST.md Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Architecture Documentation & Mermaid Diagrams | Comprehensive architecture document with >=2 valid Mermaid diagrams (System Topology, Data Flow Sequence, State Transition) written to `/home/workspace/backend-boilerplate/ARCHITECTURE.md` | Survey | IN_PROGRESS |
| 2 | M2: Codebase Audit & Critique against GEMINI.md | Rigorous audit against GEMINI.md guidelines with exact file citations, issue explanations, and concrete code suggestions | M1 | PLANNED |
| 3 | M3: Verification, Adversarial Challenge & Forensic Audit | Reviewer verification of document, Challenger verification of Mermaid syntax rendering, Forensic Auditor integrity check | M1, M2 | PLANNED |

## Interface Contracts
### Deliverable Contract: `/home/workspace/backend-boilerplate/ARCHITECTURE.md`
- **Part 1: Architectural Documentation**:
  - Executive Overview & Tech Stack
  - System Topology Diagram (Mermaid `graph TD`)
  - Layer-by-Layer Breakdown (Presentation, Domain/Services, Persistence/Repositories, Cross-Cutting)
  - End-to-End Request Data Flow (Mermaid `sequenceDiagram`)
  - Concurrency Handling & Reservation Logic (Cleaning buffer, race condition checks)
  - State Machine Lifecycle Models (Mermaid `stateDiagram-v2` for OrderState and AssetState)
- **Part 2: Codebase Audit & Critique against GEMINI.md**:
  - GEMINI.md Guidelines Taxonomy (Explicitly referencing SOLID & Clean Code, Separation of Responsibilities, Zod Validation, Error Handling, Rigorous Typing, Security & Performance, Testing & Quality)
  - Full Deviation Catalog (Exact file path citations, line numbers, rule violated, explanation, severity)
  - Concrete Refactoring Suggestions & Actionable Code Diffs
  - Prioritized Remediation Roadmap

## Code Layout
- Documentation Artifact: `/home/workspace/backend-boilerplate/ARCHITECTURE.md`
- Audit Artifact (Mirror / Standalone Reference): `/home/workspace/backend-boilerplate/AUDIT.md`
- Agent Workspace: `/home/workspace/backend-boilerplate/.agents/`

