import { vi } from 'vitest';

export function createMockRequest(options = {}) {
  return {
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    ...options
  };
}

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
  
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  res.send.mockReturnValue(res);
  
  return res;
}

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
