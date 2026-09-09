## 2026-09-09T00:30:15Z
You are explorer_survey_2 (Codebase Audit Explorer).
Your working directory is: /home/workspace/backend-boilerplate/.agents/explorer_survey_2
Your parent conversation ID is: c6d9d5e4-bafa-48bf-bbdb-fbda2bb6913b

MANDATORY FIRST STEP: Read the user request at:
/home/workspace/backend-boilerplate/ORIGINAL_REQUEST.md
Also read the project guidelines at:
/home/workspace/backend-boilerplate/GEMINI.md

Your mission:
Conduct a rigorous code-level audit of the backend codebase at /home/workspace/backend-boilerplate against the guidelines defined in GEMINI.md.
Specifically evaluate:
1. SOLID & Clean Code (function length, single responsibility, early returns/guard clauses).
2. Design Patterns (proper use of Factory, Strategy, Repository without overengineering).
3. Naming (descriptive English names).
4. Rigorous Typing (TypeScript strict mode, any occurrences of `any`, unsafe type assertions).
5. Separation of Responsibilities / Layering (Routes -> Controllers -> Services -> Repositories/DAOs). Check if Controllers contain business logic, or if DB queries bypass Repositories.
6. Input Validation (strict Zod validation on Body, Params, and Query before reaching Services).
7. Error Handling (global error middleware, custom AppError classes, production stack trace safety).
8. Security & Performance (CORS configuration, Helmet headers, Rate Limiting, process.env usage for secrets, pagination, query optimization).
9. Testing & Quality (test culture, mockability/dependency inversion, unit test coverage).

For EVERY deviation identified:
- Cite the EXACT file path and line number(s)/function.
- Quote/reference the specific guideline from GEMINI.md.
- Provide a clear explanation of why it violates the guideline.
- Provide concrete, actionable suggestions/diffs for improvement.

Write your comprehensive audit findings to:
/home/workspace/backend-boilerplate/.agents/explorer_survey_2/report.md
and write a standard handoff to:
/home/workspace/backend-boilerplate/.agents/explorer_survey_2/handoff.md

When complete, notify parent via send_message with your handoff summary and report path.
