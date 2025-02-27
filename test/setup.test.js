import { readFile } from 'node:fs/promises';
import { Database } from '../src/lib/db.client.js';
import { logger as loggerSingleton } from '../src/lib/logger.js';
import dotenv from 'dotenv';
import { environment } from '../src/lib/environment.js';
import { create } from '../src/setup.js';

jest.mock('node:fs/promises');
jest.mock('../src/lib/db.client.js');
jest.mock('../src/lib/logger.js');
jest.mock('dotenv');
jest.mock('../src/lib/environment.js');

describe('setup', () => {
  let mockDb;
  let mockLogger;
  let mockEnv;

  beforeEach(() => {
    mockDb = {
      query: jest.fn().mockResolvedValue(true),
      open: jest.fn(),
      close: jest.fn(),
    };
    Database.mockImplementation(() => mockDb);

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };
    loggerSingleton.info = mockLogger.info;
    loggerSingleton.error = mockLogger.error;

    mockEnv = {
      connectionString: 'test_connection_string',
    };
    environment.mockReturnValue(mockEnv);

    readFile.mockResolvedValue({ toString: () => 'mock sql script' });
    dotenv.config.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should setup the database successfully', async () => {
    await create();

    expect(dotenv.config).toHaveBeenCalled();
    expect(environment).toHaveBeenCalledWith(process.env, loggerSingleton);
    expect(Database).toHaveBeenCalledWith(mockEnv.connectionString, loggerSingleton);
    expect(mockDb.open).toHaveBeenCalled();
    expect(readFile).toHaveBeenCalledTimes(3);
    expect(mockDb.query).toHaveBeenCalledTimes(3);
    expect(mockLogger.info).toHaveBeenCalledWith('schema dropped');
    expect(mockLogger.info).toHaveBeenCalledWith('schema created');
    expect(mockLogger.info).toHaveBeenCalledWith('data inserted');
    expect(mockLogger.info).toHaveBeenCalledWith('setup complete');
    expect(mockDb.close).toHaveBeenCalled();
  });

  it('should handle database setup failure', async () => {
    mockDb.query.mockRejectedValue(new Error('DB error'));

    await create().catch(() => {});

    expect(mockLogger.info).not.toHaveBeenCalledWith('schema dropped');
    expect(mockLogger.info).not.toHaveBeenCalledWith('schema created');
    expect(mockLogger.info).not.toHaveBeenCalledWith('data inserted');
    expect(mockDb.close).toHaveBeenCalled();
  });

  it('should exit if environment is not valid', async () => {
    environment.mockReturnValue(null);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await create().catch(() => {});

    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });

  it('should pass', () => {
    expect(true).toBe(true);
  });
});
