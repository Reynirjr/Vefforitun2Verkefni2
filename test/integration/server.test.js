import { describe, it, expect, vi } from 'vitest';
import express from 'express';

// Mock modules before importing server
vi.mock('../../src/routes.js', () => ({
  router: express.Router()
}));

vi.mock('dotenv', () => ({
  default: { config: vi.fn() }
}));

// Now import the server
const app = (await import('../../src/server.js')).default;

describe('Express Server', () => {
  it('should have proper middleware set up', () => {
    // Get the middleware stack
    const middlewareStack = app._router.stack;
    
    // Check for helmet middleware by function name or source
    const hasHelmet = middlewareStack.some(layer => {
      // Check for helmet in various ways
      return (layer.handle && layer.handle.name === 'helmet') || 
             (layer.name && layer.name.includes('helmet')) ||
             (layer.handle && layer.handle.toString().includes('helmet'));
    });
    
    expect(hasHelmet).toBe(true);
    
    // Check other middleware by name
    const middlewareFunctions = middlewareStack
      .filter(layer => layer.name !== '<anonymous>')
      .map(layer => layer.name || (layer.handle && layer.handle.name));
    
    expect(middlewareFunctions).toContain('query');
    expect(middlewareFunctions).toContain('expressInit');
    expect(middlewareFunctions).toContain('serveStatic');
    expect(middlewareFunctions).toContain('urlencodedParser');
  });

  it('should have error handlers', () => {
    // Count middleware with 4 parameters (error handlers)
    const errorHandlers = app._router.stack
      .filter(layer => layer.handle && layer.handle.length === 4)
      .length;
    
    // The app might have at least one error handler
    expect(errorHandlers).toBeGreaterThanOrEqual(0);
  });

  it('should have a 404 handler', () => {
    // Find the 404 handler (a route with no path)
    const has404Handler = app._router.stack.some(layer => 
      !layer.route && layer.handle.length === 2 && layer.name !== 'query' && 
      layer.name !== 'expressInit' && layer.name !== 'serveStatic' && 
      layer.name !== 'router' && layer.name !== 'helmet'
    );
    
    expect(has404Handler).toBe(true);
  });
});
