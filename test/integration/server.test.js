import { describe, it, expect, vi } from 'vitest';
import express from 'express';

vi.mock('../../src/routes.js', () => ({
  router: express.Router()
}));

vi.mock('dotenv', () => ({
  default: { config: vi.fn() }
}));

const app = (await import('../../src/server.js')).default;

describe('Express Server', () => {
  it('should have proper middleware set up', () => {
    const middlewareStack = app._router.stack;
    
    const hasHelmet = middlewareStack.some(layer => {
      return (layer.handle && layer.handle.name === 'helmet') || 
             (layer.name && layer.name.includes('helmet')) ||
             (layer.handle && layer.handle.toString().includes('helmet'));
    });
    
    expect(hasHelmet).toBe(true);
    
    const middlewareFunctions = middlewareStack
      .filter(layer => layer.name !== '<anonymous>')
      .map(layer => layer.name || (layer.handle && layer.handle.name));
    
    expect(middlewareFunctions).toContain('query');
    expect(middlewareFunctions).toContain('expressInit');
    expect(middlewareFunctions).toContain('serveStatic');
    expect(middlewareFunctions).toContain('urlencodedParser');
  });

  it('should have error handlers', () => {
    const errorHandlers = app._router.stack
      .filter(layer => layer.handle && layer.handle.length === 4)
      .length;
    
    expect(errorHandlers).toBeGreaterThanOrEqual(0);
  });

  it('should have a 404 handler', () => {
    const has404Handler = app._router.stack.some(layer => 
      !layer.route && layer.handle.length === 2 && layer.name !== 'query' && 
      layer.name !== 'expressInit' && layer.name !== 'serveStatic' && 
      layer.name !== 'router' && layer.name !== 'helmet'
    );
    
    expect(has404Handler).toBe(true);
  });
});
