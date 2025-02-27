import { Logger } from '../../src/lib/logger';

describe('Logger', () => {
  let logger;
  let consoleInfoSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log info messages when silent is false', () => {
    logger = new Logger(false);
    logger.info('Test info message');
    expect(consoleInfoSpy).toHaveBeenCalledWith('Test info message');
  });

  it('should not log info messages when silent is true', () => {
    logger = new Logger(true);
    logger.info('Test info message');
    expect(consoleInfoSpy).not.toHaveBeenCalled();
  });

  it('should log warn messages when silent is false', () => {
    logger = new Logger(false);
    logger.warn('Test warn message');
    expect(consoleWarnSpy).toHaveBeenCalledWith('Test warn message');
  });

  it('should not log warn messages when silent is true', () => {
    logger = new Logger(true);
    logger.warn('Test warn message');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should log error messages when silent is false', () => {
    logger = new Logger(false);
    logger.error('Test error message');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Test error message');
  });

  it('should not log error messages when silent is true', () => {
    logger = new Logger(true);
    logger.error('Test error message');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
