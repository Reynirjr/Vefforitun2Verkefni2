import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as envModule from '../../src/lib/environment.js';

describe('environment', () => {
  let mockLogger;
  
  beforeEach(() => {
    mockLogger = {
      error: vi.fn(),
      info: vi.fn()
    };
    
    vi.resetModules();
  });

  it('should return environment when all variables are present', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@localhost/db',
      PORT: '3000'
    };

    const result = envModule.environment(env, mockLogger);
    
    expect(result).toEqual({
      connectionString: 'postgresql://user:pass@localhost/db',
      port: 3000
    });
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('should return null if DATABASE_URL is missing', () => {
    const env = {
      PORT: '3000'
    };

    const result = envModule.environment(env, mockLogger);
    
    expect(result).toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('DATABASE_URL')
    );
  });

  it('should use default port if PORT is missing', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@localhost/db'
    };

    const result = envModule.environment(env, mockLogger);
    
    expect(result).toEqual({
      connectionString: 'postgresql://user:pass@localhost/db',
      port: 3000
    });
  });
});
