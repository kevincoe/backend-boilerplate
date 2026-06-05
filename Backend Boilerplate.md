# Backend Boilerplate

A modern, robust, and scalable backend boilerplate built with **Node.js**, **Express**, and **TypeScript**. This boilerplate is structured following Clean Code principles, SOLID guidelines, and a layered architecture to ensure maintainability and scalability.

## 🚀 Technologies & Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript
- **Validation:** Zod
- **Development & Build:** `tsx` (watch mode) & `tsup`
- **Testing:** Vitest
- **Code Quality:** ESLint & Prettier
- **Security:** Helmet & CORS

## 📦 Getting Started

### Prerequisites

Make sure you have Node.js and `npm` installed.

### Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### Running the Application

- **Development Mode** (with hot reload):
  ```bash
  npm run dev
  ```
  *The server will start on `http://localhost:3333` (or the port defined in your `.env` file).*

- **Build for Production:**
  ```bash
  npm run build
  ```

- **Start Production Server:**
  ```bash
  npm run start
  ```

### Code Quality & Testing

- **Lint the code:**
  ```bash
  npm run lint
  ```
- **Format the code:**
  ```bash
  npm run format
  ```
- **Run Tests:**
  ```bash
  npm run test
  ```

## 📐 Architecture & Guidelines

This project strictly adheres to a layered architecture approach to separate concerns effectively:

- **Routes:** Maps incoming HTTP requests to their respective controllers.
- **Controllers:** Handles HTTP requests and responses only.
- **Services (Use Cases):** Contains the core business logic.
- **Repositories (DAOs):** The only layer allowed to interact with the database.

### Key Principles
- **Validation:** All incoming data (Body, Params, Query) must be validated using **Zod** before hitting the Service layer.
- **Error Handling:** Errors are managed centrally. Never expose sensitive stack traces in production.
- **TypeScript:** Strict mode is enabled. Use of `any` is highly discouraged; prefer `unknown` with safe assertions.
- **Clean Code:** Prioritize single responsibility, descriptive naming in English, and avoid deep nesting (use Early Returns).

## 📡 Available Endpoints (Examples)

- `GET /health` - Healthcheck endpoint to verify server status and uptime.
- `POST /api/users` - Example endpoint demonstrating payload validation using Zod.

## 📝 Environment Variables

Create a `.env` file in the root directory. You can set the following variables:

```env
PORT=3333
```
