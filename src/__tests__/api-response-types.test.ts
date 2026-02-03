import { describe, it, expect } from 'vitest';
import type { ApiSuccessResponse, ApiErrorResponse, ApiResponse } from '../types/api';
import { isSuccessResponse, isErrorResponse } from '../types/api';

describe('API Response Types', () => {
  describe('ApiSuccessResponse', () => {
    it('should allow success response with data', () => {
      const response: ApiSuccessResponse<{ id: string }> = {
        status: 'success',
        data: { id: '123' },
      };

      expect(response.status).toBe('success');
      expect(response.data.id).toBe('123');
    });

    it('should allow success response with optional meta', () => {
      const response: ApiSuccessResponse<string> = {
        status: 'success',
        data: 'test',
        meta: {
          timestamp: '2026-02-03T10:00:00Z',
          requestId: 'req-123',
          version: 'v1',
        },
      };

      expect(response.meta?.timestamp).toBeDefined();
      expect(response.meta?.requestId).toBe('req-123');
    });

    it('should allow custom meta fields', () => {
      const response: ApiSuccessResponse<number> = {
        status: 'success',
        data: 42,
        meta: {
          customField: 'custom value',
        },
      };

      expect(response.meta?.customField).toBe('custom value');
    });
  });

  describe('ApiErrorResponse', () => {
    it('should allow error response with code and message', () => {
      const response: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      };

      expect(response.status).toBe('error');
      expect(response.error.code).toBe('NOT_FOUND');
      expect(response.error.message).toBe('Resource not found');
    });

    it('should allow error response with details', () => {
      const response: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong',
          details: { stack: 'error stack trace' },
        },
      };

      expect(response.error.details).toBeDefined();
    });

    it('should allow error response with field validation errors', () => {
      const response: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          fields: {
            email: ['Invalid format', 'Required field'],
            password: ['Too short'],
          },
        },
      };

      expect(response.error.fields?.email).toHaveLength(2);
      expect(response.error.fields?.password).toHaveLength(1);
    });

    it('should allow error response with meta', () => {
      const response: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
        meta: {
          timestamp: '2026-02-03T10:00:00Z',
          requestId: 'req-456',
        },
      };

      expect(response.meta?.requestId).toBe('req-456');
    });
  });

  describe('Type Guards', () => {
    it('isSuccessResponse should identify success responses', () => {
      const response: ApiResponse<string> = {
        status: 'success',
        data: 'test',
      };

      expect(isSuccessResponse(response)).toBe(true);
      expect(isErrorResponse(response)).toBe(false);

      if (isSuccessResponse(response)) {
        // TypeScript should narrow the type here
        expect(response.data).toBe('test');
      }
    });

    it('isErrorResponse should identify error responses', () => {
      const response: ApiResponse<string> = {
        status: 'error',
        error: {
          code: 'ERROR',
          message: 'Error message',
        },
      };

      expect(isErrorResponse(response)).toBe(true);
      expect(isSuccessResponse(response)).toBe(false);

      if (isErrorResponse(response)) {
        // TypeScript should narrow the type here
        expect(response.error.code).toBe('ERROR');
      }
    });

    it('should enable exhaustive type narrowing', () => {
      function handleResponse(response: ApiResponse<number>): number | string {
        if (isSuccessResponse(response)) {
          return response.data;
        } else {
          return response.error.message;
        }
      }

      const successResponse: ApiResponse<number> = {
        status: 'success',
        data: 123,
      };

      const errorResponse: ApiResponse<number> = {
        status: 'error',
        error: {
          code: 'ERROR',
          message: 'Error message',
        },
      };

      expect(handleResponse(successResponse)).toBe(123);
      expect(handleResponse(errorResponse)).toBe('Error message');
    });
  });

  describe('Generic Type Parameter', () => {
    interface User {
      id: string;
      name: string;
      email: string;
    }

    it('should work with complex generic types', () => {
      const response: ApiSuccessResponse<User> = {
        status: 'success',
        data: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      expect(response.data.id).toBe('user-123');
      expect(response.data.name).toBe('John Doe');
      expect(response.data.email).toBe('john@example.com');
    });

    it('should work with array types', () => {
      const response: ApiSuccessResponse<User[]> = {
        status: 'success',
        data: [
          { id: '1', name: 'User 1', email: 'user1@example.com' },
          { id: '2', name: 'User 2', email: 'user2@example.com' },
        ],
      };

      expect(response.data).toHaveLength(2);
      expect(response.data[0].id).toBe('1');
    });
  });
});
