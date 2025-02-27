import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '../../src/lib/logger.js';

describe('Logger', () => {
  let originalConsole;
  
  beforeEach(() => {
    originalConsole = {
      info: console.info,
      warn: console.warn,
      error: console.error
    };
    
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  });
  
  afterEach(() => {
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  describe('with silent = false (default)', () => {
    it('should call console.info when info is called', () => {
      const logger = new Logger();
      logger.info('test message');
      expect(console.info).toHaveBeenCalledWith('test message');
    });

    it('should call console.warn when warn is called', () => {
      const logger = new Logger();
      logger.warn('test warning');
      expect(console.warn).toHaveBeenCalledWith('test warning');
    });

    it('should call console.error when error is called', () => {
      const logger = new Logger();
      logger.error('test error');
      expect(console.error).toHaveBeenCalledWith('test error');
    });
  });

  describe('with silent = true', () => {
    it('should not call console.info when info is called', () => {
      const logger = new Logger(true);
      logger.info('test message');
      expect(console.info).not.toHaveBeenCalled();
    });

    it('should not call console.warn when warn is called', () => {
      const logger = new Logger(true);
      logger.warn('test warning');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should not call console.error when error is called', () => {
      const logger = new Logger(true);
      logger.error('test error');
      expect(console.error).not.toHaveBeenCalled();
    });
  });
});
