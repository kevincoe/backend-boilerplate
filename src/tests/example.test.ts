import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { AppError } from '../errors/AppError';

// Test Zod validation schemas
describe('Zod Validation Schemas', () => {
  it('should validate user data correctly', () => {
    const userSchema = z.object({
      name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
      email: z.string().email("Email inválido"),
      age: z.number().int().positive().optional(),
    });

    // Valid data
    const validData = {
      name: "John Doe",
      email: "john@example.com",
      age: 30
    };

    expect(() => userSchema.parse(validData)).not.toThrow();

    // Invalid data - name too short
    const invalidData = {
      name: "Jo",
      email: "john@example.com"
    };

    expect(() => userSchema.parse(invalidData)).toThrow(z.ZodError);
  });

  it('should handle validation errors properly', () => {
    const userSchema = z.object({
      name: z.string().min(3),
      email: z.string().email(),
    });

    try {
      userSchema.parse({ name: "Jo", email: "invalid-email" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        expect(error.issues).toHaveLength(2);
        expect(error.issues[0].path).toEqual(['name']);
        expect(error.issues[1].path).toEqual(['email']);
      }
    }
  });
});

// Test custom error handling
describe('AppError', () => {
  it('should create an AppError with correct status code', () => {
    const error = new AppError('Test error message', 404);
    expect(error.message).toBe('Test error message');
    expect(error.statusCode).toBe(404);
  });

  it('should default to status code 400 if not provided', () => {
    const error = new AppError('Test error message');
    expect(error.statusCode).toBe(400);
  });
});

// Test basic functionality
describe('Basic Functionality Tests', () => {
  it('should demonstrate how tests work', () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });
});