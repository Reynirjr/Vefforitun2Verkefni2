import * as db from '../../src/lib/db';
import pg from 'pg';

jest.mock('pg');

describe('db', () => {
  let mockPool;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      end: jest.fn(),
      on: jest.fn(),
    };

    pg.Pool.mockImplementation(() => mockPool);
    process.env.DATABASE_URL = 'test_url';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.DATABASE_URL;
  });

  describe('categoriesFromDatabase', () => {
    it('should return categories if query is successful', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 1, name: 'Category 1' }] });
      const categories = await db.categoriesFromDatabase();
      expect(categories).toEqual([{ id: 1, name: 'Category 1' }]);
    });

    it('should return null if query returns no rows', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 0, rows: [] });
      const categories = await db.categoriesFromDatabase();
      expect(categories).toBeNull();
    });
  });

  describe('query', () => {
    it('should execute query and return result', async () => {
      const mockResult = { rows: [{ id: 1, name: 'Test' }] };
      mockClient.query.mockResolvedValue(mockResult);
      const result = await db.query('SELECT * FROM test');
      expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM test');
      expect(result).toEqual(mockResult);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle connection error', async () => {
      mockPool.connect.mockRejectedValue(new Error('Connection error'));
      const result = await db.query('SELECT * FROM test');
      expect(result).toBeUndefined();
    });

    it('should handle query error', async () => {
      mockClient.query.mockRejectedValue(new Error('Query error'));
      const result = await db.query('SELECT * FROM test');
      expect(result).toBeUndefined();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
