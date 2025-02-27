import { environment } from '../../src/lib/environment';
import { logger } from '../../src/lib/logger';

jest.mock('../../src/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('environment', () => {
  let env;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return parsed environment if already parsed', () => {
    const initialEnv = { PORT: '3000', DATABASE_URL: 'test_url' };
    environment(initialEnv, logger);
    const result = environment(initialEnv, logger);
    expect(result).toEqual({ port: 3000, connectionString: 'test_url' });
  });

  it('should parse environment variables successfully', () => {
    env = { PORT: '4000', DATABASE_URL: 'test_url' };
    const result = environment(env, logger);
    expect(result).toEqual({ port: 4000, connectionString: 'test_url' });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should use default port if PORT is not defined', () => {
    env = { DATABASE_URL: 'test_url' };
    const result = environment(env, logger);
    expect(result).toEqual({ port: 3000, connectionString: 'test_url' });
    expect(logger.info).toHaveBeenCalledWith('PORT not defined, using default port', 3000);
  });

  it('should log error and return null if DATABASE_URL is not defined', () => {
    env = { PORT: '4000' };
    const result = environment(env, logger);
    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalledWith('DATABASE_URL must be defined as a string');
  });

  it('should log error and return null if PORT is not a number', () => {
    env = { PORT: 'not_a_number', DATABASE_URL: 'test_url' };
    const result = environment(env, logger);
    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalledWith('PORT must be defined as a number', 'not_a_number');
  });
});
