import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Database, getDatabase } from '../../src/lib/db.client.js';

vi.mock('pg', () => {
  const mockClient = {
    query: vi.fn(),
    release: vi.fn()
  };
  
  const mockPool = {
    connect: vi.fn(() => Promise.resolve(mockClient)),
    end: vi.fn(() => Promise.resolve()),
    on: vi.fn()
  };
  
  return {
    Pool: vi.fn(() => mockPool),
    default: {
      Pool: vi.fn(() => mockPool)
    }
  };
});

vi.mock('../../src/lib/environment.js', () => ({
  environment: vi.fn(() => ({
    connectionString: 'postgres://test:test@localhost/test_db'
  }))
}));

describe('Database', () => {
  let db;
  let mockLogger;
  
  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn()
    };
    
    db = new Database('postgres://test:test@localhost/test_db', mockLogger);
  });
  
  describe('open', () => {
    it('should create a new pool', () => {
      db.open();
      expect(db.pool).not.toBeNull();
    });
  });
  
  describe('close', () => {
    it('should return false if pool is not open', async () => {
      db.pool = null;
      const result = await db.close();
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
    
    it('should close the pool and return true', async () => {
      db.open();
      const result = await db.close();
      expect(result).toBe(true);
      expect(db.pool).toBeNull();
    });
  });
  
  describe('connect', () => {
    it('should return null if pool is not open', async () => {
      db.pool = null;
      const client = await db.connect();
      expect(client).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
    });
    
    it('should return a client when pool is open', async () => {
      db.open();
      const client = await db.connect();
      expect(client).not.toBeNull();
    });
  });
  
  describe('query', () => {
    it('should execute a query and return results', async () => {
      const expectedResult = { rows: [{ id: 1, name: 'test' }] };
      db.open();
      const mockClient = await db.connect();
      mockClient.query.mockResolvedValue(expectedResult);
      
      const result = await db.query('SELECT * FROM test');
      
      expect(result).toEqual(expectedResult);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM test', []);
      expect(mockClient.release).toHaveBeenCalled();
    });
    
    it('should return null if connect fails', async () => {
      vi.spyOn(db, 'connect').mockResolvedValue(null);
      
      const result = await db.query('SELECT * FROM test');
      
      expect(result).toBeNull();
    });
  });
});

describe('getDatabase', () => {
  it('should return a singleton database instance', () => {
    const db1 = getDatabase();
    const db2 = getDatabase();
    
    expect(db1).toBeInstanceOf(Database);
    expect(db1).toBe(db2);
  });
});
