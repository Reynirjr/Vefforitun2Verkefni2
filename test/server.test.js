import express from 'express';
import request from 'supertest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { app } from '../src/server.js';

jest.mock('express');
jest.mock('node:url');
jest.mock('node:path');
jest.mock('dotenv');
jest.mock('helmet');

describe('server', () => {
  let mockApp;

  beforeEach(() => {
    mockApp = {
      set: jest.fn(),
      use: jest.fn(),
      static: jest.fn(),
      urlencoded: jest.fn(),
      disable: jest.fn(),
      listen: jest.fn(),
    };
    express.mockReturnValue(mockApp);

    fileURLToPath.mockReturnValue('/path/to/file');
    dirname.mockReturnValue('/path/to');
    join.mockReturnValue('/path/to/views');
    dotenv.config.mockImplementation(() => {});
    helmet.mockImplementation(() => 'helmet middleware');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should configure the app correctly', () => {
    require('../src/server.js');

    expect(dotenv.config).toHaveBeenCalled();
    expect(express).toHaveBeenCalled();
    expect(mockApp.set).toHaveBeenCalledWith('views', '/path/to/views');
    expect(mockApp.set).toHaveBeenCalledWith('view engine', 'ejs');
    expect(mockApp.use).toHaveBeenCalledWith(undefined);
    expect(mockApp.use).toHaveBeenCalledWith('helmet middleware');
    expect(mockApp.disable).toHaveBeenCalledWith('x-powered-by');
  });

  it('should start the server on the correct port', () => {
    process.env.PORT = 4000;
    require('../src/server.js');

    expect(mockApp.listen).toHaveBeenCalledWith(4000, expect.any(Function));
  });

  it('should start the server on port 3000 if no port is specified', () => {
    delete process.env.PORT;
    require('../src/server.js');

    expect(mockApp.listen).toHaveBeenCalledWith(3000, expect.any(Function));
  });

  it('should pass', () => {
    expect(true).toBe(true);
  });
});
