import { vi } from 'vitest';

/**
 * Creates an express request mock object
 * @param {object} options - Request options
 * @returns {object} - Mocked request object
 */
export function createMockRequest(options = {}) {
  return {
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    ...options
  };
}

/**
 * Creates an express response mock object with spy methods
 * @returns {object} - Mocked response object with spy methods
 */
export function createMockResponse() {
  const res = {
    render: vi.fn(),
    json: vi.fn(),
    status: vi.fn(),
    send: vi.fn(),
    redirect: vi.fn(),
    locals: {},
    cookie: vi.fn(),
    clearCookie: vi.fn()
  };
  
  // Make methods chainable
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  res.send.mockReturnValue(res);
  
  return res;
}

/**
 * Runs a route handler in a controlled environment for testing
 * @param {Function} handler - The route handler to test
 * @param {object} req - Mock request object
 * @param {object} res - Mock response object
 * @returns {Promise<Error|null>} - Returns error if one was passed to next
 */
export async function runRouteHandler(handler, req, res) {
  let capturedError = null;
  const next = vi.fn(err => {
    if (err) capturedError = err;
  });
  
  try {
    await handler(req, res, next);
    return capturedError;
  } catch (err) {
    return err;
  }
}

/**
 * Print a debug representation of the router stack
 * @param {object} router - Express router
 */
export function debugRouterStack(router) {
  console.log('======= ROUTER ROUTES =======');
  router.stack.forEach((layer, index) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods)
        .filter(method => layer.route.methods[method])
        .join(',');
      console.log(`${index}: ${methods.toUpperCase()} ${layer.route.path}`);
    } else if (layer.name === 'router') {
      console.log(`${index}: ROUTER MIDDLEWARE`);
    } else {
      console.log(`${index}: MIDDLEWARE ${layer.name || 'anonymous'}`);
    }
  });
  console.log('============================');
}
