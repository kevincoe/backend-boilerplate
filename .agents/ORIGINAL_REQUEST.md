# Original User Request

## 2026-09-08T21:29:07-03:00

<USER_REQUEST>
Perform a comprehensive deep-dive analysis of the existing backend project to understand every aspect of its architecture. The goal is to produce a detailed breakdown of its structure, patterns, and current state.

Working directory: /home/workspace/backend-boilerplate
Integrity mode: development

## Requirements

### R1. Architectural Documentation
Produce a comprehensive Markdown document describing the backend architecture. Include Mermaid diagrams to visualize data flows, component interactions, and system structure.

### R2. Codebase Audit and Critique
Evaluate the current implementation against the project's GEMINI.md guidelines (e.g., SOLID principles, Clean Code, Zod validation, proper separation of layers). Clearly highlight areas that deviate from these standards and suggest concrete improvements.

## Acceptance Criteria

### Documentation Quality
- [ ] The document contains at least two Mermaid diagrams (e.g., Data Flow and System Architecture).
- [ ] All Mermaid diagrams render correctly without syntax errors.

### Audit Rigor
- [ ] The audit explicitly references at least three specific guidelines from the GEMINI.md file.
- [ ] Every identified architectural deviation includes an exact file path citation and a brief explanation of the issue.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-09-08T21:29:07-03:00.
</ADDITIONAL_METADATA>

## 2026-09-08T22:37:22-03:00

<USER_REQUEST>
Evolve the backend system into a full CRM (Customer Relationship Management) platform. Standardize the codebase by addressing the deviations identified in AUDIT.md. Implement core CRM capabilities, specifically a 'Client 360' view and an advanced items/kits rental process based on industry best practices. Ensure all changes and new functionalities are thoroughly documented.

Working directory: /home/workspace/backend-boilerplate
Integrity mode: development

## Requirements

### R1. Architectural Standardization
Refactor the existing codebase to resolve all architectural deviations identified in the `AUDIT.md` report. Ensure strict adherence to the rules in `GEMINI.md` (SOLID, Clean Code, Zod validation, proper layering).

### R2. Client 360 API (Core)
Implement the database schema and REST APIs for a Core Client 360 view. This includes endpoints to manage Clients, Contacts, and an Interaction/Activity History log.

### R3. Advanced Rental Process API
Implement the database schema and REST APIs for an advanced rental lifecycle. This must support items, composite kits, inventory management, quotes, pricing/discount rules, check-in/check-out booking, and damage tracking.

### R4. Documentation
Provide thorough Markdown documentation for all new database schemas, API endpoints, and architectural changes made during this project.

## Acceptance Criteria

### Build & Existing Tests
- [ ] Running `npm run build` completes successfully with exit code 0.
- [ ] Running `npm run test` executes successfully and all tests pass without errors.

### New API Verification
- [ ] Automated tests exist for the new Client 360 endpoints and they pass successfully.
- [ ] Automated tests exist for the advanced rental lifecycle (including creating a quote/booking) and they pass successfully.

### Documentation Quality
- [ ] A Markdown document is generated containing the updated database schemas and a list of all newly created API routes.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-09-08T22:37:22-03:00.
</ADDITIONAL_METADATA>
