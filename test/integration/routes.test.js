import { describe, it, expect, vi, beforeEach } from 'vitest';
import { router } from '../../src/routes.js';

vi.mock('../../src/lib/db.client.js', () => ({
  getDatabase: vi.fn()
}));

describe('Router', () => {
  let mockDb;
  
  beforeEach(async () => {
    mockDb = {
      query: vi.fn()
    };
    
    const { getDatabase } = await import('../../src/lib/db.client.js');
    getDatabase.mockReturnValue(mockDb);
  });
  
  describe('GET /', () => {
    it('should render index with categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Category 1' },
        { id: 2, name: 'Category 2' }
      ];
      
      mockDb.query.mockResolvedValue({ rows: mockCategories });
      
      const mockReq = {};
      const mockRender = vi.fn();
      const mockRes = {
        render: mockRender
      };
      
      const indexRouteHandler = router.stack
        .find(layer => layer.route && layer.route.path === '/')
        .route.stack[0].handle;
      
      await indexRouteHandler(mockReq, mockRes);
      
      expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM categories');
      expect(mockRender).toHaveBeenCalledWith('index', {
        title: 'Forsíða',
        categories: mockCategories
      });
    });
  });
  
  describe('GET /spurningar/:category', () => {
    it('should render questions with answers for a category', async () => {
      const mockQuestions = [
        { id: 1, question: 'Question 1', category_id: 1 }
      ];
      
      const mockAnswers = [
        { id: 1, answer: 'Answer 1', is_correct: true, question_id: 1 },
        { id: 2, answer: 'Answer 2', is_correct: false, question_id: 1 }
      ];
      
      mockDb.query.mockImplementation((query, _params) => {
        void _params;
        if (query.includes('FROM questions')) {
          return Promise.resolve({ rows: mockQuestions });
        }
        if (query.includes('FROM answers')) {
          return Promise.resolve({ rows: mockAnswers });
        }
        return Promise.resolve({ rows: [] });
      });
      
      const mockReq = { params: { category: '1' } };
      const mockRender = vi.fn();
      const mockRes = { render: mockRender };
      const mockNext = vi.fn();
      
      const categoryRouteHandler = router.stack
        .find(layer => layer.route && layer.route.path === '/spurningar/:category(\\d+)')
        .route.stack[0].handle;
      
      await categoryRouteHandler(mockReq, mockRes, mockNext);
      
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM questions WHERE category_id = $1',
        ['1']
      );
      
      expect(mockRender).toHaveBeenCalledWith('questions', {
        title: 'Spurningar',
        categoryId: '1',
        questions: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            question: 'Question 1',
            answers: mockAnswers
          })
        ])
      });
    });
  });
});
