# API Documentation

This document provides comprehensive documentation for all available endpoints in the backend application.

## Healthcheck Endpoint

### GET /health
Check the server status and uptime.

**Response:**
```json
{
  "status": "OK",
  "uptime": 123.45
}
```

## Users Endpoint

### POST /api/users
Create a new user with validation.

**Request Body:**
```json
{
  "name": "string (min 3 characters)",
  "email": "valid email address",
  "age": "number (optional)"
}
```

**Response:**
```json
{
  "message": "Usuário criado com sucesso!",
  "data": {
    "name": "string",
    "email": "string",
    "age": "number"
  }
}
```

**Error Responses:**
- 400 Bad Request: Validation failed
- 500 Internal Server Error: Server error

## Products Endpoint

### GET /api/products
Retrieve all products.

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "price": "number"
  }
]
```

### POST /api/products
Create a new product.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "price": "number"
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "price": "number"
}
```

## Orders Endpoint

### GET /api/orders
Retrieve all orders.

**Response:**
```json
[
  {
    "id": "string",
    "customerId": "string",
    "pickUpDate": "date string",
    "returnDate": "date string",
    "state": "string (enum)",
    "totalAmount": "number"
  }
]
```

### POST /api/orders/quote
Create a quote for an order.

**Request Body:**
```json
{
  "customerId": "string",
  "assetIds": ["string"],
  "pickUpDate": "date string",
  "returnDate": "date string"
}
```

**Response:**
```json
{
  "id": "string",
  "customerId": "string",
  "pickUpDate": "date string",
  "returnDate": "date string",
  "state": "DRAFT",
  "totalAmount": "number"
}
```

### POST /api/orders/:orderId/confirm
Confirm an order with payment.

**Request Body:**
```json
{
  "paymentAmount": "number"
}
```

**Response:**
```json
{
  "id": "string",
  "customerId": "string",
  "pickUpDate": "date string",
  "returnDate": "date string",
  "state": "RESERVED",
  "totalAmount": "number"
}
```

## Validation Schemas

All endpoints use Zod for validation. The schemas ensure data integrity and provide meaningful error messages.

### User Schema
```typescript
const userSchema = z.object({
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  age: z.number().int().positive().optional(),
});
```

### Product Schema
```typescript
const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive()
});
```

### Order Schema
```typescript
const orderSchema = z.object({
  customerId: z.string().min(1),
  assetIds: z.array(z.string().min(1)),
  pickUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
```

## Error Handling

All errors are handled centrally with specific error codes:
- 400: Bad Request (validation errors)
- 404: Not Found
- 409: Conflict (resource conflict)
- 500: Internal Server Error