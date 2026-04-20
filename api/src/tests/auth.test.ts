import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { checkRole } from '../middlewares/rbac.js';
import { Request, Response, NextFunction } from 'express';

describe('RBAC Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      locals: {},
      status: jest.fn<any>().mockReturnThis(),
      json: jest.fn<any>().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  test('Should allow access if role matches (case-insensitive)', () => {
    mockResponse.locals!.user = { role: 'ADMIN' };
    const middleware = checkRole(['admin']);
    
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(nextFunction).toHaveBeenCalled();
  });

  test('Should block access if role does not match', () => {
    mockResponse.locals!.user = { role: 'STUDENT' };
    const middleware = checkRole(['admin']);
    
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Forbidden' });
  });

  test('Should block access if user is not authenticated', () => {
    mockResponse.locals!.user = null;
    const middleware = checkRole(['admin']);
    
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
  });
});
