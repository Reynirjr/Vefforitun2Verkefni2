import { Database, getDatabase } from '../../src/lib/db.client';
import pg from 'pg';
import { environment } from '../../src/lib/environment';
import { logger as loggerSingleton } from '../../src/lib/logger';

jest.mock('pg');
jest.mock('../../src/lib/environment');
jest.mock('../../src/lib/logger');

describe('Database', () => {
  let db;
  let mockPool;
  let mockClient;
  let mockLogger;

  beforeEach(() => {
    mockPool = {
      connect: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    };
    pg.Pool.mockImplementation(() => mockPool);

    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    mockPool.connect.mockResolvedValue(mockClient);

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };
    loggerSingleton.info = mockLogger.info;
    loggerSingleton.error = mockLogger.error;

    environment.mockReturnValue({ connectionString: 'test_connection_string' });

    db = new Database('test_connection_string', mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new pool on open', () => {
    db.open();
    expect(pg.Pool).toHaveBeenCalledWith({ connectionString: 'test_connection_string' });
    expect(mockPool.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should close the pool', async () => {
    db.open();
    await db.close();
    expect(mockPool.end).toHaveBeenCalled();
    expect(db.pool).toBeNull();
  });

  it('should handle error when closing pool', async () => {
    db.open();
    mockPool.end.mockRejectedValue(new Error('Test error'));
    await db.close();
    expect(mockLogger.error).toHaveBeenCalledWith('error closing database pool', { error: new Error('Test error') });
    expect(db.pool).toBeNull();
  });

  it('should connect to the database', async () => {
    db.open();
    const client = await db.connect();
    expect(mockPool.connect).toHaveBeenCalled();
    expect(client).toBe(mockClient);
  });

  it('should handle error when connecting to the database', async () => {
    db.open();
    mockPool.connect.mockRejectedValue(new Error('Test error'));
    const client = await db.connect();
    expect(mockLogger.error).toHaveBeenCalledWith('error connecting to db', { error: new Error('Test error') });
    expect(client).toBeNull();
  });

  it('should execute a query', async () => {
    db.open();
    mockClient.query.mockResolvedValue('test result');
    const result = await db.query('test query', ['test value']);
    expect(mockClient.query).toHaveBeenCalledWith('test query', ['test value']);
    expect(result).toBe('test result');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should handle error when executing a query', async () => {
    db.open();
    mockClient.query.mockRejectedValue(new Error('Test error'));
    const result = await db.query('test query', ['test value']);
    expect(mockLogger.error).toHaveBeenCalledWith('Error running query', new Error('Test error'));
    expect(result).toBeNull();
    expect(mockClient.release).toHaveBeenCalled();
  });
});

describe('getDatabase', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the existing database instance', () => {
    const db1 = getDatabase();
    const db2 = getDatabase();
    expect(db1).toBe(db2);
  });

  it('should create a new database instance if one does not exist', () => {
    environment.mockReturnValue({ connectionString: 'test_connection_string' });
    const db = getDatabase();
    expect(db).toBeInstanceOf(Database);
  });

  it('should return null if environment is not valid', () => {
    environment.mockReturnValue(null);
    const db = getDatabase();
    expect(db).toBeNull();
  });
});
