import express from 'express';
import request from 'supertest';
import { getDatabase } from '../src/lib/db.client.js';
import { logger } from '../src/lib/logger.js';
import { environment } from '../src/lib/environment.js';
import { router } from '../src/routes.js';

jest.mock('../src/lib/db.client.js');
jest.mock('../src/lib/logger.js');
jest.mock('../src/lib/environment.js');
jest.mock('express');

describe('routes', () => {
  let mockDb;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
    };
    getDatabase.mockReturnValue(mockDb);

    mockReq = {
      params: {},
      body: {},
      session: {},
    };
    mockRes = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockNext = jest.fn();

    environment.mockReturnValue({ connectionString: 'test' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('indexRoute should render index with categories', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 1, name: 'Category 1' }] });
    await router.stack[0].route.stack[0].handle(mockReq, mockRes, mockNext); // Assuming indexRoute is the first route
    expect(mockRes.render).toHaveBeenCalledWith('index', {
      title: 'Forsíða',
      categories: [{ id: 1, name: 'Category 1' }],
    });
  });

  it('categoryRoute should render questions with questions and answers', async () => {
    mockReq.params.category = '1';
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ id: 1, question: 'Q1', category_id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, answer: 'A1', question_id: 1 }] });

    await router.stack[1].route.stack[0].handle(mockReq, mockRes, mockNext); // Assuming categoryRoute is the second route

    expect(mockRes.render).toHaveBeenCalledWith('questions', {
      title: 'Spurningar',
      categoryId: '1',
      questions: [{ id: 1, question: 'Q1', category_id: 1, answers: [{ id: 1, answer: 'A1', question_id: 1 }] }],
    });
  });

  it('createQuestionFormRoute should render form with categories', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 1, name: 'Category 1' }] });
    await router.stack[2].route.stack[0].handle(mockReq, mockRes, mockNext); // Assuming createQuestionFormRoute is the third route
    expect(mockRes.render).toHaveBeenCalledWith('form', {
      title: 'Bæta við spurningu',
      data: {},
      errors: [],
      invalidFields: [],
      categories: [{ id: 1, name: 'Category 1' }],
    });
  });

  describe('createQuestionRoute', () => {
    it('should render form with errors if validation fails', async () => {
      mockReq.body = { question: 'Short', category: null, answers: ['', ''] };
      mockDb.query.mockResolvedValue({ rows: [{ id: 1, name: 'Category 1' }] });
      await router.stack[3].route.stack[0].handle(mockReq, mockRes, mockNext); // Assuming createQuestionRoute is the fourth route
      expect(mockRes.render).toHaveBeenCalledWith(
        'form',
        expect.objectContaining({
          title: 'Bæta við spurningu',
          errors: expect.any(Array),
          invalidFields: expect.any(Array),
          data: mockReq.body,
          categories: expect.any(Array),
        })
      );
    });

    it('should insert question and answers and redirect on success', async () => {
      mockReq.body = { question: 'Valid question with 10 chars', category: '1', answers: ['Answer 1', 'Answer 2'], correctAnswer: '0' };
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // For inserting question
      mockDb.query.mockResolvedValue({ rows: [] }); // For inserting answers
      await router.stack[3].route.stack[0].handle(mockReq, mockRes, mockNext); // Assuming createQuestionRoute is the fourth route
      expect(mockDb.query).toHaveBeenCalledTimes(3);
      expect(mockRes.redirect).toHaveBeenCalledWith('/');
    });
  });

  describe('answerAllQuestionsRoute', () => {
    it('should calculate results and render questions with result', async () => {
      mockReq.params.category = '1';
      mockReq.body = { selectedAnswers: { '1': '0' } };
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1, question: 'Q1', category_id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, answer: 'A1', question_id: 1, is_correct: true, display_index: 0 }] });
      await router.stack[4].route.stack[0].handle(mockReq, mockRes, mockNext); // Assuming answerAllQuestionsRoute is the fifth route
      expect(mockRes.render).toHaveBeenCalledWith(
        'questions',
        expect.objectContaining({
          title: 'Spurningar',
          categoryId: '1',
          questions: expect.any(Array),
          result: expect.any(Object),
        })
      );
    });
  });
});
